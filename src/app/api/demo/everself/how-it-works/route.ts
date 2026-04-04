import { readFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DOCS: Record<string, string> = {
  readers: 'everself-growth-command-center-readers-guide.md',
  technical: 'everself-growth-command-center-how-it-works.md',
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const doc = req.nextUrl.searchParams.get('doc') ?? 'readers';
    const fileName = DOCS[doc] ?? DOCS.readers;
    const filePath = path.join(process.cwd(), 'docs', fileName);
    const markdown = await readFile(filePath, 'utf8');
    return NextResponse.json({ markdown, doc: doc in DOCS ? doc : 'readers' });
  } catch (err) {
    console.error('GET /api/demo/everself/how-it-works', err);
    return NextResponse.json({ message: 'Documentation file not found' }, { status: 404 });
  }
}
