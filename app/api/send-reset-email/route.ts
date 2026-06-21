import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Generate reset link using service role key (bypasses rate limit)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    },
  })

  if (linkError || !data?.properties?.action_link) {
    return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 })
  }

  const resetLink = data.properties.action_link

  // Send via Resend
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Hostel Finder <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your Hostel Finder password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #034338; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #4B6B62; margin-bottom: 24px;">
            Click the button below to set a new password for your Hostel Finder account.
            This link expires in 1 hour.
          </p>
          <a href="${resetLink}"
            style="display: inline-block; background-color: #034338; color: #ffffff;
                   padding: 12px 24px; border-radius: 8px; text-decoration: none;
                   font-weight: bold; font-size: 14px;">
            Reset Password
          </a>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    }),
  })

  if (!resendRes.ok) {
    const err = await resendRes.json()
    console.error('Resend error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}