export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// GET /api/notifications
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'faculty', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { Notification } = await initDB();

    const [unreadCount, notifications] = await Promise.all([
      Notification.count({ where: { userId: auth.user.id, isRead: false } }),
      Notification.findAll({
        where: { userId: auth.user.id },
        order: [['createdAt', 'DESC']],
        limit: 20,
      }),
    ]);

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH /api/notifications (Mark as read)
export async function PATCH(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'faculty', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    const { Notification } = await initDB();

    if (markAllRead) {
      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { userId: auth.user.id, isRead: false } }
      );
    } else if (notificationId) {
      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { id: notificationId, userId: auth.user.id } }
      );
    }

    return NextResponse.json({ success: true, message: 'Notifications updated' });
  } catch (error) {
    console.error('Mark read notification error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
