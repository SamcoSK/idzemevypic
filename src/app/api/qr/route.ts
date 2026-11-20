import { NextRequest, NextResponse } from 'next/server';
import qrcode from 'qrcode';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || searchParams.get('url');

  if (!text) {
    return new NextResponse('Missing text or url parameter', { status: 400 });
  }

  try {
    const pngBuffer = await qrcode.toBuffer(text, {
      type: 'png',
      width: 280,
      margin: 1,
      color: {
        dark: '#FF2E93',
        light: '#0B0620',
      },
    });

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'Error generating QR code', { status: 500 });
  }
}
