/**
 * src/shared/lib/mail/index.ts
 *
 * Server-only. Sends account-credential emails through the Gmail API
 * (users.messages.send) using an OAuth2 refresh token. No extra npm dependency.
 * Required env vars:
 *
 *   GMAIL_CLIENT_ID       OAuth client ID (Google Cloud Console)
 *   GMAIL_CLIENT_SECRET   OAuth client secret
 *   GMAIL_REFRESH_TOKEN   Refresh token granted for the https://www.googleapis.com/auth/gmail.send scope
 *   MAIL_FROM             sender, e.g.  AWSSBG-UC <accounts@yourdomain.com>
 *                         (must be the authorised Gmail account or one of its "Send mail as" aliases)
 *
 * When any of the required vars are missing, isMailConfigured() is false and
 * the admin UI falls back to showing the passwords on screen (copy / CSV).
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const LOGIN_URL = "https://awssbguc-web.vercel.app/login";
const CONCURRENCY = 5; // parallel sends per wave; Gmail has no batch-send endpoint

export interface CredentialMail {
  memberId: string;
  to: string;
  name: string;
  temporaryPassword: string;
  /** true when an existing account got a new temporary password (wording differs) */
  reset?: boolean;
}

export interface MailOutcome {
  /** memberIds whose email was accepted by the provider */
  sent: string[];
  failed: { memberId: string; reason: string }[];
}

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN &&
      process.env.MAIL_FROM,
  );
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip CR/LF so user-supplied values can never inject extra mail headers. */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildMessage(m: CredentialMail) {
  const url = LOGIN_URL;
  const greeting = m.name ? `Hi ${m.name},` : "Hi,";
  const intro = m.reset
    ? "A new temporary password has been issued for your AWSSBG-UC account. Your previous password no longer works."
    : "An AWSSBG-UC account has been created for you.";

  // The password sits alone on its own line (text) / in its own block (HTML) so a triple-click
  // or long-press selects exactly the password and nothing else.
  const text = [
    greeting,
    "",
    intro,
    "",
    `Email: ${m.to}`,
    "",
    "Temporary password (select the line below and copy it):",
    "",
    m.temporaryPassword,
    "",
    `Sign in: ${url}`,
    "",
    "You will be asked to choose a permanent password the first time you sign in.",
    "Please don't share this email.",
    "",
    "— AWSSBG-UC",
  ].join("\n");

  const mono = "'JetBrains Mono',Consolas,Menlo,'Courier New',monospace";
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td style="background:#000000;border:3px solid #000000">
<a href="${esc(url)}" style="display:inline-block;padding:12px 22px;font-family:${mono};font-size:15px;font-weight:bold;color:#fff7a1;text-decoration:none">Sign in to AWSSBG-UC &rarr;</a>
</td></tr></table>
<p style="margin:0 0 20px;color:#555">Or open this link: <a href="${esc(url)}" style="color:#111">${esc(url)}</a></p>`;

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:520px">
<p>${esc(greeting)}</p>
<p>${esc(intro)}</p>
<p style="margin:16px 0 4px;color:#555">Email</p>
<p style="margin:0 0 16px">${esc(m.to)}</p>
<p style="margin:0 0 6px;color:#555">Temporary password <span style="color:#888">(triple-click or long-press to select, then copy)</span></p>
<div style="margin:0 0 20px;padding:14px 16px;background:#f3f3f3;border:2px solid #111;font-family:${mono};font-size:22px;font-weight:bold;letter-spacing:1px;color:#000;word-break:keep-all;-webkit-user-select:all;user-select:all">${esc(m.temporaryPassword)}</div>
${button}
<p>You will be asked to choose a permanent password the first time you sign in. Please don't share this email.</p>
<p>— AWSSBG-UC</p>
</div>`;

  return {
    from: headerSafe(process.env.MAIL_FROM as string),
    to: headerSafe(m.to),
    subject: m.reset ? "Your new AWSSBG-UC temporary password" : "Your AWSSBG-UC account",
    text,
    html,
  };
}

/** Base64 with 76-char lines, as required for MIME bodies. */
function b64Lines(value: string): string {
  return (Buffer.from(value, "utf-8").toString("base64").match(/.{1,76}/g) ?? []).join("\r\n");
}

/** Build an RFC 5322 multipart/alternative message and return it base64url-encoded for Gmail. */
function toRaw(msg: ReturnType<typeof buildMessage>): string {
  const boundary = `awssbguc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const subject = `=?UTF-8?B?${Buffer.from(msg.subject, "utf-8").toString("base64")}?=`;

  const mime = [
    `From: ${msg.from}`,
    `To: ${msg.to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    b64Lines(msg.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    b64Lines(msg.html),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return Buffer.from(mime, "utf-8").toString("base64url");
}

// Access tokens last ~1 hour; reuse within a warm server instance.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID as string,
      client_secret: process.env.GMAIL_CLIENT_SECRET as string,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN as string,
      grant_type: "refresh_token",
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !body.access_token) {
    cachedToken = null;
    throw new Error(body.error_description ?? body.error ?? `Google token endpoint returned HTTP ${res.status}.`);
  }

  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

async function sendOne(accessToken: string, item: CredentialMail): Promise<void> {
  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: toRaw(buildMessage(item)) }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    if (res.status === 401) cachedToken = null;
    throw new Error(body?.error?.message ?? `Gmail API returned HTTP ${res.status}.`);
  }
}

export async function sendCredentialEmails(items: CredentialMail[]): Promise<MailOutcome> {
  const outcome: MailOutcome = { sent: [], failed: [] };

  if (!isMailConfigured()) {
    for (const it of items) {
      outcome.failed.push({ memberId: it.memberId, reason: "Email is not configured on the server." });
    }
    return outcome;
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Could not authenticate with Gmail.";
    console.error("[mail] auth error:", reason);
    for (const it of items) outcome.failed.push({ memberId: it.memberId, reason });
    return outcome;
  }

  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const wave = items.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(wave.map((it) => sendOne(accessToken, it)));

    results.forEach((r, idx) => {
      const it = wave[idx];
      if (r.status === "fulfilled") {
        outcome.sent.push(it.memberId);
      } else {
        const reason = r.reason instanceof Error ? r.reason.message : "Mail request failed.";
        console.error("[mail] send failed:", it.memberId, reason);
        outcome.failed.push({ memberId: it.memberId, reason });
      }
    });
  }

  return outcome;
}
