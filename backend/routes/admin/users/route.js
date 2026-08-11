export const dynamic = 'force-dynamic';
import { NextResponse, createPagination } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { getCategoryValue, validateProgramSelection } from '@/lib/programsData';
import { validateBody, adminCreateUserSchema } from '@/lib/validation';
import { Op } from 'sequelize';

// GET /api/admin/users
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const programCategory = searchParams.get('programCategory');
    const program = searchParams.get('program');
    const specialization = searchParams.get('specialization');
    const year = searchParams.get('year');
    const admissionYear = searchParams.get('admissionYear');
    const offset = (page - 1) * limit;

    const { User } = await initDB();
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { programCategory: { [Op.like]: `%${search}%` } },
        { program: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role && role !== 'all') whereClause.role = role;
    if (programCategory && programCategory !== 'all') whereClause.programCategory = programCategory;
    if (program && program !== 'all') whereClause.program = program;
    if (specialization && specialization !== 'all') whereClause.specialization = specialization;
    if (year && year !== 'all') whereClause.year = parseInt(year);
    if (admissionYear && admissionYear !== 'all') whereClause.admissionYear = parseInt(admissionYear);

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: { exclude: ['password'] },
    });

    return NextResponse.json({
      users,
      pagination: createPagination(count, page, limit),
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({
      message: 'Failed to fetch users',
      error: { message: 'Failed to fetch users', details: error.message },
    }, { status: 500 });
  }
}

// POST /api/admin/users
export async function POST(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const validation = validateBody(adminCreateUserSchema, body);

    if (!validation.success) {
      return NextResponse.json(validation.errorResponse, { status: 400 });
    }

    const { name, email, password, role, department, programCategory, program, specialization, year, admissionYear, studentId } = validation.data;

    const programCategoryValue = getCategoryValue(programCategory);
    if (!programCategoryValue) return NextResponse.json({ error: { message: 'Invalid program category' }, message: 'Invalid program category' }, { status: 400 });

    if (role === 'student') {
      if (!program) return NextResponse.json({ error: { message: 'Program is required for students' }, message: 'Program is required for students' }, { status: 400 });
      if (!admissionYear) return NextResponse.json({ error: { message: 'Admission year is mandatory for students' }, message: 'Admission year is mandatory for students' }, { status: 400 });

      const pv = validateProgramSelection(programCategory, program, specialization);
      if (!pv.valid) return NextResponse.json({ error: { message: 'Invalid program selection', details: pv.message }, message: 'Invalid program selection' }, { status: 400 });
    }

    const { User } = await initDB();

    const existing = await User.findOne({ where: { email } });
    if (existing) return NextResponse.json({ error: { message: 'User with this email already exists' }, message: 'User with this email already exists' }, { status: 400 });

    const studentDepartment = role === 'student'
      ? (program || null)
      : (department || null);

    const user = await User.create({
      name, email, password, role,
      department: studentDepartment,
      programCategory: programCategoryValue,
      program: role === 'student' ? program : null,
      specialization: role === 'student' ? specialization : null,
      year: role === 'student' ? year : null,
      admissionYear: role === 'student' ? admissionYear : null,
      studentId: role === 'student' ? studentId : null,
      isActive: true,
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();
    return NextResponse.json({ success: true, message: 'User created successfully', user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: { message: 'Failed to create user', details: error.message }, message: 'Failed to create user' }, { status: 500 });
  }
}
