import { NextResponse } from 'next/server';
import { exportMyData } from '@/lib/actions/account';

/** POPIA "Download my data" — streams the signed-in user's data as JSON. */
export async function GET() {
  const json = await exportMyData();
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="run-rewards-my-data.json"',
    },
  });
}
