export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// POST /api/auth/change-password - First-Login Password Change
export async function POST(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'faculty', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { newPassword } = await request.json();

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    const { User } = await initDB();
    const user = await User.findByPk(auth.user.id);

    if (!user) return NextResponse.json({ error: 'User record not found.' }, { status: 404 });

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. Account credentials secured.',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
