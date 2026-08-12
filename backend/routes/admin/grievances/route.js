export const dynamic = 'force-dynamic';
import { NextResponse, createPagination } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// GET /api/admin/grievances - List student appeals/grievances
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_admin';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { ActivityGrievance, Activity, User, CreditPolicy } = await initDB();

    const where = {};
    if (status && status !== 'all') where.status = status;

    const { count, rows } = await ActivityGrievance.findAndCountAll({
      where,
      include: [
        {
          model: StudentUserAlias(User),
          as: 'student',
          attributes: ['id', 'name', 'email', 'studentId', 'department', 'program', 'year'],
        },
        {
          model: Activity,
          as: 'activity',
          include: [
            { model: User, as: 'mentorReviewer', attributes: ['name', 'email'] },
            { model: User, as: 'finalApprover', attributes: ['name', 'email'] },
            { model: CreditPolicy, as: 'policy' },
          ],
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['name', 'email'],
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      grievances: rows,
      pagination: createPagination(count, page, limit),
    });
  } catch (error) {
    console.error('Get admin grievances error:', error);
    return NextResponse.json({ error: 'Failed to fetch grievances queue' }, { status: 500 });
  }
}

function StudentUserAlias(User) {
  return User;
}
