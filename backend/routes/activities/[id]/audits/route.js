export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// GET /api/activities/[id]/audits
export async function GET(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'faculty', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const activityId = params?.id;
    const { ActivityAudit, User } = await initDB();

    const audits = await ActivityAudit.findAll({
      where: { activityId },
      include: [
        { model: User, as: 'performer', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({
      success: true,
      audits,
    });
  } catch (error) {
    console.error('Get activity audits error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit history' }, { status: 500 });
  }
}
