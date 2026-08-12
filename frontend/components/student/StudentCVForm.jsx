'use client';
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { studentAPI } from "../../utils/api";
import { API_BASE_URL } from "../../utils/constants";
import { getStudentProgramDisplay } from "../../utils/userDisplay";
import LoadingSpinner, { SectionSkeleton } from "../shared/LoadingSpinner";

const defaultDetails = {
  tenthResult: "",
  twelfthResult: "",
  address: "",
  languages: "",
  skills: "",
  otherDetails: "",
  profilePicture: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  category: "",
  hobbies: "",
  achievements: "",
  projects: "",
  certifications: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
};

const StudentCVForm = ({ user, isReadOnly = false }) => {
  const academicDisplay = getStudentProgramDisplay(user);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(defaultDetails);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  const [showModal, setShowModal] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { profile } = await studentAPI.getProfile();
      const profileData = { ...defaultDetails, ...profile };
      setProfile(profileData);
      setFormData(profileData);

      if (profileData.profilePicture) {
        if (profileData.profilePicture.startsWith('http')) {
          setProfilePicturePreview(profileData.profilePicture);
        } else {
          const backendBaseUrl = API_BASE_URL.replace('/api', '');
          setProfilePicturePreview(`${backendBaseUrl}${profileData.profilePicture}`);
        }
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      showToast('error', 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isReadOnly && user) {
      const profileData = { ...defaultDetails, ...user };
      setProfile(profileData);
      setFormData(profileData);
      if (profileData.profilePicture) {
        if (profileData.profilePicture.startsWith('http')) {
          setProfilePicturePreview(profileData.profilePicture);
        } else {
          const backendBaseUrl = API_BASE_URL.replace('/api', '');
          setProfilePicturePreview(`${backendBaseUrl}${profileData.profilePicture}`);
        }
      }
      setLoading(false);
    } else {
      fetchProfile();
    }
  }, [isReadOnly, user, fetchProfile]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleProfilePictureChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Profile picture must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, profilePicture: file }));
    }
  }, [showToast]);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      await studentAPI.updateProfile(submitData);
      await fetchProfile();
      setEditMode(false);
      showToast('success', 'Professional profile updated successfully!');
    } catch (error) {
      console.error('Update profile error:', error);
      showToast('error', `Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [formData, fetchProfile, showToast]);

  const completionPercentage = useMemo(() => {
    const fields = Object.keys(defaultDetails);
    const filledFields = fields.filter(field => formData[field] && formData[field] !== '');
    return Math.round((filledFields.length / fields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'academic', label: 'Academic Details' },
    { id: 'skills', label: 'Skills & Projects' },
    { id: 'social', label: 'Social Profiles' },
    { id: 'additional', label: 'Achievements' },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 font-mono text-xs">
        <SectionSkeleton rows={3} />
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" text="Loading profile details..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-5 font-mono text-xs text-zinc-900 dark:text-zinc-100">
      {/* Toast Notification */}
      {message.show && (
        <div className={`rounded border p-3 transition-all ${
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

      {/* Profile Header & Completion Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Curriculum Vitae
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-500">
              {completionPercentage}% Profile Completion
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1 font-sans">
            Student Professional Dossier
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {user.name} • {academicDisplay} • Year {user.year || 1}
          </p>

          {/* Slim 3px Profile Completion Track */}
          <div className="w-full max-w-md bg-zinc-100 dark:bg-zinc-800 h-[3px] rounded-full overflow-hidden mt-2.5">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(!showModal)}
            className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 transition-colors"
          >
            {showModal ? '[Hide Dossier]' : '[Preview Dossier]'}
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-1.5 rounded transition-colors ${
                editMode 
                  ? 'bg-rose-600 text-white font-medium hover:bg-rose-500' 
                  : 'bg-indigo-600 text-white font-medium hover:bg-indigo-500'
              }`}
            >
              {editMode ? 'Cancel Editing' : 'Edit Profile'}
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Form */}
      {editMode && !isReadOnly && (
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {/* Section Selector Tabs */}
          <div className="flex items-center space-x-1 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            {sections.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-1 rounded transition-colors ${
                  activeSection === section.id
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Personal Info Tab */}
          {activeSection === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block mb-1 text-zinc-500">Phone Contact</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="City, State, Country"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Academic Details Tab */}
          {activeSection === 'academic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block mb-1 text-zinc-500">Higher Secondary (12th Grade) Result</label>
                <input
                  type="text"
                  name="twelfthResult"
                  value={formData.twelfthResult}
                  onChange={handleChange}
                  placeholder="e.g. 92.4% (CBSE)"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Secondary (10th Grade) Result</label>
                <input
                  type="text"
                  name="tenthResult"
                  value={formData.tenthResult}
                  onChange={handleChange}
                  placeholder="e.g. 94.0% (ICSE)"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Skills & Projects Tab */}
          {activeSection === 'skills' && (
            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-zinc-500">Technical Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="React, Next.js, Node.js, Python, PostgreSQL, Docker"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Spoken Languages</label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="English, Hindi, Bengali"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Academic & Independent Projects</label>
                <textarea
                  name="projects"
                  rows={3}
                  value={formData.projects}
                  onChange={handleChange}
                  placeholder="Describe your major projects, repositories, or technical builds..."
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Social Profiles Tab */}
          {activeSection === 'social' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block mb-1 text-zinc-500">LinkedIn Profile URL</label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">GitHub Profile URL</label>
                <input
                  type="url"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Portfolio Website URL</label>
                <input
                  type="url"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://yourdomain.dev"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Additional Info Tab */}
          {activeSection === 'additional' && (
            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-zinc-500">Career Objective & Summary</label>
                <textarea
                  name="otherDetails"
                  rows={3}
                  value={formData.otherDetails}
                  onChange={handleChange}
                  placeholder="Write a brief professional summary or career objective..."
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Awards & Achievements</label>
                <textarea
                  name="achievements"
                  rows={2}
                  value={formData.achievements}
                  onChange={handleChange}
                  placeholder="List notable hackathon wins, scholarships, or academic honors..."
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              disabled={saving}
              className="px-3.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
            >
              {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Dossier Preview Box */}
      {showModal && !editMode && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700/60">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">
              Profile Summary Preview
            </span>
            <span className="text-[10px] text-zinc-400">Verified Dossier</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
            <p>Phone: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{profile?.phone || 'N/A'}</strong></p>
            <p>Email: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{user?.email || 'N/A'}</strong></p>
            <p>DOB: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</strong></p>
            <p>12th Grade: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{profile?.twelfthResult || 'N/A'}</strong></p>
            <p>10th Grade: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{profile?.tenthResult || 'N/A'}</strong></p>
            <p>Skills: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{profile?.skills || 'N/A'}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCVForm;
