export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';

// PUT /api/admin/credit-policies/:id
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const policyId = params?.id;
    const body = await request.json();
    const { credits, naacCriterion, description, isActive } = body;

    const { CreditPolicy } = await initDB();
    const policy = await CreditPolicy.findByPk(policyId);

    if (!policy) {
      return NextResponse.json({ error: 'Credit policy rule not found' }, { status: 404 });
    }

    if (credits !== undefined) policy.credits = parseFloat(credits);
    if (naacCriterion) policy.naacCriterion = naacCriterion;
    if (description !== undefined) policy.description = description;
    if (isActive !== undefined) policy.isActive = Boolean(isActive);

    await policy.save();

    return NextResponse.json({
      success: true,
      message: 'Credit policy updated successfully',
      policy,
    });
  } catch (error) {
    console.error('Update credit policy error:', error);
    return NextResponse.json({ error: 'Failed to update credit policy' }, { status: 500 });
  }
}

// PATCH /api/admin/credit-policies/:id
export async function PATCH(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const policyId = params?.id;
    const { CreditPolicy } = await initDB();
    const policy = await CreditPolicy.findByPk(policyId);

    if (!policy) {
      return NextResponse.json({ error: 'Credit policy rule not found' }, { status: 404 });
    }

    policy.isActive = !policy.isActive;
    await policy.save();

    return NextResponse.json({
      success: true,
      message: `Credit policy ${policy.isActive ? 'activated' : 'deactivated'} successfully`,
      policy,
    });
  } catch (error) {
    console.error('Toggle credit policy error:', error);
    return NextResponse.json({ error: 'Failed to toggle credit policy' }, { status: 500 });
  }
}
