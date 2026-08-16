'use client';
import React, { useState, useEffect } from 'react';
import { publicAPI } from '../../utils/api';
import LoadingSpinner from '../shared/LoadingSpinner';

const PublicVerification = ({ verificationId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!verificationId) return;

    const verify = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await publicAPI.verifyCredential(verificationId);
        setData(result);
      } catch (err) {
        console.error('Verification query error:', err);
        setError(err.message || 'Unable to verify record.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [verificationId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-8 flex flex-col items-center justify-center">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden relative z-10 space-y-6 p-6 sm:p-8">
        {/* Institutional Branding Strip */}
        <div className="border-b border-zinc-800 pb-4 flex items-center justify-between font-mono text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="font-bold text-zinc-200 uppercase tracking-widest text-[11px]">
              CampusSphere University
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Public Registry Ledger
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center font-mono text-xs text-zinc-400">
            <LoadingSpinner size="lg" message="Verifying digital record against institutional database..." />
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && (error || !data || data.status === 'not_found') && (
          <div className="text-center py-10 space-y-4 font-mono">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400 text-2xl font-bold">
              ✕
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300 uppercase tracking-tight">
                Credential Not Verified
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                {error || data?.message || 'No matching official record exists for this verification token.'}
              </p>
            </div>
            <div className="p-3 bg-zinc-950/80 rounded border border-zinc-800 text-[11px] text-zinc-500 text-left space-y-1">
              <p>• Verification Identifier: <code className="text-zinc-300">{verificationId}</code></p>
              <p>• If you believe this is an error, please check the URL or contact the institutional registrar.</p>
            </div>
          </div>
        )}

        {/* REVOKED CREDENTIAL STATE */}
        {!loading && data && data.status === 'revoked' && (
          <div className="space-y-6">
            {/* Revoked Header Badge */}
            <div className="p-4 bg-rose-950/40 border-2 border-rose-600 rounded-lg text-rose-300 font-mono text-xs space-y-1">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                <span>⚠️</span>
                <span>CREDENTIAL OFFICIALLY REVOKED</span>
              </div>
              <p className="text-[11px] text-rose-200">
                This achievement was previously approved but has been formally revoked by institution administration.
              </p>
            </div>

            {/* Record Details */}
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Student Name</span>
                  <span className="font-bold text-sm text-zinc-100">{data.studentName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Activity Title</span>
                  <span className="font-semibold text-zinc-200">{data.activityTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Revocation Date</span>
                  <span className="text-rose-400 font-bold">{formatDate(data.revokedAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Revocation Reason</span>
                  <span className="text-rose-300 italic">&quot;{data.revocationReason}&quot;</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VERIFIED APPROVED STATE */}
        {!loading && data && data.status === 'approved' && (
          <div className="space-y-6 font-mono">
            {/* Verified Header Badge */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-600/80 rounded-lg text-emerald-300 text-xs flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 font-bold text-sm text-emerald-400">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-xs">✓</span>
                <span>OFFICIALLY VERIFIED CREDENTIAL</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                Authentic & Unaltered
              </span>
            </div>

            {/* Field Grid */}
            <div className="space-y-4">
              {/* Primary Highlights */}
              <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-lg space-y-4">
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 tracking-wider block">Credential Recipient</span>
                  <h3 className="text-xl font-bold text-zinc-50 mt-0.5">{data.studentName}</h3>
                  <span className="text-[11px] text-indigo-400">{data.institutionName}</span>
                </div>

                <div className="border-t border-zinc-800/80 pt-3">
                  <span className="text-[10px] uppercase text-zinc-500 tracking-wider block">Activity Title</span>
                  <h4 className="text-base font-semibold text-zinc-100 mt-0.5">{data.activityTitle}</h4>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 uppercase block">Category</span>
                  <span className="font-semibold text-zinc-200 capitalize mt-0.5 block">{data.activityType}</span>
                </div>

                <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 uppercase block">Achievement Level</span>
                  <span className="font-semibold text-zinc-200 capitalize mt-0.5 block">{data.achievementLevel}</span>
                </div>

                <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 uppercase block">Credits Awarded</span>
                  <span className="font-bold text-indigo-400 text-sm mt-0.5 block">+{data.credits} Credits</span>
                </div>

                <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 uppercase block">NAAC Criterion</span>
                  <span className="font-semibold text-zinc-200 mt-0.5 block">{data.naacCriterion}</span>
                </div>

                <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 uppercase block">Activity Date</span>
                  <span className="text-zinc-300 mt-0.5 block">{formatDate(data.activityDate)}</span>
                </div>

                <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 uppercase block">Approval Date</span>
                  <span className="text-zinc-300 mt-0.5 block">{formatDate(data.approvalDate)}</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Token Box */}
            <div className="p-4 bg-zinc-950/90 border border-zinc-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase">
                <span>Unique Verification Token</span>
                <button
                  onClick={handleCopyLink}
                  className="text-indigo-400 hover:underline"
                >
                  {copied ? '[Copied Link!]' : '[Copy Verification URL]'}
                </button>
              </div>
              <div className="p-2.5 bg-zinc-900 rounded border border-zinc-800 text-[11px] text-indigo-300 select-all font-mono break-all">
                {data.verificationId}
              </div>
              <p className="text-[10px] text-zinc-500">
                • This verification result is pulled live from the institutional database ledger at request time and cannot be tampered with.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-800 text-center font-mono text-[10px] text-zinc-500">
          CampusSphere Institutional Verification Platform • Powered by Cryptographic Audit Engine
        </div>
      </div>
    </div>
  );
};

export default PublicVerification;
