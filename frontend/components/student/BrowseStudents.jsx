'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { studentAPI } from '../../utils/api';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';
import { API_BASE_URL } from '../../utils/constants';
import { PROGRAM_CATEGORIES, getProgramsByCategory, getSpecializations } from '../../utils/programsData';
import Portfolio from './Portfolio';

const backendBaseUrl = API_BASE_URL.replace('/api', '');

const StudentCard = React.memo(({ student, getProfileImage, getInitials, formatNumber, onSelectStudent }) => {
  const [imageError, setImageError] = useState(false);
  const profileUrl = getProfileImage(student.profilePicture);

  return (
    <div 
      onClick={() => onSelectStudent(student)}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 transition-all hover:border-indigo-600 dark:hover:border-indigo-500 cursor-pointer flex flex-col justify-between space-y-3 font-mono text-xs"
    >
      <div>
        <div className="flex items-start space-x-3">
          {imageError || !profileUrl ? (
            <div className="w-12 h-12 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-sm flex-shrink-0">
              {getInitials(student.name)}
            </div>
          ) : (
            <Image
              src={profileUrl}
              alt={student.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0"
              onError={() => setImageError(true)}
              unoptimized
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] uppercase text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                Year {student.year || 1}
              </span>
              {student.studentId && (
                <span className="text-[10px] text-zinc-400">ID: {student.studentId}</span>
              )}
            </div>
            <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 truncate mt-0.5 font-sans">
              {student.name}
            </h3>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">
              {student.program || student.department || 'N/A'}
            </p>
          </div>
        </div>

        {/* Social Links */}
        {(student.linkedinUrl || student.githubUrl || student.portfolioUrl) && (
          <div className="flex items-center space-x-2 pt-2.5 mt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
            {student.linkedinUrl && <span className="text-indigo-600 dark:text-indigo-400">LinkedIn</span>}
            {student.githubUrl && <span className="text-zinc-600 dark:text-zinc-400">GitHub</span>}
            {student.portfolioUrl && <span className="text-emerald-600 dark:text-emerald-400">Portfolio</span>}
          </div>
        )}
      </div>

      {/* Stats Row & Action Button */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-center bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded border border-zinc-200/60 dark:border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-500 block">ACTIVITIES</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {formatNumber(student.stats?.totalApprovedActivities)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">CREDITS</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatNumber(student.stats?.totalCredits)}
            </span>
          </div>
        </div>

        <button className="w-full py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center justify-center space-x-1">
          <span>View Peer Portfolio →</span>
        </button>
      </div>
    </div>
  );
});

StudentCard.displayName = 'StudentCard';

const BrowseStudents = ({ user, token }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [programCategoryFilter, setProgramCategoryFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [admissionYearFilter, setAdmissionYearFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  const filteredPrograms = useMemo(() => {
    if (programCategoryFilter === 'all') {
      return programs;
    }
    const categoryKey = Object.keys(PROGRAM_CATEGORIES).find(
      key => PROGRAM_CATEGORIES[key] === programCategoryFilter
    );
    if (!categoryKey) return [];
    const categoryPrograms = getProgramsByCategory(categoryKey);
    return categoryPrograms.map(p => p.degree);
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

  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchStudents = useCallback(async (page = 1, search = '', progCat = 'all', prog = 'all', spec = 'all', yr = 'all', admYr = 'all') => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        search: search.trim(),
        programCategory: progCat !== 'all' ? progCat : undefined,
        program: prog !== 'all' ? prog : undefined,
        specialization: spec !== 'all' ? spec : undefined,
        year: yr !== 'all' ? yr : undefined,
        admissionYear: admYr !== 'all' ? admYr : undefined,
      };

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const data = await studentAPI.getAllStudents(params);
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
      setInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStudents(1, '', 'all', 'all', 'all', 'all', 'all');
  }, [fetchStudents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchStudents(1, searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter, fetchStudents]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
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
    setCurrentPage(1);
    fetchStudents(1, '', 'all', 'all', 'all', 'all', 'all');
  }, [fetchStudents]);

  const getProfileImage = useCallback((profilePicture) => {
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
              ← Back to Peer Directory
            </button>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-500">Viewing Student Portfolio:</span>
            <span className="font-bold text-zinc-950 dark:text-zinc-50">{selectedStudent.name}</span>
          </div>

          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200">
            Read-Only Peer View
          </span>
        </div>

        <Portfolio user={selectedStudent} token={token} isReadOnly={true} />
      </div>
    );
  }

  if (loading && !initialLoaded) {
    return (
      <div className="space-y-5 animate-fade-in">
        <CardSkeleton cards={6} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Discovering peer portfolios..." />
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
                Peer Discovery
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                {pagination.total || 0} Peer Profiles
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Browse Peers & Digital Portfolios
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              Explore student achievement showcases across degree programs, academic years, and specializations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <div>
            <label className="block mb-1 text-zinc-500">Search Peers</label>
            <input
              type="text"
              placeholder="Search name, email, program..."
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-4">
            <CardSkeleton cards={4} />
          </div>
        ) : students.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-400 font-mono text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            No peer portfolios found matching selected criteria.
          </div>
        ) : (
          students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              getProfileImage={getProfileImage}
              getInitials={getInitials}
              formatNumber={formatNumber}
              onSelectStudent={setSelectedStudent}
            />
          ))
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-500">
            Page <strong className="text-zinc-800 dark:text-zinc-200">{pagination.page}</strong> of <strong className="text-zinc-800 dark:text-zinc-200">{pagination.pages}</strong>
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-100 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasMore}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-100 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseStudents;
