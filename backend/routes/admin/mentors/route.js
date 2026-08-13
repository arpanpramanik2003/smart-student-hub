export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { Op } from 'sequelize';

// GET /api/admin/mentors
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { User } = await initDB();

    // Fetch all active faculty members
    const faculty = await User.findAll({
      where: { role: 'faculty', isActive: true },
      attributes: ['id', 'name', 'email', 'department'],
      order: [['name', 'ASC']],
      raw: true,
    });

    // Single aggregated GROUP BY query to count mentees per faculty (replaces N+1 queries)
    const menteeCountsRaw = await User.findAll({
      where: { role: 'student', mentorId: { [Op.not]: null } },
      attributes: ['mentorId', [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']],
      group: ['mentorId'],
      raw: true,
    });

    const menteeCountMap = {};
    menteeCountsRaw.forEach((m) => {
      const key = m.mentorId || m.mentorid || m.MENTORID;
      const count = parseInt(m.count || m.COUNT || 0);
      if (key) menteeCountMap[key] = count;
    });

    const facultyWithCounts = faculty.map((f) => ({
      ...f,
      menteeCount: menteeCountMap[f.id] || 0,
    }));

    // Fetch students list with assigned mentor details
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email', 'studentId', 'department', 'programCategory', 'program', 'year', 'mentorId'],
      include: [
        { model: User, as: 'mentor', attributes: ['id', 'name', 'email'] }
      ],
      order: [['name', 'ASC']],
    });

    return NextResponse.json({
      success: true,
      faculty: facultyWithCounts,
      students,
    });
  } catch (error) {
    console.error('Get mentors error:', error);
    return NextResponse.json({ error: 'Failed to fetch mentor assignments' }, { status: 500 });
  }
}

// POST /api/admin/mentors (Assign or bulk assign)
export async function POST(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { mentorId, studentId, studentIds, bulkFilter } = body;

    const { User } = await initDB();

    // Validate mentor existence if assigning
    if (mentorId) {
      const mentor = await User.findOne({ where: { id: mentorId, role: 'faculty' } });
      if (!mentor) {
        return NextResponse.json({ error: 'Selected faculty mentor does not exist.' }, { status: 404 });
      }
    }

    let updatedCount = 0;

    if (studentId) {
      // Single student assignment
      const [count] = await User.update(
        { mentorId: mentorId || null },
        { where: { id: studentId, role: 'student' } }
      );
      updatedCount = count;
    } else if (Array.isArray(studentIds) && studentIds.length > 0) {
      // Bulk array of student IDs
      const [count] = await User.update(
        { mentorId: mentorId || null },
        { where: { id: { [Op.in]: studentIds }, role: 'student' } }
      );
      updatedCount = count;
    } else if (bulkFilter && typeof bulkFilter === 'object') {
      // Bulk filter by department / program / year
      const whereClause = { role: 'student' };
      if (bulkFilter.department) whereClause.department = bulkFilter.department;
      if (bulkFilter.programCategory) whereClause.programCategory = bulkFilter.programCategory;
      if (bulkFilter.program) whereClause.program = bulkFilter.program;
      if (bulkFilter.year) whereClause.year = bulkFilter.year;
      if (bulkFilter.unassignedOnly) whereClause.mentorId = null;

      const [count] = await User.update(
        { mentorId: mentorId || null },
        { where: whereClause }
      );
      updatedCount = count;
    } else {
      return NextResponse.json({ error: 'Missing studentId, studentIds, or bulkFilter parameters.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned mentor to ${updatedCount} student(s).`,
      updatedCount,
    });
  } catch (error) {
    console.error('Assign mentor error:', error);
    return NextResponse.json({ error: 'Failed to assign faculty mentor' }, { status: 500 });
  }
}
