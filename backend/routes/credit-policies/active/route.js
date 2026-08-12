import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';

export async function GET() {
  try {
    const { CreditPolicy } = await initDB();
    const policies = await CreditPolicy.findAll({
      where: { isActive: true },
      order: [['activityType', 'ASC'], ['level', 'ASC']],
    });

    // Create quick lookup map { 'conference_college': { credits, naacCriterion, ... } }
    const policyMap = {};
    policies.forEach(p => {
      const key = `${p.activityType}_${p.level}`;
      policyMap[key] = p;
    });

    return NextResponse.json({
      success: true,
      policies,
      policyMap,
    });
  } catch (error) {
    console.error('Active credit policies error:', error);
    return NextResponse.json({ error: 'Failed to fetch credit policies' }, { status: 500 });
  }
}
