'use client';
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { adminAPI } from '../../utils/api';
import { ACTIVITY_TYPES, ACHIEVEMENT_LEVELS, NAAC_CRITERIA } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const PolicyRow = memo(({ policy, onToggleStatus, onEdit }) => {
  return (
    <tr className="border-b border-zinc-200 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
      <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100 capitalize">
        {policy.activityType.replace('_', ' ')}
      </td>
      <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300 capitalize">
        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] border border-zinc-200 dark:border-zinc-700">
          {policy.level}
        </span>
      </td>
      <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
        {parseFloat(policy.credits).toFixed(1)} pts
      </td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-semibold">
          {policy.naacCriterion}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500 max-w-xs truncate">
        {policy.description || '—'}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggleStatus(policy.id)}
          className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
            policy.isActive
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-200'
          }`}
        >
          {policy.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onEdit(policy)}
          className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          [Edit Rule]
        </button>
      </td>
    </tr>
  );
});
PolicyRow.displayName = 'PolicyRow';

export default function CreditPolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '', show: false });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    activityType: 'conference',
    level: 'college',
    credits: '1.0',
    naacCriterion: 'Criterion 1',
    description: '',
    isActive: true,
  });

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCreditPolicies();
      setPolicies(res.policies || []);
    } catch (err) {
      console.error('Fetch policies error:', err);
      showToast('error', 'Failed to load credit policies.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleToggleStatus = useCallback(async (id) => {
    try {
      const res = await adminAPI.toggleCreditPolicy(id);
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, isActive: res.policy.isActive } : p));
      showToast('success', res.message);
    } catch (err) {
      showToast('error', err.message || 'Failed to toggle policy status');
    }
  }, [showToast]);

  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setFormData({
      activityType: 'conference',
      level: 'college',
      credits: '1.0',
      naacCriterion: 'Criterion 1',
      description: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = useCallback((policy) => {
    setEditingPolicy(policy);
    setFormData({
      activityType: policy.activityType,
      level: policy.level,
      credits: String(policy.credits),
      naacCriterion: policy.naacCriterion,
      description: policy.description || '',
      isActive: policy.isActive,
    });
    setShowModal(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        const res = await adminAPI.updateCreditPolicy(editingPolicy.id, formData);
        setPolicies(prev => prev.map(p => p.id === editingPolicy.id ? res.policy : p));
        showToast('success', 'Credit policy updated successfully');
      } else {
        const res = await adminAPI.createCreditPolicy(formData);
        setPolicies(prev => [...prev, res.policy]);
        showToast('success', 'New credit policy rule created');
      }
      setShowModal(false);
    } catch (err) {
      showToast('error', err.message || 'Failed to save policy rule');
    }
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchesType = filterType === 'all' || p.activityType === filterType;
      const matchesLevel = filterLevel === 'all' || p.level === filterLevel;
      return matchesType && matchesLevel;
    });
  }, [policies, filterType, filterLevel]);

  if (loading && policies.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading Credit Policy Engine..." />
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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                Institutional Policy Engine
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {policies.length} Active Rules
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Credit Policy Engine & NAAC Mapping
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Configure institutional credit weights (Activity Type × Level) and automated NAAC criterion associations
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-medium transition-colors self-start md:self-auto"
          >
            + Create New Policy Rule
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <div>
            <label className="block mb-1 text-zinc-500">Filter Activity Type</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Activity Types</option>
              {ACTIVITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">Filter Level</label>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Achievement Levels</option>
              {ACHIEVEMENT_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Policy Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-mono uppercase text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3">Activity Type</th>
                <th scope="col" className="px-4 py-3">Level</th>
                <th scope="col" className="px-4 py-3">Credit Points</th>
                <th scope="col" className="px-4 py-3">NAAC Criterion</th>
                <th scope="col" className="px-4 py-3">Description</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 font-mono">
                    No credit policies matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map(p => (
                  <PolicyRow
                    key={p.id}
                    policy={p}
                    onToggleStatus={handleToggleStatus}
                    onEdit={handleOpenEdit}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Policy Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm font-mono text-zinc-900 dark:text-zinc-100">
                {editingPolicy ? 'Edit Credit Policy Rule' : 'Create Credit Policy Rule'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 font-mono text-xs"
              >
                [Close]
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block mb-1 text-zinc-500">Activity Type *</label>
                <select
                  value={formData.activityType}
                  disabled={Boolean(editingPolicy)}
                  onChange={e => setFormData(prev => ({ ...prev, activityType: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 disabled:opacity-60"
                >
                  {ACTIVITY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Achievement Level *</label>
                <select
                  value={formData.level}
                  disabled={Boolean(editingPolicy)}
                  onChange={e => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 disabled:opacity-60"
                >
                  {ACHIEVEMENT_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Credit Points Granted *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10.0"
                  value={formData.credits}
                  onChange={e => setFormData(prev => ({ ...prev, credits: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Mapped NAAC Criterion *</label>
                <select
                  value={formData.naacCriterion}
                  onChange={e => setFormData(prev => ({ ...prev, naacCriterion: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                >
                  {NAAC_CRITERIA.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Policy Guidelines / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Requires certificate verification and organizer sign-off"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-zinc-700 dark:text-zinc-300">Policy Active</label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Save Policy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
