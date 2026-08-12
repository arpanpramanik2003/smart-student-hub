export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear') || 'all';
    const department = searchParams.get('department') || 'all';
    const criterion = searchParams.get('criterion') || 'all';
    const format = searchParams.get('format') || 'json';

    const { Activity } = await initDB();
    const sequelize = Activity.sequelize;
    const isPostgres = sequelize.getDialect() === 'postgres';

    // Build Date & Dept Filter Clauses
    let dateWhereClause = '';
    let deptWhereClause = '';
    let deptWhereClauseUserOnly = '';
    const replacements = {};

    if (academicYear && academicYear !== 'all') {
      const parts = academicYear.split('-');
      if (parts.length === 2) {
        const startY = parseInt(parts[0]);
        const endY = parseInt(parts[1]);
        if (!isNaN(startY) && !isNaN(endY)) {
          const startDate = `${startY}-07-01 00:00:00`;
          const endDate = `${endY}-06-30 23:59:59`;
          dateWhereClause = 'AND a.date >= :startDate AND a.date <= :endDate';
          replacements.startDate = startDate;
          replacements.endDate = endDate;
        }
      }
    }

    if (department && department !== 'all') {
      deptWhereClause = 'AND u.department = :department';
      deptWhereClauseUserOnly = 'AND u.department = :department';
      replacements.department = department;
    }

    let criterionWhereClause = '';
    if (criterion && criterion !== 'all') {
      criterionWhereClause = 'AND COALESCE(a.naacCriterion, \'Criterion 5\') = :criterion';
      replacements.criterion = criterion;
    }

    // 1. Criterion-wise Summary Query (Strictly status = 'approved' AND role = 'student')
    const criterionSummaryRaw = await sequelize.query(`
      SELECT 
        COALESCE(a.naacCriterion, 'Criterion 5') AS criterion,
        COUNT(a.id) AS totalActivities,
        COALESCE(SUM(a.credits), 0) AS totalCredits,
        COUNT(DISTINCT a.studentId) AS participatingStudents
      FROM activities a
      JOIN users u ON a.studentId = u.id
      WHERE a.status = 'approved'
        AND u.role = 'student'
        ${dateWhereClause}
        ${deptWhereClause}
      GROUP BY COALESCE(a.naacCriterion, 'Criterion 5')
      ORDER BY criterion ASC
    `, { replacements, type: sequelize.QueryTypes.SELECT });

    const criterionSummary = criterionSummaryRaw.map((r) => ({
      criterion: r.criterion || r.CRITERION,
      totalActivities: parseInt(r.totalActivities || r.totalactivities || r.TOTALACTIVITIES || 0),
      totalCredits: Math.round((parseFloat(r.totalCredits || r.totalcredits || r.TOTALCREDITS || 0)) * 10) / 10,
      participatingStudents: parseInt(r.participatingStudents || r.participatingstudents || r.PARTICIPATINGSTUDENTS || 0),
    }));

    // 2. Department/Program-wise Breakdown Query
    const deptBreakdownRaw = await sequelize.query(`
      SELECT 
        COALESCE(u.department, 'Unassigned') AS department,
        COALESCE(a.naacCriterion, 'Criterion 5') AS criterion,
        COUNT(a.id) AS totalActivities,
        COALESCE(SUM(a.credits), 0) AS totalCredits,
        COUNT(DISTINCT a.studentId) AS participatingStudents
      FROM activities a
      JOIN users u ON a.studentId = u.id
      WHERE a.status = 'approved'
        AND u.role = 'student'
        ${dateWhereClause}
        ${deptWhereClause}
      GROUP BY COALESCE(u.department, 'Unassigned'), COALESCE(a.naacCriterion, 'Criterion 5')
      ORDER BY department ASC, criterion ASC
    `, { replacements, type: sequelize.QueryTypes.SELECT });

    const departmentBreakdown = deptBreakdownRaw.map((r) => ({
      department: r.department || r.DEPARTMENT,
      criterion: r.criterion || r.CRITERION,
      totalActivities: parseInt(r.totalActivities || r.totalactivities || r.TOTALACTIVITIES || 0),
      totalCredits: Math.round((parseFloat(r.totalCredits || r.totalcredits || r.TOTALCREDITS || 0)) * 10) / 10,
      participatingStudents: parseInt(r.participatingStudents || r.participatingstudents || r.PARTICIPATINGSTUDENTS || 0),
    }));

    // 3. Participation Ratio Query
    const numeratorRaw = await sequelize.query(`
      SELECT COUNT(DISTINCT a.studentId) AS count
      FROM activities a
      JOIN users u ON a.studentId = u.id
      WHERE a.status = 'approved'
        AND u.role = 'student'
        AND (u.isActive = 1 OR u.isActive = true OR u.isActive = 'true')
        ${dateWhereClause}
        ${deptWhereClause}
    `, { replacements, type: sequelize.QueryTypes.SELECT });

    const denominatorRaw = await sequelize.query(`
      SELECT COUNT(u.id) AS count
      FROM users u
      WHERE u.role = 'student'
        AND (u.isActive = 1 OR u.isActive = true OR u.isActive = 'true')
        ${deptWhereClauseUserOnly}
    `, { replacements, type: sequelize.QueryTypes.SELECT });

    const activeParticipatingStudents = parseInt(numeratorRaw[0]?.count || numeratorRaw[0]?.COUNT || 0);
    const totalEnrolledStudents = parseInt(denominatorRaw[0]?.count || denominatorRaw[0]?.COUNT || 0);
    const participationRatio = totalEnrolledStudents > 0
      ? Math.round((activeParticipatingStudents / totalEnrolledStudents) * 10000) / 100
      : 0;

    // 4. Year-over-Year (YoY) Trend Query
    const yearExpr = isPostgres
      ? `CASE WHEN EXTRACT(MONTH FROM a.date) >= 7 THEN CONCAT(EXTRACT(YEAR FROM a.date)::text, '-', (EXTRACT(YEAR FROM a.date)+1)::text) ELSE CONCAT((EXTRACT(YEAR FROM a.date)-1)::text, '-', EXTRACT(YEAR FROM a.date)::text) END`
      : `CASE WHEN CAST(strftime('%m', a.date) AS INTEGER) >= 7 THEN strftime('%Y', a.date) || '-' || CAST(CAST(strftime('%Y', a.date) AS INTEGER) + 1 AS TEXT) ELSE CAST(CAST(strftime('%Y', a.date) AS INTEGER) - 1 AS TEXT) || '-' || strftime('%Y', a.date) END`;

    const yoyTrendRaw = await sequelize.query(`
      SELECT 
        ${yearExpr} AS academicYear,
        COUNT(a.id) AS totalActivities,
        COALESCE(SUM(a.credits), 0) AS totalCredits,
        COUNT(DISTINCT a.studentId) AS participatingStudents
      FROM activities a
      JOIN users u ON a.studentId = u.id
      WHERE a.status = 'approved'
        AND u.role = 'student'
        ${deptWhereClause}
      GROUP BY ${yearExpr}
      ORDER BY academicYear ASC
    `, { replacements, type: sequelize.QueryTypes.SELECT });

    const yoyTrend = yoyTrendRaw.map((r) => ({
      academicYear: r.academicYear || r.ACADEMICYEAR || 'Unknown',
      totalActivities: parseInt(r.totalActivities || r.totalactivities || r.TOTALACTIVITIES || 0),
      totalCredits: Math.round((parseFloat(r.totalCredits || r.totalcredits || r.TOTALCREDITS || 0)) * 10) / 10,
      participatingStudents: parseInt(r.participatingStudents || r.participatingstudents || r.PARTICIPATINGSTUDENTS || 0),
    }));

    // 5. Activity-Type Distribution within Criterion
    const typeDistributionRaw = await sequelize.query(`
      SELECT 
        COALESCE(a.naacCriterion, 'Criterion 5') AS criterion,
        a.type AS activityType,
        COUNT(a.id) AS activityCount,
        COALESCE(SUM(a.credits), 0) AS totalCredits
      FROM activities a
      JOIN users u ON a.studentId = u.id
      WHERE a.status = 'approved'
        AND u.role = 'student'
        ${dateWhereClause}
        ${deptWhereClause}
        ${criterionWhereClause}
      GROUP BY COALESCE(a.naacCriterion, 'Criterion 5'), a.type
      ORDER BY criterion ASC, activityCount DESC
    `, { replacements, type: sequelize.QueryTypes.SELECT });

    const typeDistribution = typeDistributionRaw.map((r) => ({
      criterion: r.criterion || r.CRITERION,
      activityType: r.activityType || r.ACTIVITYTYPE,
      activityCount: parseInt(r.activityCount || r.activitycount || r.ACTIVITYCOUNT || 0),
      totalCredits: Math.round((parseFloat(r.totalCredits || r.totalcredits || r.TOTALCREDITS || 0)) * 10) / 10,
    }));

    // Calculated Timestamp
    const calculatedAt = new Date().toISOString();

    // Overall Aggregate Totals
    const totalApprovedActivities = criterionSummary.reduce((sum, c) => sum + c.totalActivities, 0);
    const totalApprovedCredits = Math.round((criterionSummary.reduce((sum, c) => sum + c.totalCredits, 0)) * 10) / 10;

    // Handle CSV Export
    if (format === 'csv') {
      const safe = (v) => (v === null || v === undefined ? '' : String(v).replace(/"/g, '""'));

      let csv = '\ufeff'; // UTF-8 BOM
      csv += `"NAAC / NIRF INSTITUTIONAL ACCREDITATION REPORT"\n`;
      csv += `"Calculated as of:","${calculatedAt}"\n`;
      csv += `"Academic Year Filter:","${academicYear}"\n`;
      csv += `"Department Filter:","${department}"\n`;
      csv += `"Total Enrolled Students:","${totalEnrolledStudents}"\n`;
      csv += `"Active Participating Students:","${activeParticipatingStudents}"\n`;
      csv += `"Participation Ratio:","${participationRatio}%"\n\n`;

      csv += `"CRITERION-WISE SUMMARY (APPROVED ACTIVITIES ONLY)"\n`;
      csv += `"Criterion","Total Approved Activities","Total Credit Points","Participating Students"\n`;
      criterionSummary.forEach((c) => {
        csv += `"${safe(c.criterion)}",${c.totalActivities},${c.totalCredits},${c.participatingStudents}\n`;
      });
      csv += `"TOTAL",${totalApprovedActivities},${totalApprovedCredits},${activeParticipatingStudents}\n\n`;

      csv += `"DEPARTMENT-WISE BREAKDOWN"\n`;
      csv += `"Department","Criterion","Total Approved Activities","Total Credit Points","Participating Students"\n`;
      departmentBreakdown.forEach((d) => {
        csv += `"${safe(d.department)}","${safe(d.criterion)}",${d.totalActivities},${d.totalCredits},${d.participatingStudents}\n`;
      });
      csv += `\n"YEAR-OVER-YEAR TREND"\n`;
      csv += `"Academic Year","Total Approved Activities","Total Credit Points","Participating Students"\n`;
      yoyTrend.forEach((y) => {
        csv += `"${safe(y.academicYear)}",${y.totalActivities},${y.totalCredits},${y.participatingStudents}\n`;
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="naac-nirf-accreditation-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      metadata: {
        academicYear,
        department,
        criterion,
        calculatedAt,
      },
      participationStats: {
        totalEnrolledStudents,
        activeParticipatingStudents,
        participationRatio,
      },
      summary: {
        totalApprovedActivities,
        totalApprovedCredits,
      },
      criterionSummary,
      departmentBreakdown,
      yoyTrend,
      typeDistribution,
    });
  } catch (error) {
    console.error('NAAC reporting error:', error);
    return NextResponse.json({ error: 'Failed to compute NAAC reports', details: error.message }, { status: 500 });
  }
}
