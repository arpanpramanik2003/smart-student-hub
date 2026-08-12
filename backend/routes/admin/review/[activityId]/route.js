export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// PUT /api/admin/review/[activityId] - Admin Stage 2 Final Sign-Off
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { activityId } = params;
    const body = await request.json();
    const { action, status, remarks, credits } = body;

    const targetStatus = action === 'approve' || status === 'approved' ? 'approved' : 'rejected';

    const { Activity, User, CreditPolicy } = await initDB();

    const activity = await Activity.findByPk(activityId);

    if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    if (activity.status !== 'mentor_approved' && activity.status !== 'pending_mentor') {
      return NextResponse.json({ error: `Activity status is ${activity.status}, cannot perform final approval.` }, { status: 400 });
    }

    const updateData = {
      status: targetStatus,
      approvedBy: auth.user.id,
      finalApprovedBy: auth.user.id,
      finalApprovedAt: new Date(),
      adminRemarks: remarks || (targetStatus === 'approved' ? 'Final institutional approval granted.' : 'Rejected by Admin.'),
    };

    if (credits !== undefined) {
      updateData.credits = credits;
    }

    await activity.update(updateData);

    const updatedActivity = await Activity.findByPk(activityId, {
      include: [
        { model: User, as: 'student', attributes: ['name', 'email', 'studentId'] },
        { model: User, as: 'mentorReviewer', attributes: ['name', 'email'] },
        { model: User, as: 'finalApprover', attributes: ['name', 'email'] },
        { model: CreditPolicy, as: 'policy' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: targetStatus === 'approved'
        ? 'Activity granted final approval. Credits officially awarded to student portfolio.'
        : 'Activity rejected at final admin review.',
      activity: updatedActivity,
    });
  } catch (error) {
    console.error('Admin final review error:', error);
    return NextResponse.json({ error: 'Failed to process final approval' }, { status: 500 });
  }
}
