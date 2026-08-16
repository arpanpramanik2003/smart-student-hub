'use client';
import React, { useState } from 'react';
import LoginForm from '../auth/LoginForm';
import RegisterForm from '../auth/RegisterForm';

const LoginPageUI = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 p-2.5 mb-1 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <img src="/favicon.svg" alt="Smart Student Hub Logo" className="w-9 h-9 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Smart Student Hub
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            Academic Credit Evaluation & Digital Portfolio System
          </p>
        </div>

        {/* Test Credentials Drawer */}
        <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-4 font-mono text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80 dark:border-amber-900/60">
            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
              🧪 Test Credentials
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Demo Logins</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Admin:</span>
              <span>arpan@smartstudenthub.com / Arpan@123.</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Student:</span>
              <span>student@gmail.com / Student@123.</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Faculty:</span>
              <span>teacher@gmail.com / Teacher@123.</span>
            </div>
          </div>
        </div>

        {/* Form Card with Segment Switcher */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Segment Control Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded font-mono text-xs">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`py-2 text-center font-bold rounded transition-colors ${
                isLogin
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`py-2 text-center font-bold rounded transition-colors ${
                !isLogin
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Render Active Form */}
          {isLogin ? (
            <LoginForm onLogin={onLogin} onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onLogin={onLogin} onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>

        {/* Console System Status Footer */}
        <div className="text-center font-mono text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Console Status: All Services Operational</span>
          </div>
          <p>© 2026 Smart Student Hub • v2.0.0 (Next.js Production)</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPageUI;
