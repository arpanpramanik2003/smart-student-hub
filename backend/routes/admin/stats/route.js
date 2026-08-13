export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { User, Activity } = await initDB();
    const { Op } = await import('sequelize');

    const [
      totalUsers,
      studentCount,
      facultyCount,
      adminCount,
      totalActivities,
      pendingMentor,
      pendingAdmin,
      approvedActivities,
      rejectedActivities
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'faculty' } }),
      User.count({ where: { role: 'admin' } }),
      Activity.count(),
      Activity.count({ where: { status: 'pending_mentor' } }),
      Activity.count({ where: { status: 'mentor_approved' } }),
      Activity.count({ where: { status: 'approved' } }),
      Activity.count({ where: { status: 'rejected' } }),
    ]);

    const pendingActivities = pendingMentor + pendingAdmin;

    let programCategoryStats = [];
    try {
      programCategoryStats = await User.findAll({
        attributes: ['programCategory', [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']],
        where: { programCategory: { [Op.not]: null }, role: { [Op.in]: ['student', 'faculty'] } },
        group: ['programCategory'],
        raw: true,
      });
    } catch {}

    let activityTypeStats = [];
    try {
      activityTypeStats = await Activity.findAll({
        attributes: ['type', [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']],
        group: ['type'],
        raw: true,
      });
    } catch {}

    let topStudents = [];
    try {
      const sequelize = User.sequelize;
      const rawTopStudents = await sequelize.query(`
        SELECT 
          u.id, u.name, u."studentId", u.department, u."programCategory", u.program, u.specialization,
          COUNT(a.id) AS "activityCount",
          COALESCE(SUM(CASE WHEN a.status = 'approved' THEN a.credits ELSE 0 END), 0) AS "totalCredits"
        FROM users u
        JOIN activities a ON a."studentId" = u.id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name, u."studentId", u.department, u."programCategory", u.program, u.specialization
        ORDER BY "totalCredits" DESC, "activityCount" DESC
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT });

      topStudents = rawTopStudents.map((s) => ({
        id: s.id,
        name: s.name || 'Unknown',
        studentId: s.studentId || s.studentid || s.STUDENTID || 'N/A',
        department: s.department || s.DEPARTMENT,
        programCategory: s.programCategory || s.programcategory || s.PROGRAMCATEGORY,
        program: s.program || s.PROGRAM,
        specialization: s.specialization || s.SPECIALIZATION,
        totalCredits: Math.round((parseFloat(s.totalCredits || s.totalcredits || s.TOTALCREDITS || 0)) * 10) / 10,
        activityCount: parseInt(s.activityCount || s.activitycount || s.ACTIVITYCOUNT || 0),
      }));
    } catch (err) {
      console.error('Top students query error:', err);
    }

    return NextResponse.json({
      userStats: { totalUsers, studentCount, facultyCount, adminCount },
      activityStats: {
        totalActivities,
        pendingActivities,
        pendingMentor,
        pendingAdmin,
        approvedActivities,
        rejectedActivities
      },
      programCategoryStats: programCategoryStats.map((c) => ({
        programCategory: c.programCategory || 'Unknown',
        count: parseInt(c.count) || 0
      })),
      activityTypeStats: activityTypeStats.map((t) => ({
        type: t.type || 'Unknown',
        count: parseInt(t.count) || 0
      })),
      topStudents,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin statistics', details: error.message }, { status: 500 });
  }
}
