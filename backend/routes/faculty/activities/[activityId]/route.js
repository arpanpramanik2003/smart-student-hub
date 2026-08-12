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

    const { Activity, User, CreditPolicy, ActivityAudit } = await initDB();

    const activity = await Activity.findByPk(activityId, {
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'mentorId'] }],
    });

    if (!activity) return NextResponse.json({ message: 'Activity not found' }, { status: 404 });
    if (activity.status !== 'pending_mentor') {
      return NextResponse.json({ message: `Activity status is ${activity.status}, cannot perform Stage 1 Mentor review.` }, { status: 400 });
    }

    const previousStatus = activity.status;
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

    // Log Audit Trail
    await ActivityAudit.create({
      activityId: activity.id,
      previousStatus,
      newStatus: targetStatus,
      performedBy: auth.user.id,
      remarks: updateData.mentorRemarks,
      snapshotData: JSON.stringify(activity.toJSON()),
    });

    // Trigger Notifications
    const { createNotification, notifyAdmins } = await import('@/lib/notifications');

    if (targetStatus === 'mentor_approved') {
      // Notify Student
      await createNotification({
        userId: activity.studentId,
        type: 'activity_stage1_passed',
        title: 'Stage 1 Mentor Approved',
        message: `Your activity "${activity.title}" passed Stage 1 Mentor review and was forwarded for Admin final sign-off.`,
        activityId: activity.id,
      });

      // Notify Admin Group
      await notifyAdmins({
        type: 'final_review_queued',
        title: 'New Final Approval Queued',
        message: `Activity "${activity.title}" by ${activity.student?.name || 'Student'} was approved by Mentor and is awaiting Stage 2 final sign-off.`,
        activityId: activity.id,
      });
    } else {
      // Notify Student of Rejection
      await createNotification({
        userId: activity.studentId,
        type: 'activity_rejected',
        title: 'Activity Submission Rejected (Stage 1)',
        message: `Your activity "${activity.title}" was rejected by your Mentor. Reason: "${updateData.mentorRemarks}"`,
        activityId: activity.id,
      });
    }

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
