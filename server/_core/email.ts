const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = "Narcissus <onboarding@resend.dev>";

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#111111;border:1px solid #2a2a2a;border-radius:2px;">
          <tr>
            <td align="center" style="padding:48px 40px 32px;">
              <p style="margin:0;font-size:11px;letter-spacing:6px;color:#888;font-family:Arial,sans-serif;">HANDMADE WITH DEVOTION</p>
              <h1 style="margin:16px 0 0;font-size:32px;font-weight:400;letter-spacing:8px;color:#f5f0e8;">NARCISSUS</h1>
              <div style="width:40px;height:1px;background-color:#c9a96e;margin:20px auto 0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1f1f1f;">
              <p style="margin:0;font-size:11px;letter-spacing:2px;color:#444;font-family:Arial,sans-serif;text-align:center;">
                © 2025 NARCISSUS · CAIRO, EGYPT
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const button = (url: string, label: string) => `
<table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
  <tr>
    <td align="center" style="background-color:#f5f0e8;border-radius:1px;">
      <a href="${url}" style="display:inline-block;padding:16px 48px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:4px;color:#0a0a0a;text-decoration:none;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;

const p = (text: string) =>
  `<p style="font-size:15px;line-height:1.8;color:#aaa;font-family:Arial,sans-serif;margin:0 0 16px;">${text}</p>`;

const small = (text: string) =>
  `<p style="font-size:13px;line-height:1.8;color:#555;font-family:Arial,sans-serif;margin:0;">${text}</p>`;

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || "Failed to send email");
  }

  return res.json();
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = baseTemplate(`
    ${p("We received a request to reset your Narcissus password.")}
    ${p("Click the button below to choose a new password. This link expires in 1 hour.")}
    ${button(resetUrl, "RESET PASSWORD")}
    ${small("If you didn't request this, you can safely ignore this email.")}
  `);
  return sendEmail(to, "Reset your Narcissus password", html);
}

export async function sendConfirmEmail(to: string, confirmUrl: string) {
  const html = baseTemplate(`
    ${p("Welcome to Narcissus.")}
    ${p("Please confirm your email address to begin exploring our collection of handcrafted pieces.")}
    ${button(confirmUrl, "CONFIRM EMAIL")}
    ${small("If you didn't create a Narcissus account, you can safely ignore this email.")}
  `);
  return sendEmail(to, "Confirm your Narcissus account", html);
}

export async function sendPasswordChangeEmail(to: string, confirmUrl: string) {
  const html = baseTemplate(`
    ${p("You requested a password change for your Narcissus account.")}
    ${p("Click below to confirm and set your new password. This link expires in 1 hour.")}
    ${button(confirmUrl, "CONFIRM PASSWORD CHANGE")}
    ${small("If you didn't request this change, you can safely ignore this email.")}
  `);
  return sendEmail(to, "Confirm your Narcissus password change", html);
}

export async function sendOrderNotificationEmail(order: {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  totalPrice: number;
  items: { productName: string; quantity: number; price: number; customizations?: string }[];
}) {
  const itemRows = order.items.map(item => {
    const customs = (() => { try { return JSON.parse(item.customizations || "[]"); } catch { return []; } })();
    const customText = customs.length > 0
      ? `<br/><span style="font-size:11px;color:#666;">${customs.map((c: any) => `${c.title}: ${c.value}`).join(", ")}</span>`
      : "";
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #1f1f1f;color:#aaa;font-family:Arial,sans-serif;font-size:14px;">
          ${item.productName}${customText}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #1f1f1f;color:#aaa;font-family:Arial,sans-serif;font-size:14px;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #1f1f1f;color:#aaa;font-family:Arial,sans-serif;font-size:14px;text-align:right;">
          EGP ${(item.price / 100).toFixed(2)}
        </td>
      </tr>`;
  }).join("");

  const content = `
    ${p(`New order <strong style="color:#f5f0e8;">#${order.id}</strong> has been placed.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="color:#666;font-family:Arial,sans-serif;font-size:12px;padding:4px 0;">NAME</td>
        <td style="color:#aaa;font-family:Arial,sans-serif;font-size:14px;padding:4px 0;">${order.customerName}</td>
      </tr>
      <tr>
        <td style="color:#666;font-family:Arial,sans-serif;font-size:12px;padding:4px 0;">EMAIL</td>
        <td style="color:#aaa;font-family:Arial,sans-serif;font-size:14px;padding:4px 0;">${order.customerEmail}</td>
      </tr>
      <tr>
        <td style="color:#666;font-family:Arial,sans-serif;font-size:12px;padding:4px 0;">PHONE</td>
        <td style="color:#aaa;font-family:Arial,sans-serif;font-size:14px;padding:4px 0;">${order.customerPhone}</td>
      </tr>
      <tr>
        <td style="color:#666;font-family:Arial,sans-serif;font-size:12px;padding:4px 0;">ADDRESS</td>
        <td style="color:#aaa;font-family:Arial,sans-serif;font-size:14px;padding:4px 0;">${order.customerAddress}</td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <th style="text-align:left;color:#666;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;padding-bottom:8px;border-bottom:1px solid #2a2a2a;">PRODUCT</th>
        <th style="text-align:center;color:#666;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;padding-bottom:8px;border-bottom:1px solid #2a2a2a;">QTY</th>
        <th style="text-align:right;color:#666;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;padding-bottom:8px;border-bottom:1px solid #2a2a2a;">PRICE</th>
      </tr>
      ${itemRows}
    </table>
    <p style="font-size:18px;font-weight:400;color:#f5f0e8;font-family:Arial,sans-serif;text-align:right;margin:0;">
      Total: EGP ${(order.totalPrice / 100).toFixed(2)}
    </p>`;

  const html = baseTemplate(content);
  return sendEmail("yossef2989@gmail.com", `New Order #${order.id} — Narcissus`, html);
}

export async function sendOrderNotification(order: {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  totalPrice: number;
  items: { productName: string; quantity: number; price: number; customizations?: string }[];
}) {
  const itemsHtml = order.items.map(item => {
    const customs = item.customizations ? (() => { try { return JSON.parse(item.customizations!); } catch { return []; } })() : [];
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#aaa;font-family:Arial,sans-serif;font-size:14px;">${item.productName}${customs.length ? `<br><span style="font-size:11px;color:#666;">${customs.map((c: any) => `${c.title}: ${c.value}`).join(", ")}</span>` : ""}</td>
        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#aaa;font-family:Arial,sans-serif;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#aaa;font-family:Arial,sans-serif;font-size:14px;text-align:right;">EGP ${(item.price / 100).toFixed(2)}</td>
      </tr>`;
  }).join("");

  const html = baseTemplate(`
    ${p("A new order has been placed on Narcissus.")}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;color:#888;font-family:Arial,sans-serif;font-size:13px;">Order #${order.id}</td>
      </tr>
      <tr><td style="padding:4px 0;color:#aaa;font-family:Arial,sans-serif;font-size:14px;"><strong style="color:#f5f0e8;">Customer:</strong> ${order.customerName}</td></tr>
      <tr><td style="padding:4px 0;color:#aaa;font-family:Arial,sans-serif;font-size:14px;"><strong style="color:#f5f0e8;">Email:</strong> ${order.customerEmail}</td></tr>
      <tr><td style="padding:4px 0;color:#aaa;font-family:Arial,sans-serif;font-size:14px;"><strong style="color:#f5f0e8;">Phone:</strong> ${order.customerPhone}</td></tr>
      <tr><td style="padding:4px 0;color:#aaa;font-family:Arial,sans-serif;font-size:14px;"><strong style="color:#f5f0e8;">Address:</strong> ${order.customerAddress}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <th style="text-align:left;padding:8px 0;border-bottom:1px solid #333;color:#666;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;">ITEM</th>
        <th style="text-align:center;padding:8px 0;border-bottom:1px solid #333;color:#666;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;">QTY</th>
        <th style="text-align:right;padding:8px 0;border-bottom:1px solid #333;color:#666;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;">PRICE</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding:12px 0 0;color:#f5f0e8;font-family:Arial,sans-serif;font-size:15px;"><strong>Total</strong></td>
        <td style="padding:12px 0 0;color:#c9a96e;font-family:Arial,sans-serif;font-size:15px;text-align:right;"><strong>EGP ${(order.totalPrice / 100).toFixed(2)}</strong></td>
      </tr>
    </table>
    ${small("Log in to the admin panel to update the order status.")}
  `);

  return sendEmail("yossef2989@gmail.com", `New Order #${order.id} — Narcissus`, html);
}