'use client';
import React, { useState, useCallback } from 'react';
import { authAPI } from '../../utils/api';
import LoadingSpinner from '../shared/LoadingSpinner';

const LoginForm = ({ onLogin, onSwitchToRegister, initialCredentials }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (initialCredentials?.email) {
      setFormData({
        email: initialCredentials.email,
        password: initialCredentials.password || '',
      });
      setError('');
    }
  }, [initialCredentials]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all required credentials.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(formData);
      onLogin(response.user, response.token);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  }, [error]);

  const togglePasswordVisibility = useCallback(() => setShowPassword(prev => !prev), []);

  return (
    <div className="space-y-4 font-mono text-xs text-zinc-900 dark:text-zinc-100">
      <div>
        <h2 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
          Sign in to your account
        </h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Or{' '}
          <button 
            type="button" 
            onClick={onSwitchToRegister} 
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            create a new student or faculty account
          </button>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
          <span>✕ {error}</span>
        </div>
      )}

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block mb-1 text-zinc-500">Email Address *</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="student@example.edu"
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="text-zinc-500">Password *</label>
            <button 
              type="button" 
              onClick={togglePasswordVisibility} 
              className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              [{showPassword ? 'Hide Password' : 'Show Password'}]
            </button>
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-1.5 mt-2"
        >
          {loading ? (
            <span>Signing in to console...</span>
          ) : (
            <span>Sign In to Console →</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
