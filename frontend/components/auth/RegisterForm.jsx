'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { authAPI } from '../../utils/api';
import { USER_ROLES } from '../../utils/constants';
import { PROGRAM_CATEGORIES, getProgramsByCategory, getSpecializations } from '../../utils/programsData';

const RegisterForm = ({ onLogin, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: USER_ROLES.STUDENT,
    programCategory: '', program: '', specialization: '',
    year: '', admissionYear: '', studentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const availablePrograms = useMemo(() => {
    if (!formData.programCategory) return [];
    return getProgramsByCategory(formData.programCategory);
  }, [formData.programCategory]);

  const availableSpecializations = useMemo(() => {
    if (!formData.programCategory || !formData.program) return [];
    return getSpecializations(formData.programCategory, formData.program);
  }, [formData.programCategory, formData.program]);

  const programDuration = useMemo(() => {
    const program = availablePrograms.find(p => p.degree === formData.program);
    return program ? program.duration : '';
  }, [availablePrograms, formData.program]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.programCategory) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password.length < 8) { 
      setError('Password must be at least 8 characters long.'); 
      return; 
    }
    if (formData.role === USER_ROLES.STUDENT) {
      if (!formData.program || !formData.year || !formData.studentId) { 
        setError('Program, Academic Year, and Student ID are required for student accounts.'); 
        return; 
      }
      if (!formData.specialization || formData.specialization.trim() === '') { 
        setError('Specialization domain is required for students.'); 
        return; 
      }
      if (!formData.admissionYear) { 
        setError('Admission batch year is required for students.'); 
        return; 
      }
    }
    setLoading(true);
    setError('');

    const submitData = { ...formData };
    if (submitData.role !== USER_ROLES.STUDENT) {
      delete submitData.program;
      delete submitData.specialization;
      delete submitData.year;
      delete submitData.admissionYear;
      delete submitData.studentId;
    } else {
      submitData.year = parseInt(submitData.year, 10);
      submitData.admissionYear = parseInt(submitData.admissionYear, 10);
    }

    try {
      const response = await authAPI.register(submitData);
      onLogin(response.user, response.token);
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify submitted details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'programCategory') { newData.program = ''; newData.specialization = ''; }
      else if (name === 'program') { newData.specialization = ''; }
      return newData;
    });
    if (error) setError('');
  }, [error]);

  const togglePasswordVisibility = useCallback(() => setShowPassword(prev => !prev), []);

  const inputClass = "w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 font-mono text-xs";
  const selectClass = "w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 font-mono text-xs";
  const labelClass = "block mb-1 text-zinc-500 font-mono text-xs";

  return (
    <div className="space-y-4 font-mono text-xs text-zinc-900 dark:text-zinc-100">
      <div>
        <h2 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
          Create new platform account
        </h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Already registered?{' '}
          <button 
            type="button" 
            onClick={onSwitchToLogin} 
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Sign in to existing account
          </button>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
          <span>✕ {error}</span>
        </div>
      )}

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        {/* Role Selector */}
        <div>
          <label htmlFor="role" className={labelClass}>Account Role *</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange} className={selectClass}>
            <option value={USER_ROLES.STUDENT}>Student</option>
            <option value={USER_ROLES.FACULTY}>Faculty / Evaluator</option>
          </select>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="name" className={labelClass}>Full Name *</label>
          <input 
            id="name" 
            name="name" 
            type="text" 
            required 
            value={formData.name} 
            onChange={handleChange} 
            className={inputClass} 
            placeholder="John Doe" 
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className={labelClass}>Email Address *</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            autoComplete="email" 
            required 
            value={formData.email} 
            onChange={handleChange} 
            className={inputClass} 
            placeholder="john@example.edu" 
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className={labelClass}>Password *</label>
            <button 
              type="button" 
              onClick={togglePasswordVisibility} 
              className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              [{showPassword ? 'Hide' : 'Show'}]
            </button>
          </div>
          <input 
            id="password" 
            name="password" 
            type={showPassword ? "text" : "password"} 
            autoComplete="new-password" 
            required 
            minLength={8} 
            value={formData.password} 
            onChange={handleChange} 
            className={inputClass} 
            placeholder="Min 8 chars (letters, numbers, symbols)" 
          />
        </div>

        {/* Program Category */}
        <div>
          <label htmlFor="programCategory" className={labelClass}>Program Category *</label>
          <select 
            id="programCategory" 
            name="programCategory" 
            required 
            value={formData.programCategory} 
            onChange={handleChange} 
            className={selectClass}
          >
            <option value="">Select Category</option>
            {Object.entries(PROGRAM_CATEGORIES).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>

        {/* Student Specific Fields */}
        {formData.role === USER_ROLES.STUDENT && (
          <>
            {formData.programCategory && (
              <div>
                <label htmlFor="program" className={labelClass}>Program / Degree *</label>
                <select 
                  id="program" 
                  name="program" 
                  required 
                  value={formData.program} 
                  onChange={handleChange} 
                  className={selectClass}
                >
                  <option value="">Select Program</option>
                  {availablePrograms.map(prog => (
                    <option key={prog.degree} value={prog.degree}>{prog.degree} - {prog.name} ({prog.duration})</option>
                  ))}
                </select>
              </div>
            )}

            {formData.program && (
              <div>
                <label htmlFor="specialization" className={labelClass}>Specialization Domain *</label>
                <select 
                  id="specialization" 
                  name="specialization" 
                  required 
                  value={formData.specialization} 
                  onChange={handleChange} 
                  className={selectClass}
                >
                  <option value="">Select Specialization</option>
                  {availableSpecializations.length > 0 ? (
                    availableSpecializations.map(spec => <option key={spec} value={spec}>{spec}</option>)
                  ) : (
                    <option value="General">General</option>
                  )}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="year" className={labelClass}>Academic Year *</label>
                <select id="year" name="year" required value={formData.year} onChange={handleChange} className={selectClass}>
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <label htmlFor="admissionYear" className={labelClass}>Admission Batch *</label>
                <select id="admissionYear" name="admissionYear" required value={formData.admissionYear} onChange={handleChange} className={selectClass}>
                  <option value="">Select Batch</option>
                  {[2027,2026,2025,2024,2023,2022,2021,2020].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="studentId" className={labelClass}>Student ID / Roll No *</label>
              <input 
                id="studentId" 
                name="studentId" 
                type="text" 
                required 
                value={formData.studentId} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="2026CS101" 
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-1.5 mt-2"
        >
          {loading ? (
            <span>Creating account...</span>
          ) : (
            <span>Create Account & Sign In →</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
