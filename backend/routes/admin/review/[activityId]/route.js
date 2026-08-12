export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import crypto from 'crypto';

// PUT /api/admin/review/[activityId] - Admin Stage 2 Final Sign-Off & Revocation
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { activityId } = params;
    const body = await request.json();
    const { action, status, remarks, credits } = body;

    const { Activity, User, CreditPolicy, ActivityAudit } = await initDB();

    const activity = await Activity.findByPk(activityId);
    if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

    const previousStatus = activity.status;
    const isRevokeAction = action === 'revoke' || status === 'revoked';

    // Revocation of previously approved activity
    if (isRevokeAction) {
      if (activity.status !== 'approved') {
        return NextResponse.json({ error: 'Only approved activities can be revoked.' }, { status: 400 });
      }

      const revocationReason = remarks || 'Revoked by institution admin due to credential verification audit.';
      
      await activity.update({
        status: 'rejected',
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: auth.user.id,
        revocationReason,
      });

      // Log Audit Trail
      await ActivityAudit.create({
        activityId: activity.id,
        previousStatus: 'approved',
        newStatus: 'revoked',
        performedBy: auth.user.id,
        remarks: revocationReason,
        snapshotData: JSON.stringify(activity.toJSON()),
      });

      // Trigger Notification to Student
      const { createNotification } = await import('@/lib/notifications');
      await createNotification({
        userId: activity.studentId,
        type: 'activity_revoked',
        title: 'Activity Credential Revoked',
        message: `Your previously approved activity "${activity.title}" was revoked by institution admin. Reason: "${revocationReason}"`,
        activityId: activity.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Activity credential officially revoked and logged.',
        activity,
      });
    }

    // Normal Stage 2 Approval / Rejection
    if (activity.status !== 'mentor_approved' && activity.status !== 'pending_mentor') {
      return NextResponse.json({ error: `Activity status is ${activity.status}, cannot perform final approval.` }, { status: 400 });
    }

    const targetStatus = action === 'approve' || status === 'approved' ? 'approved' : 'rejected';

    // Generate cryptographic verification ID for approved activity
    let verificationId = activity.verificationId;
    if (targetStatus === 'approved' && !verificationId) {
      verificationId = 'vref_' + crypto.randomBytes(16).toString('hex');
    }

    const updateData = {
      status: targetStatus,
      approvedBy: auth.user.id,
      finalApprovedBy: auth.user.id,
      finalApprovedAt: new Date(),
      adminRemarks: remarks || (targetStatus === 'approved' ? 'Final institutional approval granted.' : 'Rejected by Admin.'),
      verificationId: targetStatus === 'approved' ? verificationId : activity.verificationId,
      isRevoked: false,
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
      remarks: updateData.adminRemarks,
      snapshotData: JSON.stringify(activity.toJSON()),
    });

    // Trigger Notification to Student
    const { createNotification } = await import('@/lib/notifications');
    if (targetStatus === 'approved') {
      await createNotification({
        userId: activity.studentId,
        type: 'activity_approved',
        title: 'Institutional Final Approval Granted',
        message: `Congratulations! Your activity "${activity.title}" received final institutional approval. +${activity.credits} credits granted. Verification Token: ${verificationId}`,
        activityId: activity.id,
      });
    } else {
      await createNotification({
        userId: activity.studentId,
        type: 'activity_rejected',
        title: 'Activity Submission Rejected (Stage 2 Final)',
        message: `Your activity "${activity.title}" was rejected at Stage 2 final review. Reason: "${updateData.adminRemarks}"`,
        activityId: activity.id,
      });
    }

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
        ? 'Activity granted final approval. Verification ID generated.'
        : 'Activity rejected at final admin review.',
      activity: updatedActivity,
    });
  } catch (error) {
    console.error('Admin final review error:', error);
    return NextResponse.json({ error: 'Failed to process final approval' }, { status: 500 });
  }
}
