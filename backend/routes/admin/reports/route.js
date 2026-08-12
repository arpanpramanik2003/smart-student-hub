export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const academicYear = searchParams.get('academicYear');

    // Handle NAAC / NIRF Institutional Reporting Aggregations
    if (type === 'naac' || academicYear) {
      return handleNAACReport(searchParams);
    }

    // Default: General Activity Stream Audit
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json';
    const status = searchParams.get('status') || 'all';

    const { Activity } = await initDB();

    let whereConditions = ['1=1'];
    let params = [];

    if (startDate) { whereConditions.push('a."createdAt" >= ?'); params.push(startDate); }
    if (endDate) { whereConditions.push('a."createdAt" <= ?'); params.push(endDate + ' 23:59:59'); }
    if (status !== 'all') { whereConditions.push('a.status = ?'); params.push(status); }

    const whereClause = whereConditions.join(' AND ');

    const activitiesQuery = `
      SELECT 
        a.id, a.title, a.type, a.date, a.credits, a.organizer, a.description,
        a.status, a."createdAt", a."updatedAt",
        u.name as "userName", u."studentId", u.department,
        u."programCategory", u.program, u.specialization, u.year, u."admissionYear"
      FROM activities a
      LEFT JOIN users u ON a."studentId" = u.id
      WHERE ${whereClause}
      ORDER BY a."createdAt" DESC
    `;

    const activities = await Activity.sequelize.query(activitiesQuery, {
      replacements: params,
      type: Activity.sequelize.QueryTypes.SELECT,
    });

    const approvedActivities = activities.filter((a) => a.status === 'approved');
    const totalCredits = approvedActivities.reduce((sum, a) => sum + (parseFloat(a.credits) || 0), 0);

    const statusBreakdown = activities.reduce((acc, a) => { acc[a.status || 'Unknown'] = (acc[a.status || 'Unknown'] || 0) + 1; return acc; }, {});
    const programCategoryBreakdown = activities.reduce((acc, a) => { const c = a.programCategory || 'Unknown'; acc[c] = (acc[c] || 0) + 1; return acc; }, {});
    const activityTypeBreakdown = activities.reduce((acc, a) => { const t = a.type || 'Unknown'; acc[t] = (acc[t] || 0) + 1; return acc; }, {});

    if (format === 'csv') {
      const safe = (v) => (v === null || v === undefined ? '' : String(v).replace(/"/g, '""'));
      const header = 'Student Name,Student ID,Program Category,Program,Specialization,Department,Year,Admission Year,Activity Title,Type,Date,Credits,Organizer,Status,Created Date,Description\n';
      const rows = activities.map((a) => [
        `"${safe(a.userName)}"`, `"${safe(a.studentId)}"`, `"${safe(a.programCategory)}"`,
        `"${safe(a.program)}"`, `"${safe(a.specialization)}"`, `"${safe(a.department)}"`,
        `"${safe(a.year)}"`, `"${safe(a.admissionYear)}"`, `"${safe(a.title)}"`,
        `"${safe(a.type)}"`, `"${safe(a.date)}"`, parseFloat(a.credits) || 0,
        `"${safe(a.organizer)}"`, `"${safe(a.status)}"`, `"${safe(a.createdAt)}"`, `"${safe(a.description)}"`,
      ].join(',')).join('\n');

      const csv = '\ufeff' + header + rows;
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="activity-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        totalActivities: activities.length,
        totalApprovedActivities: approvedActivities.length,
        totalCredits: Math.round(totalCredits * 10) / 10,
        statusBreakdown, programCategoryBreakdown, activityTypeBreakdown,
        dateRange: { start: startDate, end: endDate },
      },
      activities: activities.map((a) => ({
        id: a.id, title: a.title, type: a.type, date: a.date, credits: parseFloat(a.credits) || 0,
        organizer: a.organizer, description: a.description, status: a.status,
        createdAt: a.createdAt,
        student: { name: a.userName, studentId: a.studentId, department: a.department,
          programCategory: a.programCategory, program: a.program, specialization: a.specialization,
          year: a.year, admissionYear: a.admissionYear },
      })),
    });
  } catch (error) {
    console.error('Generate reports error:', error);
    return NextResponse.json({ error: 'Failed to generate reports', details: error.message }, { status: 500 });
  }
}

async function handleNAACReport(searchParams) {
  const academicYear = searchParams.get('academicYear') || 'all';
  const department = searchParams.get('department') || 'all';
  const criterion = searchParams.get('criterion') || 'all';
  const format = searchParams.get('format') || 'json';

  const { Activity } = await initDB();
  const sequelize = Activity.sequelize;
  const isPostgres = sequelize.getDialect() === 'postgres';

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

  // 1. Criterion-wise Summary Query
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

  // 2. Department-wise Breakdown Query
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

  // 4. YoY Trend Query
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

  // 5. Activity-Type Distribution Query
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

  const calculatedAt = new Date().toISOString();
  const totalApprovedActivities = criterionSummary.reduce((sum, c) => sum + c.totalActivities, 0);
  const totalApprovedCredits = Math.round((criterionSummary.reduce((sum, c) => sum + c.totalCredits, 0)) * 10) / 10;

  if (format === 'csv') {
    const safe = (v) => (v === null || v === undefined ? '' : String(v).replace(/"/g, '""'));
    let csv = '\ufeff';
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
}
