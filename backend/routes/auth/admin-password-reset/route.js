export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { initDB } from '@/lib/database';
import { loadConfig } from '@/lib/config';

function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  try {
    const config = loadConfig();

    if (!config.enableAdminReset) {
      return NextResponse.json({ message: 'Admin password reset endpoint is disabled' }, { status: 403 });
    }

    const body = await request.json();
    const { confirmCode, newUsername, newPassword } = body;

    if (!confirmCode || !newUsername || !newPassword) {
      return NextResponse.json({
        message: 'Missing required fields: confirmCode, newUsername, newPassword',
      }, { status: 400 });
    }

    const ADMIN_RESET_CODE = process.env.ADMIN_RESET_CODE;
    if (!ADMIN_RESET_CODE) {
      return NextResponse.json({ message: 'Admin reset code not configured on server' }, { status: 500 });
    }

    if (!timingSafeCompare(confirmCode, ADMIN_RESET_CODE)) {
      console.warn('⚠️ Failed admin reset attempt due to invalid confirmation code');
      return NextResponse.json({ message: 'Invalid confirmation code' }, { status: 403 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const { User } = await initDB();
    let admin = await User.findOne({ where: { role: 'admin' } });

    if (admin) {
      admin.email = newUsername;
      admin.password = newPassword;
      admin.name = 'Admin User';
      admin.department = 'Administration';
      await admin.save();
      return NextResponse.json({ message: 'Admin credentials updated successfully', username: newUsername });
    } else {
      await User.create({
        name: 'Admin User', email: newUsername, password: newPassword,
        role: 'admin', department: 'Administration', programCategory: 'Administration',
      });
      return NextResponse.json({ message: 'Admin user created successfully', username: newUsername }, { status: 201 });
    }
  } catch (error) {
    console.error('Admin reset error:', error);
    return NextResponse.json({ message: 'Failed to reset admin credentials', error: error.message }, { status: 500 });
  }
}
