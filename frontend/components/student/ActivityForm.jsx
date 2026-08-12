'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { studentAPI } from '../../utils/api';
import { ACTIVITY_TYPES } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const ActivityForm = ({ user, token, onSuccess }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    type: 'conference',
    description: '',
    date: '',
    duration: '',
    organizer: '',
    credits: 0
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', show: false });

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    if (type !== 'error') {
      setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'credits') {
      const creditValue = parseFloat(value) || 0;
      if (creditValue > 10) {
        showToast('error', 'Credits request cannot exceed 10 credits per activity.');
        return;
      }
      setFormData(prev => ({ ...prev, [name]: creditValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, [showToast]);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      showToast('error', 'Certificate file size must be less than 5MB.');
      e.target.value = '';
      return;
    }
    setFile(selectedFile);
  }, [showToast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '', show: false });

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      if (file) {
        submitData.append('certificate', file);
      }

      await studentAPI.submitActivity(submitData);
      
      showToast('success', 'Activity submitted successfully! Awaiting faculty review.');
      setFormData({
        title: '', type: 'conference', description: '', date: '', duration: '', organizer: '', credits: 0
      });
      setFile(null);
      
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1200);
      } else {
        setTimeout(() => router.push('/student/activities'), 1200);
      }
    } catch (error) {
      console.error('Submit activity error:', error);
      showToast('error', error.message || 'Failed to submit activity record');
    } finally {
      setLoading(false);
    }
  }, [file, formData, onSuccess, router, showToast]);

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast Notification */}
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

      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Activity Submission
              </span>
              <span className="text-xs font-mono text-zinc-400">•</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                Faculty Credit Evaluation
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Submit New Activity Record
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Log extra-curricular achievements, certificates, or workshops to request academic credit verification
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs self-start md:self-auto">
            <button
              onClick={() => router.push('/student/activities')}
              className="px-3.5 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 transition-colors"
            >
              ← My Activities
            </button>
          </div>
        </div>
      </div>

      {/* Guidance Callout */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-xs space-y-1">
        <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">
          Credit Evaluation Guidelines
        </span>
        <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
          • Final credit allocation will be verified by designated faculty evaluators based on certificate evidence.
        </p>
        <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
          • Attached proof document (PDF, JPG, PNG up to 5MB) is required for NAAC/NIRF compliance.
        </p>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label htmlFor="title" className="block mb-1 text-zinc-500">
              Activity Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. National Web Development Hackathon 2026"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Activity Category */}
          <div>
            <label htmlFor="type" className="block mb-1 text-zinc-500">
              Activity Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              {ACTIVITY_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Activity Date */}
          <div>
            <label htmlFor="date" className="block mb-1 text-zinc-500">
              Activity Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block mb-1 text-zinc-500">
              Duration / Hours
            </label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g. 3 days / 30 hours"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Requested Credits */}
          <div>
            <label htmlFor="credits" className="block mb-1 text-zinc-500">
              Requested Credits (0 – 10)
            </label>
            <input
              type="number"
              id="credits"
              name="credits"
              min="0"
              max="10"
              step="0.5"
              value={formData.credits}
              onChange={handleChange}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Max 10 credits per individual activity submission
            </span>
          </div>

          {/* Organizer */}
          <div className="md:col-span-2">
            <label htmlFor="organizer" className="block mb-1 text-zinc-500">
              Organizer / Institution / Issuer
            </label>
            <input
              type="text"
              id="organizer"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              placeholder="e.g. IIT Bombay / Coursera / IEEE Student Branch"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block mb-1 text-zinc-500">
              Activity Summary & Key Learnings
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief summary of tasks completed, project built, or skills mastered..."
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Certificate Attachment */}
          <div className="md:col-span-2">
            <label htmlFor="file-upload" className="block mb-1 text-zinc-500">
              Certificate / Evidence Attachment (PDF, PNG, JPG up to 5MB)
            </label>
            <div 
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('file-upload')?.click();
                }
              }}
              className="border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg p-5 text-center transition-colors hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                  Select certificate file
                </span>
                <span className="text-zinc-500"> or drag file here</span>
              </label>
              <span className="text-[10px] text-zinc-400 block mt-1">
                Accepted: PDF, PNG, JPG, DOC (Max size: 5MB)
              </span>

              {file && (
                <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded text-emerald-700 dark:text-emerald-300 font-bold inline-block">
                  ✓ Selected File: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => router.push('/student/activities')}
            disabled={loading}
            className="px-4 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1.5"
          >
            {loading ? (
              <span>Submitting Record...</span>
            ) : (
              <span>Submit Record</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivityForm;
