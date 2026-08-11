export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return NextResponse.json({ message: 'File URL is required' }, { status: 400 });

    // ── Local file (dev) ────────────────────────────────────
    if (url.startsWith('/uploads/')) {
      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
      const sanitizedUrl = url.replace(/^\/+/, '');
      const localPath = path.resolve(process.cwd(), 'public', sanitizedUrl);
      const relative = path.relative(uploadsDir, localPath);
      const isInsideUploads = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

      if (!isInsideUploads) {
        return NextResponse.json({ message: 'Invalid file path or access denied' }, { status: 403 });
      }
      if (!fs.existsSync(localPath)) {
        return NextResponse.json({ message: 'File not found' }, { status: 404 });
      }
      const buffer = fs.readFileSync(localPath);
      const ext = path.extname(url).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'inline',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // ── Cloudinary proxy ────────────────────────────────────
    if (!url.includes('res.cloudinary.com')) {
      return NextResponse.json({ message: 'Invalid file URL' }, { status: 403 });
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/pdf,*/*' },
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Failed to fetch file' }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/pdf';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      },
    });
  } catch (error) {
    console.error('File view error:', error.message);
    return NextResponse.json({ message: 'Failed to fetch file from storage', details: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
}
