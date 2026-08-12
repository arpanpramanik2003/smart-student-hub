export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// PUT /api/faculty/activities/[activityId]
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['faculty', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { activityId } = params;
    const body = await request.json();
    const { action, status, remarks, credits } = body;

    const targetStatus = action === 'approve' || status === 'approved' || status === 'mentor_approved' ? 'mentor_approved' : 'rejected';

    const { Activity, User, CreditPolicy } = await initDB();

    const activity = await Activity.findByPk(activityId, {
      include: [{ model: User, as: 'student', attributes: ['name', 'email', 'mentorId'] }],
    });

    if (!activity) return NextResponse.json({ message: 'Activity not found' }, { status: 404 });
    if (activity.status !== 'pending_mentor') {
      return NextResponse.json({ message: `Activity status is ${activity.status}, cannot perform Stage 1 Mentor review.` }, { status: 400 });
    }

    const updateData = {
      status: targetStatus,
      mentorReviewedBy: auth.user.id,
      mentorReviewedAt: new Date(),
      mentorRemarks: remarks || (targetStatus === 'mentor_approved' ? 'Mentor verified and approved submission.' : 'Rejected by mentor.'),
    };

    if (credits !== undefined) {
      updateData.credits = credits;
    }

    await activity.update(updateData);

    const updatedActivity = await Activity.findByPk(activityId, {
      include: [
        { model: User, as: 'student', attributes: ['name', 'email', 'studentId'] },
        { model: User, as: 'mentorReviewer', attributes: ['name', 'email'] },
        { model: CreditPolicy, as: 'policy' },
      ],
    });

    return NextResponse.json({
      message: targetStatus === 'mentor_approved' 
        ? 'Activity approved by Mentor and forwarded for Stage 2 Admin final sign-off.' 
        : 'Activity rejected by Mentor.',
      activity: updatedActivity
    });
  } catch (error) {
    console.error('Mentor review activity error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
