'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { adminAPI } from '../../utils/api';
import { USER_ROLES, API_BASE_URL } from '../../utils/constants';
import { PROGRAM_CATEGORIES, UNIVERSITY_PROGRAMS, getProgramsByCategory, getSpecializations, getCategoryKey } from '../../utils/programsData';
import LoadingSpinner, { TableSkeleton } from '../shared/LoadingSpinner';

// Extracted as a proper component to avoid hooks-in-callback violation
const Modal = ({ isOpen, onClose, title, children, modalRef }) => {
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
      className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
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
        className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h3>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              type="button"
              aria-label="Close dialog"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserTableRow = React.memo(({ userData, currentUser, getProfileImageUrl, formatProgramDisplay, actionLoading, onViewDetails, onEditUser, onToggleUserStatus, onDeleteUser }) => {
  const avatarUrl = userData.profilePicture ? getProfileImageUrl(userData.profilePicture) : null;
  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt={userData.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded object-cover flex-shrink-0 border border-zinc-200 dark:border-zinc-700"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
              unoptimized
            />
          ) : null}
          <div 
            className={`${avatarUrl ? 'hidden' : 'flex'} w-8 h-8 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs items-center justify-center flex-shrink-0`}
          >
            {userData.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{userData.name}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{userData.email}</p>
            {userData.studentId && (
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400">ID: {userData.studentId}</p>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
          {userData.role}
        </span>
      </td>

      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 truncate max-w-[220px]">
        <p className="truncate">{formatProgramDisplay(userData)}</p>
        {userData.year && <p className="text-[10px] text-zinc-500">Year {userData.year}</p>}
      </td>

      <td className="px-4 py-3">
        <span className="flex items-center space-x-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${userData.isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
          <span className={userData.isActive ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-500'}>
            {userData.isActive ? 'Active' : 'Inactive'}
          </span>
        </span>
      </td>

      <td className="px-4 py-3 text-zinc-500 text-[11px]">
        {new Date(userData.createdAt).toLocaleDateString()}
      </td>

      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onViewDetails(userData)}
            className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline"
          >
            View
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <button
            onClick={() => onEditUser(userData)}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Edit
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <button
            onClick={() => onToggleUserStatus(userData.id)}
            disabled={actionLoading === userData.id || userData.role === USER_ROLES.ADMIN}
            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-40"
          >
            {userData.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
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

  const availablePrograms = useMemo(() => {
    try {
      if (!formData.programCategory) return [];
      const categoryName = PROGRAM_CATEGORIES[formData.programCategory] || formData.programCategory;
      const programs = getProgramsByCategory(categoryName);
      return programs || [];
    } catch (error) {
      console.error('Error getting available programs:', error, formData.programCategory);
      return [];
    }
  }, [formData.programCategory]);

  const availableSpecializations = useMemo(() => {
    try {
      if (!formData.programCategory || !formData.program) return [];
      const categoryName = PROGRAM_CATEGORIES[formData.programCategory] || formData.programCategory;
      const specializations = getSpecializations(categoryName, formData.program);
      return specializations || [];
    } catch (error) {
      console.error('Error getting available specializations:', error, formData.programCategory, formData.program);
      return [];
    }
  }, [formData.programCategory, formData.program]);

  const filterPrograms = useMemo(() => {
    try {
      if (filters.programCategory === 'all') return [];
      const programs = getProgramsByCategory(filters.programCategory);
      return programs || [];
    } catch (error) {
      console.error('Error getting filter programs:', error, filters.programCategory);
      return [];
    }
  }, [filters.programCategory]);

  const filterSpecializations = useMemo(() => {
    try {
      if (filters.programCategory === 'all' || filters.program === 'all') return [];
      const specializations = getSpecializations(filters.programCategory, filters.program);
      return specializations || [];
    } catch (error) {
      console.error('Error getting filter specializations:', error, filters.programCategory, filters.program);
      return [];
    }
  }, [filters.programCategory, filters.program]);

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

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const showSuccessMessage = useCallback((text) => {
    setMessage({ type: 'success', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const showErrorMessage = useCallback((text) => {
    setMessage({ type: 'error', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const handleToggleUserStatus = useCallback(async (userId) => {
    setActionLoading(userId);
    try {
      const response = await adminAPI.toggleUserStatus(userId);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: response.isActive } : u
      ));
      
      const targetUser = users.find(u => u.id === userId);
      const statusText = response.isActive ? 'activated' : 'deactivated';
      showSuccessMessage(`${targetUser?.name} has been ${statusText} successfully.`);
    } catch (error) {
      showErrorMessage(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  }, [users, showSuccessMessage, showErrorMessage]);

  const handleDeleteUser = useCallback(async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    const confirmMessage = targetUser?.role === 'student' 
      ? `⚠️ WARNING: Deleting "${targetUser?.name}" will remove all their activities and portfolio data.\n\nProceed with deletion?`
      : `Are you sure you want to delete "${targetUser?.name}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionLoading(userId);
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      showSuccessMessage(`${targetUser?.name} deleted successfully.`);
      await fetchUsers();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to delete user';
      showErrorMessage(`Delete Failed: ${errorMsg}`);
    } finally {
      setActionLoading(null);
    }
  }, [users, showSuccessMessage, showErrorMessage, fetchUsers]);

  const handleAddUser = useCallback(() => {
    setFormData({
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
    setSelectedUser(null);
    setShowAddModal(true);
  }, []);

  const handleEditUser = useCallback((userData) => {
    const programCategoryKey = userData.programCategory ? getCategoryKey(userData.programCategory) : '';
    
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
      password: '',
      role: userData.role || 'student',
      department: userData.department || '',
      programCategory: programCategoryKey || '',
      program: userData.program || '',
      specialization: userData.specialization || '',
      year: userData.year ? String(userData.year) : '',
      admissionYear: userData.admissionYear ? String(userData.admissionYear) : '',
      studentId: userData.studentId || ''
    });
    setSelectedUser(userData);
    setShowEditModal(true);
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'role') {
        if (value === 'faculty') {
          newData.program = '';
          newData.specialization = '';
          newData.year = '';
          newData.admissionYear = '';
          newData.studentId = '';
        } else if (value === 'admin') {
          newData.programCategory = '';
          newData.program = '';
          newData.specialization = '';
          newData.year = '';
          newData.admissionYear = '';
          newData.studentId = '';
        }
      }
      
      if (name === 'programCategory') {
        newData.program = '';
        newData.specialization = '';
      }
      
      if (name === 'program') {
        newData.specialization = '';
      }
      
      return newData;
    });
  }, []);

  const handleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    setActionLoading('form');

    try {
      if (selectedUser) {
        const { password, ...updateData } = formData;
        const response = await adminAPI.updateUser(selectedUser.id, updateData);
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? { ...u, ...response.user } : u
        ));
        setShowEditModal(false);
        showSuccessMessage(`${formData.name} has been updated successfully.`);
      } else {
        const response = await adminAPI.createUser(formData);
        setUsers(prev => [response.user, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        setShowAddModal(false);
        showSuccessMessage(`${formData.name} has been created successfully.`);
      }
      
      setFormData({
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
    } catch (error) {
      showErrorMessage(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  }, [formData, selectedUser, showSuccessMessage, showErrorMessage]);

  const handleCloseAddModal = useCallback(() => setShowAddModal(false), []);
  const handleCloseEditModal = useCallback(() => setShowEditModal(false), []);
  const handleViewDetails = useCallback((userData) => {
    setSelectedUser(userData);
    setShowDetailsModal(true);
  }, []);
  const handleCloseDetailsModal = useCallback(() => setShowDetailsModal(false), []);

  if (loading && users.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <TableSkeleton rows={6} cols={5} />
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" text="Loading user directory..." />
        </div>
      </div>
    );
  }

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

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-4">
          <div className="flex items-start">
            <span className="w-2 h-2 mt-1.5 rounded-full bg-rose-600 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-xs font-mono font-bold uppercase text-rose-800 dark:text-rose-300">Error Loading User Directory</h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>
              <button 
                onClick={fetchUsers}
                className="mt-2 text-xs font-mono text-rose-700 dark:text-rose-300 underline"
              >
                [Retry Fetch]
              </button>
            </div>
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
              User Management
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage accounts, assign academic roles, and control active status across the institution
            </p>
          </div>
          
          <button 
            onClick={handleAddUser}
            className="px-3.5 py-2 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center space-x-1.5 self-start sm:self-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New User</span>
          </button>
        </div>
        
        {/* Flat Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800">
          <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 rounded p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">STUDENTS</span>
            <p className="text-xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight mt-1">
              {users.filter(u => u.role === 'student').length}
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 rounded p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">FACULTY</span>
            <p className="text-xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight mt-1">
              {users.filter(u => u.role === 'faculty').length}
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 rounded p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">ADMINISTRATORS</span>
            <p className="text-xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight mt-1">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 rounded p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">DOMAINS</span>
            <p className="text-xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight mt-1">
              {Object.values(PROGRAM_CATEGORIES).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Search & Query Filters</span>
          {(filters.search || filters.role !== 'all' || filters.programCategory !== 'all') && (
            <button
              onClick={() => {
                setFilters({ search: '', role: 'all', programCategory: 'all', program: 'all', specialization: 'all', year: 'all', admissionYear: 'all' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              [Clear Filters]
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          {/* Search input */}
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Search by name, email, student ID, program..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Role select */}
          <div>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Roles</option>
              <option value={USER_ROLES.STUDENT}>Student</option>
              <option value={USER_ROLES.FACULTY}>Faculty</option>
              <option value={USER_ROLES.ADMIN}>Admin</option>
            </select>
          </div>

          {/* Category select */}
          <div>
            <select
              value={filters.programCategory}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, programCategory: e.target.value, program: 'all', specialization: 'all' }));
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Categories</option>
              {Object.values(PROGRAM_CATEGORIES).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-zinc-900 dark:text-zinc-100">User Records</span>
          <span className="text-zinc-500">Showing {users.length} of {pagination.total}</span>
        </div>

        {users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th scope="col" className="px-4 py-2.5 font-medium">User Profile</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Role</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Academic Domain / Program</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Created</th>
                    <th scope="col" className="px-4 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {users.map((userData) => (
                    <UserTableRow
                      key={userData.id}
                      userData={userData}
                      currentUser={user}
                      getProfileImageUrl={getProfileImageUrl}
                      formatProgramDisplay={formatProgramDisplay}
                      actionLoading={actionLoading}
                      onViewDetails={handleViewDetails}
                      onEditUser={handleEditUser}
                      onToggleUserStatus={handleToggleUserStatus}
                      onDeleteUser={handleDeleteUser}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages || 1, prev.page + 1) }))}
                  disabled={pagination.page === (pagination.pages || 1)}
                  className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-xs font-mono text-zinc-500">
            <p>No user records found matching query filters.</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={handleCloseAddModal}
        title="Create New User Account"
        modalRef={modalRef}
      >
        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs font-mono">
          <div>
            <label className="block mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              placeholder="e.g. Alex Johnson"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              required
              placeholder="alex@university.edu"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleFormChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(formData.role === 'student' || formData.role === 'faculty') && (
            <div>
              <label className="block mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Program Category *</label>
              <select
                name="programCategory"
                value={formData.programCategory}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              >
                <option value="">Select Category</option>
                {Object.entries(PROGRAM_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'student' && formData.programCategory && (
            <div>
              <label className="block mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Program / Degree *</label>
              <select
                name="program"
                value={formData.program}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              >
                <option value="">Select Program</option>
                {availablePrograms.map((prog) => (
                  <option key={prog.degree} value={prog.degree}>
                    {prog.degree} - {prog.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'student' && (
            <div>
              <label className="block mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Admission Year (Batch) *</label>
              <input
                type="number"
                name="admissionYear"
                value={formData.admissionYear}
                onChange={handleFormChange}
                required
                placeholder="2024"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              />
            </div>
          )}

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCloseAddModal}
              className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'form'}
              className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
            >
              {actionLoading === 'form' ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={handleCloseEditModal}
        title={`Edit User: ${selectedUser?.name}`}
        modalRef={modalRef}
      >
        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs font-mono">
          <div>
            <label className="block mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-zinc-800 dark:text-zinc-200">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              required
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCloseEditModal}
              className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'form'}
              className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
            >
              {actionLoading === 'form' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        title={`User Details: ${selectedUser?.name}`}
        modalRef={modalRef}
      >
        {selectedUser && (
          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded border border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedUser.name}</p>
              <p className="text-zinc-500">{selectedUser.email}</p>
              <p className="text-[10px] text-zinc-400 mt-1">Role: {selectedUser.role.toUpperCase()} • ID #{selectedUser.id}</p>
            </div>

            <div className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
              <p><span className="text-zinc-400">Program Category:</span> {selectedUser.programCategory || 'N/A'}</p>
              <p><span className="text-zinc-400">Program:</span> {selectedUser.program || 'N/A'}</p>
              <p><span className="text-zinc-400">Student ID:</span> {selectedUser.studentId || 'N/A'}</p>
              <p><span className="text-zinc-400">Status:</span> {selectedUser.isActive ? 'Active' : 'Inactive'}</p>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={handleCloseDetailsModal}
                className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
