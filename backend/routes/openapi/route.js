export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const specPath = path.join(process.cwd(), '..', 'docs', 'openapi.json');
    const content = await fs.readFile(specPath, 'utf8');
    const spec = JSON.parse(content);
    return NextResponse.json(spec);
  } catch (error) {
    return NextResponse.json({ message: 'OpenAPI specification not found' }, { status: 404 });
  }
}
