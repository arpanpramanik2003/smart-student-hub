'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { facultyAPI } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import { PROGRAM_CATEGORIES, getProgramsByCategory, getSpecializations } from '../../utils/programsData';
import LoadingSpinner, { TableSkeleton } from '../shared/LoadingSpinner';
import Portfolio from '../student/Portfolio';

const backendBaseUrl = API_BASE_URL.replace('/api', '');

const StudentRow = React.memo(({ student, getProfileImageUrl, getInitials, formatNumber, onSelectStudent }) => {
  const avatarUrl = getProfileImageUrl(student.profilePicture);
  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center space-x-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={student.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs flex-shrink-0">
              {getInitials(student.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-zinc-950 dark:text-zinc-50 font-sans text-xs truncate">
              {student.name}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">{student.email}</p>
          </div>
        </div>
      </td>

      <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200 font-bold">
        {student.studentId || 'N/A'}
      </td>

      <td className="py-3 px-4">
        <p className="text-zinc-800 dark:text-zinc-200 truncate">{student.program || student.department || 'N/A'}</p>
        {student.specialization && (
          <p className="text-[10px] text-zinc-400 truncate">{student.specialization}</p>
        )}
      </td>

      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
        Year {student.year || 1}
      </td>

      <td className="py-3 px-4">
        <span className="text-zinc-900 dark:text-zinc-100 font-bold">{student.stats?.totalActivities || 0} Total</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-normal">
          {student.stats?.approvedActivities || 0} Approved
        </span>
      </td>

      <td className="py-3 px-4">
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          +{formatNumber(student.stats?.totalCredits)} Credits
        </span>
      </td>

      <td className="py-3 px-4 text-right">
        <button
          onClick={() => onSelectStudent(student)}
          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors"
        >
          View Portfolio →
        </button>
      </td>
    </tr>
  );
});

StudentRow.displayName = 'StudentRow';

const StudentList = ({ user, token }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [programCategoryFilter, setProgramCategoryFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [admissionYearFilter, setAdmissionYearFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    hasMore: false
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  const getProfileImageUrl = useCallback((profilePicture) => {
    if (!profilePicture) return null;
    return profilePicture.startsWith('http') 
      ? profilePicture 
      : `${backendBaseUrl}${profilePicture}`;
  }, []);

  const getInitials = useCallback((name) => {
    return name
      ? name.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('')
      : 'ST';
  }, []);

  const filteredPrograms = useMemo(() => {
    if (programCategoryFilter === 'all') {
      return programs;
    }
    const categoryKey = Object.keys(PROGRAM_CATEGORIES).find(
      key => PROGRAM_CATEGORIES[key] === programCategoryFilter
    );
    if (!categoryKey) return [];
    return getProgramsByCategory(categoryKey).map(p => p.degree);
  }, [programCategoryFilter, programs]);

  const filteredSpecializations = useMemo(() => {
    if (programCategoryFilter === 'all' || programFilter === 'all') {
      return specializations;
    }
    const categoryKey = Object.keys(PROGRAM_CATEGORIES).find(
      key => PROGRAM_CATEGORIES[key] === programCategoryFilter
    );
    if (!categoryKey) return [];
    return getSpecializations(categoryKey, programFilter);
  }, [programCategoryFilter, programFilter, specializations]);

  const fetchStudents = useCallback(async (page = 1, search = '', progCat = 'all', prog = 'all', spec = 'all', yr = 'all', admYr = 'all') => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search: search.trim(),
        programCategory: progCat !== 'all' ? progCat : undefined,
        program: prog !== 'all' ? prog : undefined,
        specialization: spec !== 'all' ? spec : undefined,
        year: yr !== 'all' ? yr : undefined,
        admissionYear: admYr !== 'all' ? admYr : undefined,
      };

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const data = await facultyAPI.getAllStudents(params);
      setStudents(data.students || []);
      setPagination(data.pagination || {});

      if (page === 1 && !search && progCat === 'all') {
        const uniqueProgs = [...new Set(data.students.map(s => s.program).filter(Boolean))].sort();
        const uniqueSpecs = [...new Set(data.students.map(s => s.specialization).filter(Boolean))].sort();
        setPrograms(uniqueProgs);
        setSpecializations(uniqueSpecs);
      }
    } catch (error) {
      console.error('Fetch students error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(1, '', 'all', 'all', 'all', 'all', 'all');
  }, [fetchStudents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchStudents(1, searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter, fetchStudents]);

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchStudents(newPage, searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter, fetchStudents]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setProgramCategoryFilter('all');
    setProgramFilter('all');
    setSpecializationFilter('all');
    setYearFilter('all');
    setAdmissionYearFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchStudents(1, '', 'all', 'all', 'all', 'all', 'all');
  }, [fetchStudents]);

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat().format(num || 0);
  }, []);

  if (selectedStudent) {
    return (
      <div className="space-y-4 text-zinc-900 dark:text-zinc-100 font-sans">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedStudent(null)}
              className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              ← Back to Roster Directory
            </button>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-500">Student Portfolio Showcase:</span>
            <span className="font-bold text-zinc-950 dark:text-zinc-50">{selectedStudent.name}</span>
          </div>

          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200">
            Faculty Evaluator View
          </span>
        </div>

        <Portfolio user={selectedStudent} token={token} isReadOnly={true} />
      </div>
    );
  }

  if (loading && students.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <TableSkeleton rows={5} cols={4} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading student roster directory..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Academic Roster
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                {pagination.total || 0} Registered Students
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Faculty Student Roster
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              Directory of students across degree programs, academic years, and departments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <div>
            <label className="block mb-1 text-zinc-500">Search Students</label>
            <input
              type="text"
              placeholder="Search name, email, ID, program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">Program Category</label>
            <select
              value={programCategoryFilter}
              onChange={(e) => {
                setProgramCategoryFilter(e.target.value);
                setProgramFilter('all');
                setSpecializationFilter('all');
              }}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Categories</option>
              {Object.values(PROGRAM_CATEGORIES).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">Program / Degree</label>
            <select
              value={programFilter}
              onChange={(e) => {
                setProgramFilter(e.target.value);
                setSpecializationFilter('all');
              }}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Programs</option>
              {filteredPrograms.map(prog => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">Specialization</label>
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Specializations</option>
              {filteredSpecializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">Academic Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Academic Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div className="flex items-end">
            {(searchTerm || programCategoryFilter !== 'all' || programFilter !== 'all' || specializationFilter !== 'all' || yearFilter !== 'all' || admissionYearFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="w-full px-3.5 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[10px] uppercase text-zinc-500">
                <th scope="col" className="py-3 px-4 font-semibold">Student Name</th>
                <th scope="col" className="py-3 px-4 font-semibold">Student ID</th>
                <th scope="col" className="py-3 px-4 font-semibold">Program / Department</th>
                <th scope="col" className="py-3 px-4 font-semibold">Year</th>
                <th scope="col" className="py-3 px-4 font-semibold">Submissions</th>
                <th scope="col" className="py-3 px-4 font-semibold">Earned Credits</th>
                <th scope="col" className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No student records matching current filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    getProfileImageUrl={getProfileImageUrl}
                    getInitials={getInitials}
                    formatNumber={formatNumber}
                    onSelectStudent={setSelectedStudent}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">
              Page <strong className="text-zinc-800 dark:text-zinc-200">{pagination.page}</strong> of <strong className="text-zinc-800 dark:text-zinc-200">{pagination.pages}</strong>
            </span>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-40 hover:bg-zinc-100 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasMore}
                className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-40 hover:bg-zinc-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;
