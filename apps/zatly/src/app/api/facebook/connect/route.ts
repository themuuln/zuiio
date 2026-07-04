import { NextResponse } from 'next/server';
import { saveFacebookConnection } from '@/lib/facebookConnection';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pageId, pageName, pageAccessToken } = body;

    if (!pageId || !pageName || !pageAccessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await saveFacebookConnection({
      pageId,
      pageName,
      pageAccessToken,
      connectedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving connection:', error);
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }
}
