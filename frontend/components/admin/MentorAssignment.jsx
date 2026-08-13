'use client';
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../shared/LoadingSpinner';

const StudentMentorRow = memo(({ student, facultyList, onAssignMentor }) => {
  const [selectedMentor, setSelectedMentor] = useState(student.mentorId || '');

  useEffect(() => {
    setSelectedMentor(student.mentorId || '');
  }, [student.mentorId]);

  const handleChange = (e) => {
    const val = e.target.value;
    setSelectedMentor(val);
    onAssignMentor(student.id, val ? parseInt(val) : null);
  };

  return (
    <tr className="border-b border-zinc-200 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors font-mono text-xs">
      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
        {student.name}
        <span className="block text-[10px] text-zinc-400 font-normal">{student.email}</span>
      </td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
        {student.studentId || '—'}
      </td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
        {student.department || student.programCategory || '—'}
      </td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
        {student.program || '—'} {student.year ? `(Yr ${student.year})` : ''}
      </td>
      <td className="px-4 py-3">
        <select
          value={selectedMentor}
          onChange={handleChange}
          className="w-full max-w-xs px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
        >
          <option value="">-- Select Faculty Mentor --</option>
          {facultyList.map(f => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.department || 'Faculty'}) [{f.menteeCount || 0} mentees]
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
});
StudentMentorRow.displayName = 'StudentMentorRow';

export default function MentorAssignment() {
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', show: false });

  // Bulk State
  const [bulkMentorId, setBulkMentorId] = useState('');
  const [bulkDept, setBulkDept] = useState('all');
  const [bulkYear, setBulkYear] = useState('all');
  const [bulkExecuting, setBulkExecuting] = useState(false);

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getMentors();
      setFaculty(res.faculty || []);
      setStudents(res.students || []);
    } catch (err) {
      console.error('Fetch mentors error:', err);
      showToast('error', 'Failed to load mentor assignments');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignSingle = useCallback(async (studentId, mentorId) => {
    try {
      const res = await adminAPI.assignMentor({ studentId, mentorId });
      showToast('success', res.message);
      fetchData();
    } catch (err) {
      showToast('error', err.message || 'Failed to update mentor assignment');
    }
  }, [fetchData, showToast]);

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    if (!bulkMentorId) {
      showToast('error', 'Please select a faculty mentor for bulk assignment.');
      return;
    }

    setBulkExecuting(true);
    try {
      const res = await adminAPI.assignMentor({
        mentorId: parseInt(bulkMentorId),
        bulkFilter: {
          department: bulkDept !== 'all' ? bulkDept : undefined,
          year: bulkYear !== 'all' ? parseInt(bulkYear) : undefined,
          unassignedOnly,
        }
      });
      showToast('success', res.message);
      fetchData();
    } catch (err) {
      showToast('error', err.message || 'Bulk assignment failed');
    } finally {
      setBulkExecuting(false);
    }
  };

  const departments = useMemo(() => {
    return [...new Set(students.map(s => s.department || s.programCategory).filter(Boolean))].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.studentId && s.studentId.toLowerCase().includes(search.toLowerCase()));

      const matchesUnassigned = !unassignedOnly || !s.mentorId;
      return matchesSearch && matchesUnassigned;
    });
  }, [students, search, unassignedOnly]);

  if (loading && students.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading mentor assignment console..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {message.show && (
        <div className={`rounded border p-3 text-xs font-mono transition-all ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.type === 'success' ? '✓ ' : '✕ '}{message.text}</span>
            <button onClick={() => setMessage(prev => ({ ...prev, show: false }))} className="ml-4 underline hover:opacity-80">
              [Dismiss]
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
        <div>
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
              Academic Governance
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {faculty.length} Faculty Mentors Registered
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
            Faculty Mentor-Mentee Assignment
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Assign assigned faculty advisors to students for Stage 1 co-curricular verification
          </p>
        </div>

        {/* Bulk Assignment Bar */}
        <form onSubmit={handleBulkAssign} className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-xs space-y-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block font-bold">Bulk Mentor Assignment Tool</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block mb-1 text-zinc-500">Target Faculty Mentor *</label>
              <select
                value={bulkMentorId}
                onChange={e => setBulkMentorId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              >
                <option value="">-- Choose Mentor --</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.department || 'Faculty'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-zinc-500">Filter Department</label>
              <select
                value={bulkDept}
                onChange={e => setBulkDept(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-zinc-500">Filter Academic Year</label>
              <select
                value={bulkYear}
                onChange={e => setBulkYear(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={bulkExecuting || !bulkMentorId}
              className="w-full px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {bulkExecuting ? 'Assigning...' : 'Execute Bulk Assignment'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Bar & Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <input
            type="text"
            placeholder="Search student name, email, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-72 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
          />

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <input
              type="checkbox"
              id="unassignedOnly"
              checked={unassignedOnly}
              onChange={e => setUnassignedOnly(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600"
            />
            <label htmlFor="unassignedOnly" className="text-zinc-600 dark:text-zinc-400">
              Show Unassigned Mentees Only
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-mono uppercase text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3">Student Name</th>
                <th scope="col" className="px-4 py-3">Student ID</th>
                <th scope="col" className="px-4 py-3">Department</th>
                <th scope="col" className="px-4 py-3">Program & Year</th>
                <th scope="col" className="px-4 py-3">Assigned Faculty Mentor</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 font-mono">
                    No students match search or unassigned filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <StudentMentorRow
                    key={student.id}
                    student={student}
                    facultyList={faculty}
                    onAssignMentor={handleAssignSingle}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
