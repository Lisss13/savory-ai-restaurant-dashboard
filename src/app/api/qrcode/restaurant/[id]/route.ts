import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = `${API_BASE_URL}/qrcodes/restaurant/${id}`;

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('Content-Type') || '';

    // If response has image content, return it regardless of status code
    if (contentType.includes('image/')) {
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
        },
      });
    }

    // If not an image, return error
    return NextResponse.json(
      { error: 'Failed to fetch QR code' },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
