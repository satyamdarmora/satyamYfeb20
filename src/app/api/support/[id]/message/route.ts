import { NextRequest, NextResponse } from 'next/server';
import { backendPost, transformSupportCase } from '@/lib/backend';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get('authorization');
  const { id } = await params;
  const body = await req.json();

  // Extract numeric ID from SUP-XXX format
  const numericId = parseInt(id.replace('SUP-', ''));

  try {
    const updated = await backendPost(`/v1/support/${numericId}/message`, {
      text: body.text,
      sender: body.sender || 'CSP',
    }, auth);
    return NextResponse.json({ ok: true, case: transformSupportCase(updated) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
