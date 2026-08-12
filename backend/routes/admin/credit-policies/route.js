export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// GET /api/admin/credit-policies
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { CreditPolicy } = await initDB();
    const policies = await CreditPolicy.findAll({
      order: [['activityType', 'ASC'], ['level', 'ASC']],
    });

    return NextResponse.json({
      success: true,
      policies,
    });
  } catch (error) {
    console.error('Get credit policies error:', error);
    return NextResponse.json({ error: 'Failed to fetch credit policies' }, { status: 500 });
  }
}

// POST /api/admin/credit-policies
export async function POST(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { activityType, level, credits, naacCriterion, description, isActive } = body;

    if (!activityType || !level || credits === undefined || !naacCriterion) {
      return NextResponse.json({ error: 'Missing required fields: activityType, level, credits, naacCriterion' }, { status: 400 });
    }

    const { CreditPolicy } = await initDB();

    const existing = await CreditPolicy.findOne({ where: { activityType, level } });
    if (existing) {
      return NextResponse.json({ error: `Credit policy for ${activityType} at ${level} level already exists.` }, { status: 409 });
    }

    const policy = await CreditPolicy.create({
      activityType,
      level,
      credits: parseFloat(credits),
      naacCriterion,
      description: description || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: auth.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Credit policy rule created successfully',
      policy,
    }, { status: 201 });
  } catch (error) {
    console.error('Create credit policy error:', error);
    return NextResponse.json({ error: 'Failed to create credit policy' }, { status: 500 });
  }
}
