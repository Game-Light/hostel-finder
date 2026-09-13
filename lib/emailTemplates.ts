// Plain HTML strings, inline styles only — email clients don't support
// external stylesheets or most CSS classes, so this can't reuse Tailwind.

const BRAND = {
  green: '#37D76A',
  forest: '#034338',
  text: '#0A2A23',
  muted: '#4B6B62',
  bg: '#F4F6F5',
}

function wrapper(content: string) {
  return `
  <div style="background-color:${BRAND.bg};padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
      <div style="background-color:${BRAND.forest};padding:24px 32px;">
        <span style="color:#FFFFFF;font-size:18px;font-weight:800;">Hostel Finder</span>
      </div>
      <div style="padding:32px;">
        ${content}
      </div>
      <div style="padding:20px 32px;background-color:${BRAND.bg};text-align:center;">
        <p style="color:${BRAND.muted};font-size:12px;margin:0;">© 2026 Hostel Finder. Discover your perfect home away from home.</p>
      </div>
    </div>
  </div>`
}

export function welcomeEmail(name: string, role: 'student' | 'agent') {
  const body = role === 'agent'
    ? `<p style="color:${BRAND.text};font-size:15px;line-height:1.6;">
        Your agent account is ready. Add your first listing and start reaching students near FUOYE.
      </p>
      <a href="https://hostelfinder.com.ng/agent/listings/new"
        style="display:inline-block;background-color:${BRAND.green};color:${BRAND.forest};font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:16px;">
        Add your first listing
      </a>`
    : `<p style="color:${BRAND.text};font-size:15px;line-height:1.6;">
        Browse verified hostels near FUOYE and contact agents directly on WhatsApp — completely free.
      </p>
      <a href="https://hostelfinder.com.ng/listings"
        style="display:inline-block;background-color:${BRAND.green};color:${BRAND.forest};font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:16px;">
        Browse hostels
      </a>`

  return wrapper(`
    <h1 style="color:${BRAND.text};font-size:20px;margin:0 0 8px;">Welcome, ${name}!</h1>
    ${body}
  `)
}

export function listingApprovedEmail(agentName: string, listingName: string, listingSlug: string) {
  return wrapper(`
    <h1 style="color:${BRAND.text};font-size:20px;margin:0 0 8px;">Your listing is live 🎉</h1>
    <p style="color:${BRAND.text};font-size:15px;line-height:1.6;">
      Hi ${agentName}, <strong>${listingName}</strong> has been approved and is now visible to students on Hostel Finder.
    </p>
    <a href="https://hostelfinder.com.ng/listings/${listingSlug}"
      style="display:inline-block;background-color:${BRAND.green};color:${BRAND.forest};font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:16px;">
      View your listing
    </a>
  `)
}

export function listingRejectedEmail(agentName: string, listingName: string, reason: string) {
  return wrapper(`
    <h1 style="color:${BRAND.text};font-size:20px;margin:0 0 8px;">Your listing needs changes</h1>
    <p style="color:${BRAND.text};font-size:15px;line-height:1.6;">
      Hi ${agentName}, <strong>${listingName}</strong> wasn't approved this time.
    </p>
    <div style="background-color:#FEE2E2;border-radius:12px;padding:14px 16px;margin:16px 0;">
      <p style="color:#991B1B;font-size:13px;font-weight:700;margin:0 0 4px;">REASON GIVEN</p>
      <p style="color:#991B1B;font-size:14px;margin:0;">${reason}</p>
    </div>
    <p style="color:${BRAND.muted};font-size:14px;line-height:1.6;">
      Edit your listing to fix this, then it'll go back into the review queue.
    </p>
    <a href="https://hostelfinder.com.ng/agent/dashboard"
      style="display:inline-block;background-color:${BRAND.forest};color:#FFFFFF;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:8px;">
      Go to your dashboard
    </a>
  `)
}