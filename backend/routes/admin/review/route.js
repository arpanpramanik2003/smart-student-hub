export const dynamic = 'force-dynamic';
import { NextResponse, createPagination } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// GET /api/admin/review - List activities for Stage 2 final approval (mentor_approved) or Approved Ledger (approved)
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'mentor_approved';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { Activity, User, CreditPolicy } = await initDB();

    const where = statusParam === 'all' ? {} : { status: statusParam };
    const order = statusParam === 'approved' 
      ? [['finalApprovedAt', 'DESC'], ['updatedAt', 'DESC']] 
      : [['mentorReviewedAt', 'ASC'], ['createdAt', 'ASC']];

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'studentId', 'department', 'programCategory', 'program', 'specialization', 'year'],
        },
        {
          model: User,
          as: 'mentorReviewer',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: CreditPolicy,
          as: 'policy',
        }
      ],
      order,
      limit,
      offset,
    });

    return NextResponse.json({
      activities: rows,
      pagination: createPagination(count, page, limit),
    });
  } catch (error) {
    console.error('Get admin review queue error:', error);
    return NextResponse.json({ error: 'Failed to fetch final review queue' }, { status: 500 });
  }
}
