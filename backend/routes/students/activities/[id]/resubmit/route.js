export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { uploadFile } from '@/lib/cloudStorage';

// PUT /api/students/activities/[id]/resubmit
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const activityId = params?.id;
    const { Activity, User, CreditPolicy, ActivityAudit } = await initDB();

    const activity = await Activity.findOne({
      where: { id: activityId, studentId: auth.user.id }
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity record not found' }, { status: 404 });
    }

    if (activity.status !== 'rejected') {
      return NextResponse.json({ error: 'Only rejected activities can be resubmitted.' }, { status: 400 });
    }

    const contentType = request.headers.get('content-type') || '';
    let rawFields = {};
    let certificateFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      rawFields = {
        title: formData.get('title'),
        type: formData.get('type'),
        achievementLevel: formData.get('achievementLevel'),
        description: formData.get('description'),
        date: formData.get('date'),
        duration: formData.get('duration'),
        organizer: formData.get('organizer'),
      };
      certificateFile = formData.get('certificate');
    } else {
      rawFields = await request.json();
    }

    // Preserve previous snapshot audit before updating
    await ActivityAudit.create({
      activityId: activity.id,
      previousStatus: 'rejected',
      newStatus: 'pending_mentor',
      performedBy: auth.user.id,
      remarks: 'Student resubmitted activity with corrections.',
      snapshotData: JSON.stringify(activity.toJSON()),
    });

    // Handle optional new certificate file upload
    let fileUrl = activity.filePath;
    if (certificateFile && typeof certificateFile === 'object') {
      const buffer = Buffer.from(await certificateFile.arrayBuffer());
      fileUrl = await uploadFile({ buffer, originalname: certificateFile.name, mimetype: certificateFile.type }, 'certificates');
    }

    // Look up credit policy
    const type = rawFields.type || activity.type;
    const achievementLevel = rawFields.achievementLevel || activity.achievementLevel;

    let assignedCredits = activity.credits;
    let policyId = activity.policyId;
    let naacCriterion = activity.naacCriterion;

    const activePolicy = await CreditPolicy.findOne({
      where: { activityType: type, level: achievementLevel, isActive: true }
    });

    if (activePolicy) {
      assignedCredits = parseFloat(activePolicy.credits);
      policyId = activePolicy.id;
      naacCriterion = activePolicy.naacCriterion;
    }

    await activity.update({
      title: rawFields.title || activity.title,
      type,
      achievementLevel,
      policyId,
      naacCriterion,
      description: rawFields.description !== undefined ? rawFields.description : activity.description,
      date: rawFields.date ? new Date(rawFields.date) : activity.date,
      duration: rawFields.duration !== undefined ? rawFields.duration : activity.duration,
      organizer: rawFields.organizer !== undefined ? rawFields.organizer : activity.organizer,
      credits: assignedCredits,
      filePath: fileUrl,
      status: 'pending_mentor',
    });

    // Notify assigned Faculty Mentor
    const studentUser = await User.findByPk(auth.user.id, { attributes: ['name', 'mentorId'] });
    if (studentUser?.mentorId) {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification({
        userId: studentUser.mentorId,
        type: 'mentee_submission',
        title: 'Mentee Resubmission',
        message: `Mentee ${studentUser.name} resubmitted rejected activity "${activity.title}" with corrections.`,
        activityId: activity.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Activity resubmitted successfully and routed back to Faculty Mentor for Stage 1 review.',
      activity,
    });
  } catch (error) {
    console.error('Resubmit activity error:', error);
    return NextResponse.json({ error: 'Failed to resubmit activity' }, { status: 500 });
  }
}
