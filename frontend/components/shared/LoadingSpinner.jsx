'use client';
import React from 'react';

const LoadingSpinner = ({
  size = 'md',
  className = '',
  text = '',
  variant = 'pulse-ring',
  overlay = false
}) => {
  const sizeMap = {
    xs: { container: 'w-4 h-4', border: 'border-[2px]', dot: 'w-1 h-1', gap: 'gap-1' },
    sm: { container: 'w-6 h-6', border: 'border-2', dot: 'w-1.5 h-1.5', gap: 'gap-1.5' },
    md: { container: 'w-10 h-10', border: 'border-[2.5px]', dot: 'w-2 h-2', gap: 'gap-2' },
    lg: { container: 'w-14 h-14', border: 'border-[3px]', dot: 'w-2.5 h-2.5', gap: 'gap-2' },
    xl: { container: 'w-18 h-18', border: 'border-4', dot: 'w-3 h-3', gap: 'gap-2.5' }
  };

  const textSizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base'
  };

  const s = sizeMap[size] || sizeMap.md;

  const SpinnerVariants = {
    // Clean arc spinner — console default
    'pulse-ring': (
      <div className={`relative ${s.container}`}>
        <div className={`absolute inset-0 rounded-full ${s.border} border-zinc-200 dark:border-zinc-800`} />
        <div className={`absolute inset-0 rounded-full ${s.border} border-transparent border-t-indigo-600 dark:border-t-indigo-500 loader-arc-spin`} />
      </div>
    ),

    // Dual ring
    'dual-ring': (
      <div className={`relative ${s.container}`}>
        <div className={`absolute inset-0 rounded-full ${s.border} border-transparent border-t-indigo-600 border-b-indigo-600 dark:border-t-indigo-500 dark:border-b-indigo-500 loader-arc-spin`} />
        <div className={`absolute inset-[3px] rounded-full ${s.border} border-transparent border-l-emerald-500 border-r-emerald-500 loader-arc-spin-reverse`} />
      </div>
    ),

    // Monospace dots
    dots: (
      <div className={`flex items-center ${s.gap}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${s.dot} rounded-full bg-indigo-600 dark:bg-indigo-500 loader-dot`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    ),

    // Shimmer bar
    bar: (
      <div className="w-full max-w-[140px]">
        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full loader-bar-shimmer" />
        </div>
      </div>
    ),

    // Placeholder skeleton
    skeleton: (
      <div className="w-full space-y-2.5 animate-pulse">
        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
      </div>
    ),
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      {SpinnerVariants[variant] || SpinnerVariants['pulse-ring']}
      {text && (
        <p className={`${textSizeClasses[size]} font-mono font-medium text-zinc-500 dark:text-zinc-400 tracking-tight`}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in font-mono text-xs">
        {content}
      </div>
    );
  }

  return content;
};

// ─── Branded Full-Page Console Loader ─────────────────────────────
export const BrandedLoader = ({ text = 'Initializing console session...' }) => (
  <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center gap-5 transition-colors font-mono">
    {/* Console Mark */}
    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center p-2.5">
      <img src="/favicon.svg" alt="CampusSphere Logo" className="w-9 h-9 object-contain" />
    </div>

    {/* Brand & Progress Bar */}
    <div className="flex flex-col items-center gap-2">
      <h1 className="text-sm font-bold tracking-wider text-zinc-950 dark:text-zinc-50 uppercase">
        CampusSphere
      </h1>
      <div className="w-36 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
        <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full loader-bar-shimmer" />
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{text}</p>
    </div>
  </div>
);

// ─── Section / Page Content Loader ──────────────────────────────────
export const PageLoader = ({ text = 'Loading module...', variant = 'pulse-ring' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 font-mono text-xs">
    <LoadingSpinner size="md" variant={variant} />
    <p className="text-zinc-500 dark:text-zinc-400">{text}</p>
  </div>
);

// ─── Inline Section Skeleton ────────────────────────────────────────
export const SectionSkeleton = ({ rows = 3 }) => (
  <div className="w-full space-y-4 py-4 animate-pulse font-mono text-xs">
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-3">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  </div>
);

// ─── Card Grid Skeleton ─────────────────────────────────────────────
export const CardSkeleton = ({ cards = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse font-mono text-xs">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>
        <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
      </div>
    ))}
  </div>
);

// ─── Table Skeleton ─────────────────────────────────────────────────
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden animate-pulse font-mono text-xs">
    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={`h-${i}`} className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
      ))}
    </div>
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 p-4 space-y-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 pt-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-zinc-100 dark:bg-zinc-800/80 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ─── Button Loader ──────────────────────────────────────────────────
export const ButtonLoader = ({ size = 'xs' }) => (
  <LoadingSpinner size={size} variant="pulse-ring" />
);

// ─── Inline Loader ──────────────────────────────────────────────────
export const InlineLoader = ({ text = 'Loading...' }) => (
  <LoadingSpinner size="sm" variant="dots" text={text} className="py-4" />
);

// ─── Overlay Loader ─────────────────────────────────────────────────
export const OverlayLoader = ({ text = 'Processing...' }) => (
  <LoadingSpinner size="lg" variant="dual-ring" text={text} overlay={true} />
);

export default LoadingSpinner;