import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const { id, tableId } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/qrcodes/restaurant/${id}/table/${tableId}/download`);
    const contentType = response.headers.get('Content-Type') || '';

    if (contentType.includes('image/')) {
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="qr-table-${tableId}.png"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to download QR code' },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
