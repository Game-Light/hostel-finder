import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/lib/emailTemplates'

export async function POST(req: NextRequest) {
  const { email, name, role } = await req.json()

  if (!email || !role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const result = await sendEmail({
    to: email,
    subject: 'Welcome to Hostel Finder!',
    html: welcomeEmail(name || 'there', role === 'agent' ? 'agent' : 'student'),
  })

  return NextResponse.json(result)
}