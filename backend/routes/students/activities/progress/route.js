export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// GET /api/students/activities/progress - Academic Year & Lifetime Credit Progress
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const studentId = auth.user.id;
    const { Activity } = await initDB();
    const sequelize = Activity.sequelize;

    // Determine current Academic Year (July 1 to June 30)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    let ayStartYear = currentYear;
    let ayEndYear = currentYear + 1;
    if (currentMonth < 7) {
      ayStartYear = currentYear - 1;
      ayEndYear = currentYear;
    }

    const ayLabel = `AY ${ayStartYear}-${String(ayEndYear).slice(-2)}`;
    const ayStartDate = `${ayStartYear}-07-01 00:00:00`;
    const ayEndDate = `${ayEndYear}-06-30 23:59:59`;

    // 1. Current Academic Year Approved Credits
    const currentAYActivities = await sequelize.query(`
      SELECT 
        COALESCE(a.naacCriterion, 'Criterion 5') AS criterion,
        COUNT(a.id) AS activityCount,
        COALESCE(SUM(a.credits), 0) AS totalCredits
      FROM activities a
      WHERE a.studentId = :studentId
        AND a.status = 'approved'
        AND a.date >= :ayStartDate AND a.date <= :ayEndDate
      GROUP BY COALESCE(a.naacCriterion, 'Criterion 5')
      ORDER BY criterion ASC
    `, {
      replacements: { studentId, ayStartDate, ayEndDate },
      type: sequelize.QueryTypes.SELECT,
    });

    const criterionBreakdown = currentAYActivities.map((r) => ({
      criterion: r.criterion || r.CRITERION,
      activityCount: parseInt(r.activityCount || r.activitycount || 0),
      credits: Math.round((parseFloat(r.totalCredits || r.totalcredits || 0)) * 10) / 10,
    }));

    const currentAYCredits = Math.round(
      criterionBreakdown.reduce((sum, c) => sum + c.credits, 0) * 10
    ) / 10;

    const ANNUAL_TARGET = 20.0;
    const progressPercentage = Math.min(100, Math.round((currentAYCredits / ANNUAL_TARGET) * 100));

    // 2. Lifetime Cumulative Progress
    const lifetimeRaw = await sequelize.query(`
      SELECT 
        COUNT(a.id) AS totalActivities,
        COALESCE(SUM(a.credits), 0) AS totalCredits
      FROM activities a
      WHERE a.studentId = :studentId
        AND a.status = 'approved'
    `, {
      replacements: { studentId },
      type: sequelize.QueryTypes.SELECT,
    });

    const lifetimeCredits = Math.round((parseFloat(lifetimeRaw[0]?.totalCredits || lifetimeRaw[0]?.TOTALCREDITS || 0)) * 10) / 10;
    const lifetimeActivitiesCount = parseInt(lifetimeRaw[0]?.totalActivities || lifetimeRaw[0]?.TOTALACTIVITIES || 0);

    return NextResponse.json({
      academicYear: {
        label: ayLabel,
        startDate: ayStartDate,
        endDate: ayEndDate,
        creditsEarned: currentAYCredits,
        annualTarget: ANNUAL_TARGET,
        progressPercentage,
        criterionBreakdown,
      },
      lifetime: {
        totalCredits: lifetimeCredits,
        totalApprovedActivities: lifetimeActivitiesCount,
      },
    });
  } catch (error) {
    console.error('Student credit progress calculation error:', error);
    return NextResponse.json({ error: 'Failed to compute credit progress' }, { status: 500 });
  }
}
