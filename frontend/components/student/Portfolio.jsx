'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { studentAPI } from '../../utils/api';
import LoadingSpinner, { SectionSkeleton } from '../shared/LoadingSpinner';
import StudentCVForm from './StudentCVForm';
import { getStudentProgramDisplay } from '../../utils/userDisplay';

const Portfolio = ({ user, token, isReadOnly = false }) => {
  const academicDisplay = getStudentProgramDisplay(user);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState({ type: '', text: '', show: false });
  const [profile, setProfile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const showToast = useCallback((type, text) => {
    setShareMessage({ type, text, show: true });
    setTimeout(() => setShareMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchPortfolioData = useCallback(async () => {
    try {
      const [activitiesData, statsData, profileData] = await Promise.all([
        studentAPI.getActivities({ status: 'approved' }),
        studentAPI.getStats(),
        studentAPI.getProfile(),
      ]);
      setActivities(activitiesData.activities || []);
      setStats(statsData);
      setProfile(profileData.profile);
    } catch (error) {
      console.error('Portfolio fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReadOnly && user) {
      setActivities(user.activities || []);
      setStats(user.stats || {
        byStatus: { approved: user.activities?.length || 0 },
        totalCredits: user.stats?.totalCredits || 0
      });
      setProfile(user);
      setLoading(false);
    } else {
      fetchPortfolioData();
    }
  }, [isReadOnly, user, fetchPortfolioData]);

  const activityGroups = useMemo(() => {
    return activities.reduce((groups, activity) => {
      const type = activity.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(activity);
      return groups;
    }, {});
  }, [activities]);

  const getTypeLabel = useCallback((type) => {
    return type.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat().format(num || 0);
  }, []);

  // Professional ATS-friendly PDF Generation
  const generateEnhancedPDF = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      const addSection = (title, content, isFirst = false) => {
        if (!content) return y;
        
        if (!isFirst && y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(24, 24, 27);
        doc.text(title.toUpperCase(), margin, y);
        
        const titleWidth = doc.getTextWidth(title.toUpperCase());
        y += 1;
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.line(margin, y, margin + titleWidth, y);
        y += 6;

        return y;
      };

      // Header Banner
      doc.setFillColor(24, 24, 27);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(user.name.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${academicDisplay} • Year ${user.year || 1} • ID: ${user.studentId || 'N/A'}`, pageWidth / 2, 23, { align: 'center' });
      
      const contactParts = [];
      if (profile?.phone) contactParts.push(profile.phone);
      if (user.email) contactParts.push(user.email);
      if (profile?.address) contactParts.push(profile.address.split(',').slice(-2).join(',').trim());
      
      doc.setFontSize(8);
      doc.text(contactParts.join(' • '), pageWidth / 2, 30, { align: 'center' });

      y = 45;

      // Social Links
      if (profile?.linkedinUrl || profile?.githubUrl || profile?.portfolioUrl) {
        const links = [];
        if (profile.linkedinUrl) links.push(profile.linkedinUrl);
        if (profile.githubUrl) links.push(profile.githubUrl);
        if (profile.portfolioUrl) links.push(profile.portfolioUrl);
        
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text(links.join(' • '), pageWidth / 2, y, { align: 'center' });
        y += 8;
        doc.setTextColor(0, 0, 0);
      }

      // Summary
      if (profile?.otherDetails) {
        y = addSection('Career Objective', profile.otherDetails, true);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const objectiveLines = doc.splitTextToSize(profile.otherDetails, contentWidth);
        doc.text(objectiveLines, margin, y);
        y += objectiveLines.length * 4.5 + 6;
      }

      // Education
      y = addSection('Academic Education');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(24, 24, 27);
      doc.text(`${academicDisplay}`, margin + 3, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Year ${user.year || 1}`, pageWidth - margin, y, { align: 'right' });
      y += 6;

      if (profile?.twelfthResult) {
        doc.setFont('helvetica', 'bold');
        doc.text('Higher Secondary (12th)', margin + 3, y);
        doc.setFont('helvetica', 'normal');
        doc.text(profile.twelfthResult, pageWidth - margin, y, { align: 'right' });
        y += 6;
      }

      if (profile?.tenthResult) {
        doc.setFont('helvetica', 'bold');
        doc.text('Secondary (10th)', margin + 3, y);
        doc.setFont('helvetica', 'normal');
        doc.text(profile.tenthResult, pageWidth - margin, y, { align: 'right' });
        y += 6;
      }
      y += 4;

      // Technical Skills
      if (profile?.skills) {
        y = addSection('Technical Skills');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const skillsLines = doc.splitTextToSize(profile.skills, contentWidth);
        doc.text(skillsLines, margin + 3, y);
        y += skillsLines.length * 4.5 + 6;
      }

      // Verified Activities
      if (activities.length > 0) {
        y = addSection('Verified Co-Curricular Activities');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        Object.entries(activityGroups).forEach(([type, typeActivities]) => {
          if (y > pageHeight - 35) {
            doc.addPage();
            y = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(getTypeLabel(type), margin + 3, y);
          y += 5;

          typeActivities.forEach((activity) => {
            if (y > pageHeight - 20) {
              doc.addPage();
              y = 20;
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            const dateStr = new Date(activity.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            doc.text(`• ${activity.title} (${activity.credits} Credits)`, margin + 6, y);
            doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
            y += 4;
            
            if (activity.organizer) {
              doc.setTextColor(100, 100, 100);
              doc.text(`  Organizer: ${activity.organizer}`, margin + 8, y);
              y += 4;
              doc.setTextColor(60, 60, 60);
            }
          });
          y += 3;
        });
      }

      // Save PDF
      doc.save(`${user.name.replace(/\s+/g, '_')}_Portfolio.pdf`);
      showToast('success', 'PDF Portfolio generated successfully!');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('error', 'Failed to generate PDF file.');
    } finally {
      setIsGenerating(false);
    }
  }, [academicDisplay, activities, activityGroups, getTypeLabel, profile, user, showToast]);

  const handleSharePortfolio = useCallback(async (type = 'link') => {
    try {
      const shareUrl = `${window.location.origin}/public/portfolio/${user.id}`;
      if (type === 'link') {
        await navigator.clipboard.writeText(shareUrl);
        showToast('success', 'Portfolio share link copied to clipboard!');
      } else if (type === 'email') {
        const subject = `${user.name}'s Verified Academic Portfolio`;
        const body = `View my comprehensive digital portfolio and verified credentials: ${shareUrl}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      }
    } catch (error) {
      showToast('error', 'Failed to copy share link.');
    }
  }, [user.id, user.name, showToast]);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <SectionSkeleton rows={5} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading digital portfolio..." />
        </div>
      </div>
    );
  }

  const approvedCount = stats?.byStatus?.approved || activities.length;
  const totalCredits = stats?.totalCredits || activities.reduce((sum, a) => sum + (a.credits || 0), 0);
  const categoriesCount = Object.keys(activityGroups).length;
  const avgCredits = activities.length > 0 ? (totalCredits / activities.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans" id="portfolio-content">
      {/* Toast Notification */}
      {shareMessage.show && (
        <div className={`rounded border p-3 text-xs font-mono transition-all ${
          shareMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{shareMessage.type === 'success' ? '✓ ' : '✕ '}{shareMessage.text}</span>
            <button onClick={() => setShareMessage(prev => ({ ...prev, show: false }))} className="ml-4 underline hover:opacity-80">
              [Dismiss]
            </button>
          </div>
        </div>
      )}

      {/* CV Profile Details Container */}
      {!isReadOnly && (
        <StudentCVForm user={user} />
      )}

      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Verified Showcase
              </span>
              {isReadOnly && (
                <>
                  <span className="text-xs font-mono text-zinc-400">•</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200">
                    Read-Only View
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Digital Portfolio & Credentials
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              {user.name} • {academicDisplay} • Year {user.year || 1} • ID: {user.studentId || 'N/A'}
            </p>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs self-start md:self-auto">
              <button
                onClick={generateEnhancedPDF}
                disabled={isGenerating}
                className="px-3.5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isGenerating ? (
                  <span>Generating PDF...</span>
                ) : (
                  <span>Download CV (PDF)</span>
                )}
              </button>

              <button
                onClick={() => handleSharePortfolio('link')}
                className="px-3.5 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 transition-colors"
              >
                Copy Share Link
              </button>

              <button
                onClick={() => handleSharePortfolio('email')}
                className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 transition-colors"
              >
                Email CV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Monospace Portfolio Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>APPROVED ACTIVITIES</span>
          </span>
          <p className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
            {formatNumber(approvedCount)}
          </p>
          <p className="text-xs text-zinc-500">Faculty verified</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            TOTAL EARNED CREDITS
          </span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight my-1">
            {formatNumber(totalCredits)}
          </p>
          <p className="text-xs text-zinc-500">Degree points total</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            DOMAINS COVERED
          </span>
          <p className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
            {categoriesCount}
          </p>
          <p className="text-xs text-zinc-500">Activity categories</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            AVG CREDITS / ACT
          </span>
          <p className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
            {avgCredits}
          </p>
          <p className="text-xs text-zinc-500">Points per submission</p>
        </div>
      </div>

      {/* Categorized Approved Activities Display */}
      {Object.keys(activityGroups).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(activityGroups).map(([type, typeActivities]) => (
            <div 
              key={type} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between font-mono text-xs">
                <span className="font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  {getTypeLabel(type)}
                </span>
                <span className="text-zinc-500">
                  {typeActivities.length} {typeActivities.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              <div className="p-5 space-y-4 font-mono text-xs">
                {typeActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 font-sans">
                        {activity.title}
                      </h3>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        +{activity.credits} Credits
                      </span>
                    </div>

                    {activity.description && (
                      <p className="text-zinc-600 dark:text-zinc-400 text-xs font-sans leading-relaxed">
                        {activity.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 text-zinc-500 text-[11px]">
                      <span>Date: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{formatDate(activity.date)}</strong></span>
                      {activity.organizer && (
                        <span>Organizer: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{activity.organizer}</strong></span>
                      )}
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Faculty Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center font-mono text-xs text-zinc-500 space-y-2">
          <p className="font-bold text-zinc-800 dark:text-zinc-200">No Approved Activities Found</p>
          <p className="text-[11px] text-zinc-400">
            Verified extra-curricular activities will automatically appear in your digital portfolio once approved by faculty evaluators.
          </p>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
