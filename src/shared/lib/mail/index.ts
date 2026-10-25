/**
 * src/shared/lib/mail/index.ts
 *
 * Server-only. Sends account-credential emails through Resend's REST API
 * (no extra npm dependency). Required env vars:
 *
 *   RESEND_API_KEY   API key from resend.com
 *   MAIL_FROM        verified sender, e.g.  AWSSBG-UC <accounts@yourdomain.com>
 *   SITE_URL         (optional) public site URL used for the login link
 *
 * When RESEND_API_KEY / MAIL_FROM are missing, isMailConfigured() is false and
 * the admin UI falls back to showing the passwords on screen (copy / CSV).
 */

const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";
const BATCH_SIZE = 100; // Resend's per-request maximum

export interface CredentialMail {
  memberId: string;
  to: string;
  name: string;
  temporaryPassword: string;
}

export interface MailOutcome {
  /** memberIds whose email was accepted by the provider */
  sent: string[];
  failed: { memberId: string; reason: string }[];
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loginUrl(): string | null {
  const base = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  return base ? `${base.replace(/\/+$/, "")}/login` : null;
}

function buildMessage(m: CredentialMail) {
  const url = loginUrl();
  const greeting = m.name ? `Hi ${m.name},` : "Hi,";

  const text = [
    greeting,
    "",
    "An AWSSBG-UC account has been created for you.",
    "",
    `Email: ${m.to}`,
    `Temporary password: ${m.temporaryPassword}`,
    url ? `Sign in: ${url}` : "Sign in on the AWSSBG-UC website.",
    "",
    "You will be asked to choose a permanent password the first time you sign in.",
    "Please don't share this email.",
    "",
    "— AWSSBG-UC",
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111">
<p>${esc(greeting)}</p>
<p>An AWSSBG-UC account has been created for you.</p>
<table style="border-collapse:collapse;margin:16px 0">
<tr><td style="padding:4px 12px 4px 0;color:#555">Email</td><td>${esc(m.to)}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#555">Temporary password</td><td><code style="font-size:16px;background:#f3f3f3;padding:2px 6px">${esc(m.temporaryPassword)}</code></td></tr>
</table>
${url ? `<p><a href="${esc(url)}">Sign in to AWSSBG-UC</a></p>` : "<p>Sign in on the AWSSBG-UC website.</p>"}
<p>You will be asked to choose a permanent password the first time you sign in. Please don't share this email.</p>
<p>— AWSSBG-UC</p>
</div>`;

  return {
    from: process.env.MAIL_FROM as string,
    to: [m.to],
    subject: "Your AWSSBG-UC account",
    text,
    html,
  };
}

export async function sendCredentialEmails(items: CredentialMail[]): Promise<MailOutcome> {
  const outcome: MailOutcome = { sent: [], failed: [] };

  if (!isMailConfigured()) {
    for (const it of items) {
      outcome.failed.push({ memberId: it.memberId, reason: "Email is not configured on the server." });
    }
    return outcome;
  }

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(RESEND_BATCH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk.map(buildMessage)),
      });

      if (res.ok) {
        for (const it of chunk) outcome.sent.push(it.memberId);
      } else {
        const body = await res.json().catch(() => ({} as { message?: string }));
        const reason = body?.message ?? `Mail provider returned HTTP ${res.status}.`;
        console.error("[mail] batch send failed:", res.status, reason);
        for (const it of chunk) outcome.failed.push({ memberId: it.memberId, reason });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Mail request failed.";
      console.error("[mail] batch send error:", reason);
      for (const it of chunk) outcome.failed.push({ memberId: it.memberId, reason });
    }
  }

  return outcome;
}
