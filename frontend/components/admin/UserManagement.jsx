'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { adminAPI } from '../../utils/api';
import { USER_ROLES, API_BASE_URL } from '../../utils/constants';
import { PROGRAM_CATEGORIES, UNIVERSITY_PROGRAMS, getProgramsByCategory, getSpecializations, getCategoryKey } from '../../utils/programsData';
import LoadingSpinner, { TableSkeleton } from '../shared/LoadingSpinner';

const Modal = ({ isOpen, onClose, title, children, modalRef, maxWidth = 'max-w-md' }) => {
  const containerRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement;

    const modalElement = modalRef?.current || containerRef.current;
    if (!modalElement) return;

    const getFocusableElements = () => {
      return Array.from(
        modalElement.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      modalElement.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const currentFocusables = getFocusableElements();
        if (currentFocusables.length === 0) return;

        const firstElement = currentFocusables[0];
        const lastElement = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, modalRef]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 font-mono"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={(node) => {
          containerRef.current = node;
          if (typeof modalRef === 'function') modalRef(node);
          else if (modalRef) modalRef.current = node;
        }}
        tabIndex={-1}
        className={`relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h3>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
            >
              [✕]
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const UserTableRow = React.memo(({ userData, onToggleStatus, onEditUser, onDeleteUser, onViewDetails, currentUser, actionLoading, getProfileImageUrl, formatProgramDisplay }) => {
  const isSelf = userData.id === currentUser?.id;
  const profileUrl = getProfileImageUrl(userData.profilePicture);
  
  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 overflow-hidden flex-shrink-0">
            {profileUrl ? (
              <Image src={profileUrl} alt={userData.name} width={32} height={32} className="w-8 h-8 object-cover" unoptimized />
            ) : (
              userData.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]" title={userData.name}>
                {userData.name}
              </span>
              {isSelf && (
                <span className="text-[9px] font-mono px-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  YOU
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]" title={userData.email}>
              {userData.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 font-mono">
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
          userData.role === USER_ROLES.ADMIN
            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900'
            : userData.role === USER_ROLES.FACULTY
            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
        }`}>
          {userData.role}
        </span>
      </td>

      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
        <div className="truncate max-w-[180px]" title={formatProgramDisplay(userData)}>
          {formatProgramDisplay(userData)}
        </div>
        {userData.studentId && (
          <span className="text-[10px] text-zinc-400 font-mono block">ID: {userData.studentId}</span>
        )}
      </td>

      <td className="px-4 py-3 font-mono">
        <button
          onClick={() => onToggleStatus(userData.id, userData.isActive)}
          disabled={actionLoading === userData.id || isSelf}
          className={`flex items-center space-x-1.5 text-xs ${isSelf ? 'cursor-not-allowed opacity-60' : 'hover:opacity-80'}`}
        >
          <span className={`w-2 h-2 rounded-full ${userData.isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
          <span className={userData.isActive ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-zinc-500'}>
            {userData.isActive ? 'Active' : 'Inactive'}
          </span>
        </button>
      </td>

      <td className="px-4 py-3 font-mono text-right">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onViewDetails(userData)}
            className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
          >
            Details
          </button>
          <button
            onClick={() => onEditUser(userData)}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => onDeleteUser(userData.id)}
            disabled={actionLoading === userData.id || userData.role === USER_ROLES.ADMIN || userData.id === currentUser?.id}
            className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
});
UserTableRow.displayName = 'UserTableRow';

const UserManagement = ({ user, token, onNavigate }) => {
  const backendBaseUrl = API_BASE_URL.replace('/api', '');
  
  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    return profilePicture.startsWith('http') 
      ? profilePicture 
      : `${backendBaseUrl}${profilePicture}`;
  };

  const formatProgramDisplay = (userData) => {
    if (userData.role === 'student' && userData.program) {
      const parts = [userData.program];
      if (userData.specialization) {
        parts.push(userData.specialization);
      }
      return parts.join(' - ');
    }
    if (userData.role === 'faculty') {
      return userData.programCategory || userData.department || 'Not specified';
    }
    return userData.department || 'Not specified';
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    programCategory: 'all',
    program: 'all',
    specialization: 'all',
    year: 'all',
    admissionYear: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Bulk Import Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    programCategory: '',
    program: '',
    specialization: '',
    year: '',
    admissionYear: '',
    studentId: ''
  });

  const modalRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params[key] = filters[key];
        }
      });
      
      const data = await adminAPI.getUsers(params);
      setUsers(data.users || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Users fetch error:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showSuccessMessage = useCallback((text) => {
    setMessage({ type: 'success', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const showErrorMessage = useCallback((text) => {
    setMessage({ type: 'error', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const handleToggleStatus = useCallback(async (userId, currentStatus) => {
    setActionLoading(userId);
    try {
      await adminAPI.toggleUserStatus(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
      showSuccessMessage(`User status updated to ${!currentStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      showErrorMessage(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }, [showSuccessMessage, showErrorMessage]);

  const handleDeleteUser = useCallback(async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setActionLoading(userId);
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      showSuccessMessage('User account deleted successfully.');
    } catch (err) {
      showErrorMessage(`Delete failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }, [showSuccessMessage, showErrorMessage]);

  const handleAddUser = useCallback(() => {
    setSelectedUser(null);
    setFormData({
      name: '', email: '', password: '', role: 'student',
      department: '', programCategory: '', program: '',
      specialization: '', year: '', admissionYear: '', studentId: ''
    });
    setShowAddModal(true);
  }, []);

  const handleEditUser = useCallback((userData) => {
    setSelectedUser(userData);
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
      password: '',
      role: userData.role || 'student',
      department: userData.department || '',
      programCategory: userData.programCategory || '',
      program: userData.program || '',
      specialization: userData.specialization || '',
      year: userData.year || '',
      admissionYear: userData.admissionYear || '',
      studentId: userData.studentId || ''
    });
    setShowEditModal(true);
  }, []);

  const handleSubmitForm = useCallback(async (e) => {
    e.preventDefault();
    setActionLoading('submit');
    try {
      if (selectedUser) {
        const response = await adminAPI.updateUser(selectedUser.id, formData);
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? response.user : u));
        setShowEditModal(false);
        showSuccessMessage(`${formData.name} has been updated successfully.`);
      } else {
        const response = await adminAPI.createUser(formData);
        setUsers(prev => [response.user, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        setShowAddModal(false);
        showSuccessMessage(`${formData.name} has been created successfully.`);
      }
    } catch (err) {
      showErrorMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }, [formData, selectedUser, showSuccessMessage, showErrorMessage]);

  // Handle CSV Bulk Import
  const handleRunBulkImport = useCallback(async () => {
    if (!bulkCsvText.trim()) {
      showErrorMessage('Please paste or upload CSV content before importing.');
      return;
    }

    setBulkImporting(true);
    setBulkResult(null);

    try {
      // Parse CSV text into array of row objects
      const lines = bulkCsvText.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one data row.');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }

      const response = await adminAPI.bulkImportUsers({ rows, fileName: 'admin_bulk_import.csv' });
      setBulkResult(response);
      showSuccessMessage(`Bulk import processed: ${response.createdList?.length || 0} created.`);
      fetchUsers();
    } catch (err) {
      console.error('Bulk import error:', err);
      showErrorMessage(`Bulk import error: ${err.message}`);
    } finally {
      setBulkImporting(false);
    }
  }, [bulkCsvText, fetchUsers, showSuccessMessage, showErrorMessage]);

  const handleDownloadSampleCsv = useCallback(() => {
    const sample = `name,email,role,department,program,year,studentId\nJohn Doe,john.doe@university.edu,student,Computer Science & Engineering,Bachelor of Technology,3,STU-2026-001\nJane Smith,jane.smith@university.edu,faculty,Computer Science & Engineering,,,\n`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'smart_student_hub_bulk_users_sample.csv';
    link.click();
  }, []);

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast Message */}
      {message.show && (
        <div className={`rounded border p-3 text-xs font-mono transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.type === 'success' ? '✓ ' : '✕ '}{message.text}</span>
            <button
              onClick={() => setMessage(prev => ({ ...prev, show: false }))}
              className="ml-4 underline hover:opacity-80"
            >
              [Dismiss]
            </button>
          </div>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Directory & Access Control
              </span>
              <span className="text-xs font-mono text-zinc-400">•</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {pagination.total} Records Total
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              User Management & Onboarding
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              Manage accounts, assign academic roles, and execute bulk CSV student/faculty onboarding
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto font-mono text-xs">
            <button 
              onClick={() => { setShowBulkModal(true); setBulkResult(null); setBulkCsvText(''); }}
              className="px-3.5 py-2 rounded font-medium border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
            >
              📥 Bulk Import Users (CSV)
            </button>
            <button 
              onClick={handleAddUser}
              className="px-3.5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              + Add New User
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search name, email, student ID, program..."
          value={filters.search}
          onChange={(e) => {
            setFilters(prev => ({ ...prev, search: e.target.value }));
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="w-full sm:w-80 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
        />

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <select
            value={filters.role}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, role: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-48 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Account Roles</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Program / Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {users.map((userData) => (
                <UserTableRow
                  key={userData.id}
                  userData={userData}
                  onToggleStatus={handleToggleStatus}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                  onViewDetails={(u) => { setSelectedUser(u); setShowDetailsModal(true); }}
                  currentUser={user}
                  actionLoading={actionLoading}
                  getProfileImageUrl={getProfileImageUrl}
                  formatProgramDisplay={formatProgramDisplay}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
            <span className="text-zinc-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} Users)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BULK CSV IMPORT MODAL */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk User Onboarding via CSV Upload"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded space-y-1">
            <p className="font-bold text-zinc-900 dark:text-zinc-100">Instructions & Required Header Format:</p>
            <p className="text-zinc-500">Headers: <code className="text-indigo-600 dark:text-indigo-400">name, email, role, department, program, year, studentId</code></p>
            <button
              onClick={handleDownloadSampleCsv}
              className="text-indigo-600 dark:text-indigo-400 underline font-semibold text-[11px] pt-1 block"
            >
              [Download Sample CSV Template]
            </button>
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">Paste CSV Content (or Edit Rows Directly):</label>
            <textarea
              rows={8}
              value={bulkCsvText}
              onChange={(e) => setBulkCsvText(e.target.value)}
              placeholder="name,email,role,department,program,year,studentId&#10;John Doe,john.doe@university.edu,student,Computer Science & Engineering,Bachelor of Technology,3,STU-2026-001"
              className="w-full p-3 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-950 text-indigo-300 font-mono text-[11px] focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] text-zinc-400">
              * Temporary password <code className="text-zinc-200">Hub#2026@Temp</code> will be assigned. Users are forced to reset on 1st login.
            </span>
            <button
              onClick={handleRunBulkImport}
              disabled={bulkImporting || !bulkCsvText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-colors disabled:opacity-50"
            >
              {bulkImporting ? 'Processing Import...' : 'Run Bulk Import'}
            </button>
          </div>

          {/* Import Result Audit Log Table */}
          {bulkResult && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded text-emerald-800 dark:text-emerald-300 font-bold text-xs flex justify-between">
                <span>✓ Import Executed Successfully</span>
                <span>Created: {bulkResult.importSummary?.createdCount} | Skipped: {bulkResult.importSummary?.skippedCount} | Errors: {bulkResult.importSummary?.errorCount}</span>
              </div>

              {/* Per-Row Errors / Skips List */}
              {bulkResult.skippedList?.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-bold uppercase">Skipped Duplicate Accounts:</p>
                  {bulkResult.skippedList.map((s, idx) => (
                    <p key={idx}>• Row {s.row}: {s.email} — {s.reason}</p>
                  ))}
                </div>
              )}

              {bulkResult.errorList?.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded text-[11px] text-rose-800 dark:text-rose-300 space-y-1">
                  <p className="font-bold uppercase">Validation Errors:</p>
                  {bulkResult.errorList.map((err, idx) => (
                    <p key={idx}>• Row {err.row}: {err.email || 'N/A'} — {err.reason}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ADD / EDIT USER MODAL */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); }}
        title={showEditModal ? `Edit User Account: ${selectedUser?.name || ''}` : 'Add New User Account'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-zinc-500">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Arpan Pramanik"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block mb-1 text-zinc-500">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="e.g. user@university.edu"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block mb-1 text-zinc-500">{showEditModal ? 'Password (leave blank to keep current)' : 'Password *'}</label>
              <input
                type="password"
                required={!showEditModal}
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block mb-1 text-zinc-500">Account Role *</label>
              <select
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty Advisor / Mentor</option>
                <option value="admin">Institutional Administrator</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block mb-1 text-zinc-500">Student ID / Roll No *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={e => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                    placeholder="e.g. STU-2026-001"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-zinc-500">Academic Program Category *</label>
                  <select
                    value={formData.programCategory}
                    onChange={e => setFormData(prev => ({ ...prev, programCategory: e.target.value, program: '', specialization: '' }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Choose Category --</option>
                    {Object.values(PROGRAM_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-zinc-500">Program *</label>
                  <select
                    value={formData.program}
                    disabled={!formData.programCategory}
                    onChange={e => setFormData(prev => ({ ...prev, program: e.target.value, specialization: '' }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                  >
                    <option value="">-- Choose Program --</option>
                    {getProgramsByCategory(formData.programCategory).map(p => (
                      <option key={p.name} value={p.name}>{p.name} ({p.degree})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-zinc-500">Specialization</label>
                  <select
                    value={formData.specialization}
                    disabled={!formData.program}
                    onChange={e => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                  >
                    <option value="">-- Choose Specialization --</option>
                    {getSpecializations(formData.programCategory, formData.program).map(s => (
                      <option key={typeof s === 'string' ? s : s.name} value={typeof s === 'string' ? s : s.name}>
                        {typeof s === 'string' ? s : s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-zinc-500">Academic Year (1-4)</label>
                  <select
                    value={formData.year}
                    onChange={e => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Select Year --</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-zinc-500">Admission Year *</label>
                  <input
                    type="number"
                    min="2018"
                    max="2030"
                    value={formData.admissionYear}
                    onChange={e => setFormData(prev => ({ ...prev, admissionYear: e.target.value }))}
                    placeholder="e.g. 2024"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </>
            )}

            {formData.role !== 'student' && (
              <div className="sm:col-span-2">
                <label className="block mb-1 text-zinc-500">Department / Domain</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
              className="px-3.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'submit'}
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
            >
              {actionLoading === 'submit' ? 'Saving...' : showEditModal ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* USER DETAILS MODAL */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="User Account Details"
        maxWidth="max-w-lg"
      >
        {selectedUser && (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center space-x-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                {selectedUser.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{selectedUser.name}</h4>
                <p className="text-zinc-500">{selectedUser.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${
                  selectedUser.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  selectedUser.role === 'faculty' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  ● {selectedUser.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-b border-zinc-200 dark:border-zinc-800 py-3">
              <div>
                <span className="text-[10px] text-zinc-400 block">Student ID / Roll No</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.studentId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Account Status</span>
                <span className={selectedUser.isActive ? 'text-emerald-600 font-bold' : 'text-zinc-500'}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Program Category</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.programCategory || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Academic Program</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.program || selectedUser.department || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Specialization</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.specialization || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Academic Year / Admission</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedUser.year ? `Year ${selectedUser.year}` : ''} {selectedUser.admissionYear ? `(${selectedUser.admissionYear})` : ''}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded font-medium"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
