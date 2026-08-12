export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// POST /api/admin/users/bulk-import - Bulk CSV Onboarding
export async function POST(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { rows, fileName = 'bulk_users_import.csv' } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty user rows provided for import.' }, { status: 400 });
    }

    const { User, UserImport } = await initDB();

    const createdList = [];
    const skippedList = [];
    const errorList = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const TEMP_PASSWORD = 'Hub#2026@Temp';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const name = row.name ? String(row.name).trim() : '';
      const email = row.email ? String(row.email).trim().toLowerCase() : '';
      const role = row.role ? String(row.role).trim().toLowerCase() : 'student';
      const department = row.department ? String(row.department).trim() : null;
      const programCategory = row.programCategory ? String(row.programCategory).trim() : null;
      const program = row.program ? String(row.program).trim() : null;
      const specialization = row.specialization ? String(row.specialization).trim() : null;
      const year = row.year ? parseInt(row.year) : null;
      const admissionYear = row.admissionYear ? parseInt(row.admissionYear) : null;
      const studentId = row.studentId ? String(row.studentId).trim() : null;

      // 1. Validation
      if (!name) {
        errorList.push({ row: rowNum, email, reason: 'Missing mandatory name field' });
        continue;
      }
      if (!email || !emailRegex.test(email)) {
        errorList.push({ row: rowNum, email, reason: 'Invalid or missing email format' });
        continue;
      }
      if (!['student', 'faculty', 'admin'].includes(role)) {
        errorList.push({ row: rowNum, email, reason: `Invalid role '${role}'. Must be student, faculty, or admin.` });
        continue;
      }

      // 2. Check Existing User
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        skippedList.push({ row: rowNum, email, name, reason: 'Account with this email already exists (Skipped)' });
        continue;
      }

      // 3. Create User with Temporary Credentials
      try {
        const newUser = await User.create({
          name,
          email,
          password: TEMP_PASSWORD,
          role,
          department,
          programCategory,
          program,
          specialization,
          year,
          admissionYear,
          studentId: studentId || `STU-${Math.floor(100000 + Math.random() * 900000)}`,
          isActive: true,
          mustChangePassword: true,
        });

        createdList.push({
          row: rowNum,
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          tempPassword: TEMP_PASSWORD,
        });
      } catch (err) {
        errorList.push({ row: rowNum, email, reason: err.message || 'Failed to create user record' });
      }
    }

    // 4. Save Import Audit Log
    const auditRecord = await UserImport.create({
      adminId: auth.user.id,
      fileName,
      totalRows: rows.length,
      createdCount: createdList.length,
      skippedCount: skippedList.length,
      errorCount: errorList.length,
      details: JSON.stringify({
        created: createdList.map(c => ({ id: c.id, email: c.email })),
        skipped: skippedList,
        errors: errorList,
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Bulk import completed: ${createdList.length} created, ${skippedList.length} skipped, ${errorList.length} failed.`,
      importSummary: {
        importId: auditRecord.id,
        totalRows: rows.length,
        createdCount: createdList.length,
        skippedCount: skippedList.length,
        errorCount: errorList.length,
      },
      createdList,
      skippedList,
      errorList,
    });
  } catch (error) {
    console.error('Bulk user import error:', error);
    return NextResponse.json({ error: 'Bulk import execution failed', details: error.message }, { status: 500 });
  }
}
