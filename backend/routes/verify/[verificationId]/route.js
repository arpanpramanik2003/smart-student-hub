export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';

// GET /api/verify/[verificationId] - Public Verification Endpoint
export async function GET(request, { params }) {
  try {
    const { verificationId } = params;
    if (!verificationId) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const { Activity, User } = await initDB();

    const activity = await Activity.findOne({
      where: { verificationId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name'], // ONLY public name, NO email/phone/studentId
        },
      ],
    });

    if (!activity) {
      return NextResponse.json({
        found: false,
        status: 'not_found',
        message: 'No institutional record matches this verification identifier.',
      }, { status: 404 });
    }

    // Check if record is revoked
    if (activity.isRevoked) {
      return NextResponse.json({
        found: true,
        status: 'revoked',
        verificationId: activity.verificationId,
        studentName: activity.student?.name || 'Student',
        institutionName: 'Smart Student Hub University',
        activityTitle: activity.title,
        activityType: activity.type,
        achievementLevel: activity.achievementLevel,
        credits: parseFloat(activity.credits) || 0,
        naacCriterion: activity.naacCriterion || 'Criterion 5',
        activityDate: activity.date,
        approvalDate: activity.finalApprovedAt || activity.updatedAt,
        revokedAt: activity.revokedAt,
        revocationReason: activity.revocationReason || 'Revoked by institution administration.',
        message: 'THIS CREDENTIAL WAS OFFICIALLY REVOKED BY THE ISSUING INSTITUTION.',
      });
    }

    // Check if activity status is not approved
    if (activity.status !== 'approved') {
      return NextResponse.json({
        found: false,
        status: 'unverified',
        message: 'Record is pending institutional review and is not an officially verified credential.',
      }, { status: 400 });
    }

    // Official Approved Verification Payload (EXCLUDES ALL SENSITIVE INTERNAL FIELDS)
    return NextResponse.json({
      found: true,
      status: 'approved',
      verificationId: activity.verificationId,
      studentName: activity.student?.name || 'Student',
      institutionName: 'Smart Student Hub University',
      activityTitle: activity.title,
      activityType: activity.type,
      achievementLevel: activity.achievementLevel,
      credits: parseFloat(activity.credits) || 0,
      naacCriterion: activity.naacCriterion || 'Criterion 5',
      activityDate: activity.date,
      approvalDate: activity.finalApprovedAt || activity.updatedAt,
      message: 'OFFICIALLY VERIFIED INSTITUTIONAL CREDENTIAL',
    });
  } catch (error) {
    console.error('Public verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
