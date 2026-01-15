import { NextResponse } from 'next/server';

// Backend configuration for test mode
// This can be changed in the backend without frontend changes
const EMAIL_TEST_MODE = process.env.EMAIL_TEST_MODE === 'true' || false;

export async function GET() {
  return NextResponse.json({
    test: EMAIL_TEST_MODE,
    message: EMAIL_TEST_MODE 
      ? 'Email functionality is enabled (test mode)' 
      : 'City feedback mode is active (test mode disabled)'
  });
}
