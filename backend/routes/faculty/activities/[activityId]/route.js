export const dynamic = 'force-dynamic';
import { NextResponse } from 'file:///D:/Edutation(P)/SIH/smart-student-hub/backend/lib/nextResponse.js';
import { initDB } from 'file:///D:/Edutation(P)/SIH/smart-student-hub/backend/lib/database.js';
import { authenticateAndAuthorize } from 'file:///D:/Edutation(P)/SIH/smart-student-hub/backend/lib/auth.js';

// PUT /api/faculty/activities/[activityId]
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['faculty', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { activityId } = params;
    const body = await request.json();
    const { status, remarks, credits } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Validation error', details: 'status must be approved or rejected' }, { status: 400 });
    }

    const { Activity, User } = await initDB();

    const activity = await Activity.findByPk(activityId, {
      include: [{ model: User, as: 'student', attributes: ['name', 'email'] }],
    });

    if (!activity) return NextResponse.json({ message: 'Activity not found' }, { status: 404 });
    if (activity.status !== 'pending') return NextResponse.json({ message: 'Activity has already been reviewed' }, { status: 400 });

    const updateData = {
      status,
      approvedBy: auth.user.id,
      remarks: remarks || null,
    };
    if (status === 'approved' && credits !== undefined) {
      updateData.credits = credits;
    }

    await activity.update(updateData);

    const updatedActivity = await Activity.findByPk(activityId, {
      include: [
        { model: User, as: 'student', attributes: ['name', 'email', 'studentId'] },
        { model: User, as: 'approver', attributes: ['name', 'email'] },
      ],
    });

    return NextResponse.json({ message: `Activity ${status} successfully`, activity: updatedActivity });
  } catch (error) {
    console.error('Review activity error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
