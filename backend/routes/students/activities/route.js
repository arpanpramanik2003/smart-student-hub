export const dynamic = 'force-dynamic';
import { NextResponse, createPagination } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { uploadFile } from '@/lib/cloudStorage';
import { validateBody, activitySchema } from '@/lib/validation';

const DEFAULT_NAAC_MAP = {
  online_course: 'Criterion 1',
  certification: 'Criterion 1',
  workshop: 'Criterion 1',
  conference: 'Criterion 2',
  competition: 'Criterion 3',
  internship: 'Criterion 3',
  leadership: 'Criterion 5',
  club_activity: 'Criterion 5',
  community_service: 'Criterion 7',
};

// GET /api/students/activities
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { Activity, User, CreditPolicy } = await initDB();

    const where = { studentId: auth.user.id };
    if (status && status !== 'all') where.status = status;
    if (type && type !== 'all') where.type = type;

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        { model: User, as: 'approver', attributes: ['name', 'email'], required: false },
        { model: User, as: 'mentorReviewer', attributes: ['name', 'email'], required: false },
        { model: User, as: 'finalApprover', attributes: ['name', 'email'], required: false },
        { model: CreditPolicy, as: 'policy', required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      activities: rows,
      pagination: createPagination(count, page, limit),
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/students/activities
export async function POST(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const contentType = request.headers.get('content-type') || '';
    let rawFields = {};
    let certificateFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      rawFields = {
        title: formData.get('title'),
        type: formData.get('type'),
        achievementLevel: formData.get('achievementLevel') || 'college',
        description: formData.get('description'),
        date: formData.get('date'),
        duration: formData.get('duration'),
        organizer: formData.get('organizer'),
      };
      certificateFile = formData.get('certificate');
    } else {
      rawFields = await request.json();
    }

    const achievementLevel = rawFields.achievementLevel || 'college';

    const validation = validateBody(activitySchema, rawFields);
    if (!validation.success) {
      return NextResponse.json(validation.errorResponse, { status: 400 });
    }

    const { title, type, description, date, duration, organizer } = validation.data;

    const { Activity, User, CreditPolicy, ActivityAudit } = await initDB();

    // Look up credit policy rule dynamically (type + level)
    let assignedCredits = 1.0;
    let policyId = null;
    let naacCriterion = DEFAULT_NAAC_MAP[type] || 'Criterion 5';

    const activePolicy = await CreditPolicy.findOne({
      where: { activityType: type, level: achievementLevel, isActive: true }
    });

    if (activePolicy) {
      assignedCredits = parseFloat(activePolicy.credits);
      policyId = activePolicy.id;
      naacCriterion = activePolicy.naacCriterion;
    } else {
      // Fallback policy calculation if specific level policy not found
      const baseMap = { conference: 2.0, workshop: 1.0, certification: 2.0, competition: 2.0, internship: 3.0, leadership: 1.5, community_service: 1.5, club_activity: 1.0, online_course: 1.5 };
      const multMap = { college: 1.0, state: 1.5, national: 2.0, international: 3.0 };
      assignedCredits = Math.round((baseMap[type] || 1.0) * (multMap[achievementLevel] || 1.0) * 10) / 10;
    }

    let fileUrl = null;
    if (certificateFile && typeof certificateFile === 'object') {
      const buffer = Buffer.from(await certificateFile.arrayBuffer());
      fileUrl = await uploadFile({ buffer, originalname: certificateFile.name, mimetype: certificateFile.type }, 'certificates');
    }

    const activity = await Activity.create({
      title,
      type,
      achievementLevel,
      policyId,
      naacCriterion,
      description: description || null,
      date: new Date(date),
      duration: duration || null,
      organizer: organizer || null,
      credits: assignedCredits,
      status: 'pending_mentor',
      studentId: auth.user.id,
      filePath: fileUrl,
    });

    // Log initial audit snapshot
    await ActivityAudit.create({
      activityId: activity.id,
      previousStatus: 'N/A',
      newStatus: 'pending_mentor',
      performedBy: auth.user.id,
      remarks: 'Initial student submission',
      snapshotData: JSON.stringify(activity.toJSON()),
    });

    // Notify assigned Faculty Mentor if assigned
    const studentUser = await User.findByPk(auth.user.id, { attributes: ['name', 'mentorId'] });
    if (studentUser?.mentorId) {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification({
        userId: studentUser.mentorId,
        type: 'mentee_submission',
        title: 'New Mentee Submission',
        message: `Mentee ${studentUser.name} submitted "${activity.title}" for Stage 1 Mentor review.`,
        activityId: activity.id,
      });
    }

    return NextResponse.json({
      message: 'Activity submitted successfully and routed to your Faculty Mentor for Stage 1 review.',
      activity: {
        id: activity.id,
        title: activity.title,
        type: activity.type,
        achievementLevel: activity.achievementLevel,
        naacCriterion: activity.naacCriterion,
        credits: activity.credits,
        status: activity.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
