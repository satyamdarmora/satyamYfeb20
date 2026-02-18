import { NextResponse } from 'next/server';
import { getTheme, setTheme } from '@/lib/theme-store';

export async function GET() {
  return NextResponse.json({ theme: getTheme() });
}

export async function POST(request: Request) {
  const { theme } = await request.json();
  if (theme === 'dark' || theme === 'state-color-check') {
    setTheme(theme);
  }
  return NextResponse.json({ ok: true, theme: getTheme() });
}
