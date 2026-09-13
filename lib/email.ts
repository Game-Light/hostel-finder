// Sends transactional emails via the Resend API directly — not Supabase's
// auth SMTP, which only handles login/reset/confirm emails. This is for
// everything else: welcome emails, listing approved/rejected notices, etc.
//
// Server-only. Never import this from a client component — RESEND_API_KEY
// must never reach the browser bundle.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Hostel Finder <noreply@hostelfinder.com.ng>'

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set — email not sent:', subject, to)
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend API error:', errorBody)
      return { success: false, error: errorBody }
    }

    return { success: true }
  } catch (err) {
    console.error('Email send failed:', err)
    return { success: false, error: String(err) }
  }
}