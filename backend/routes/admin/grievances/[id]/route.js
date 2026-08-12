export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// PUT /api/admin/grievances/[id] - Resolve Appeal
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const grievanceId = params?.id;
    const body = await request.json();
    const { action, resolutionRemarks } = body;

    if (!['approve', 'requeue', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Action must be approve, requeue, or dismiss.' }, { status: 400 });
    }

    const { ActivityGrievance, Activity, ActivityAudit } = await initDB();

    const grievance = await ActivityGrievance.findByPk(grievanceId, {
      include: [{ model: Activity, as: 'activity' }]
    });

    if (!grievance) {
      return NextResponse.json({ error: 'Grievance record not found' }, { status: 404 });
    }

    const activity = grievance.activity;
    let grievanceStatus = 'dismissed';
    let newActivityStatus = activity ? activity.status : 'rejected';

    if (action === 'approve') {
      grievanceStatus = 'resolved_approved';
      newActivityStatus = 'approved';
    } else if (action === 'requeue') {
      grievanceStatus = 'resolved_requeued';
      newActivityStatus = 'pending_mentor';
    } else {
      grievanceStatus = 'dismissed';
    }

    await grievance.update({
      status: grievanceStatus,
      adminId: auth.user.id,
      adminResolutionRemarks: resolutionRemarks || `Appeal ${action}d by Admin.`,
      resolvedAt: new Date(),
    });

    if (activity && newActivityStatus !== activity.status) {
      const prevStatus = activity.status;
      await activity.update({
        status: newActivityStatus,
        adminRemarks: resolutionRemarks || activity.adminRemarks,
      });

      // Log Audit Trail
      await ActivityAudit.create({
        activityId: activity.id,
        previousStatus: prevStatus,
        newStatus: newActivityStatus,
        performedBy: auth.user.id,
        remarks: `Grievance appeal ${action}d by Admin. Notes: ${resolutionRemarks || 'None'}`,
        snapshotData: JSON.stringify(activity.toJSON()),
      });
    }

    // Trigger Notification to Student
    const { createNotification } = await import('@/lib/notifications');
    await createNotification({
      userId: grievance.studentId,
      type: 'grievance_resolved',
      title: 'Grievance Appeal Decision',
      message: `Your appeal for "${activity?.title || 'Activity'}" has been reviewed by Admin. Decision: ${action.toUpperCase()}. Notes: "${resolutionRemarks || 'Processed.'}"`,
      activityId: activity?.id || null,
    });

    return NextResponse.json({
      success: true,
      message: `Grievance appeal successfully processed: ${action}d.`,
      grievance,
    });
  } catch (error) {
    console.error('Resolve grievance error:', error);
    return NextResponse.json({ error: 'Failed to process grievance resolution' }, { status: 500 });
  }
}
