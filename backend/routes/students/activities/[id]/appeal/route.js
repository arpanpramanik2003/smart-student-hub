export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// POST /api/students/activities/[id]/appeal
export async function POST(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const activityId = params?.id;
    const body = await request.json();
    const { appealReason } = body;

    if (!appealReason || !appealReason.trim()) {
      return NextResponse.json({ error: 'Appeal explanation note is required.' }, { status: 400 });
    }

    const { Activity, User, ActivityGrievance } = await initDB();

    const activity = await Activity.findOne({
      where: { id: activityId, studentId: auth.user.id }
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity record not found' }, { status: 404 });
    }

    if (activity.status !== 'rejected') {
      return NextResponse.json({ error: 'Only rejected activities can be appealed.' }, { status: 400 });
    }

    // Check if open grievance already exists
    const existingGrievance = await ActivityGrievance.findOne({
      where: { activityId: activity.id, status: 'pending_admin' }
    });

    if (existingGrievance) {
      return NextResponse.json({ error: 'An active appeal for this activity is already pending Admin review.' }, { status: 409 });
    }

    const grievance = await ActivityGrievance.create({
      activityId: activity.id,
      studentId: auth.user.id,
      appealReason: appealReason.trim(),
      status: 'pending_admin',
    });

    // Notify Admin Group
    const studentUser = await User.findByPk(auth.user.id, { attributes: ['name'] });
    const { notifyAdmins } = await import('@/lib/notifications');
    await notifyAdmins({
      type: 'grievance_filed',
      title: 'Student Appeal Filed',
      message: `Student ${studentUser?.name || 'Student'} filed an appeal for rejected activity "${activity.title}". Note: "${appealReason.trim()}"`,
      activityId: activity.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Grievance appeal filed successfully and routed to Admin Grievances Queue.',
      grievance,
    }, { status: 201 });
  } catch (error) {
    console.error('File appeal error:', error);
    return NextResponse.json({ error: 'Failed to file grievance appeal' }, { status: 500 });
  }
}
