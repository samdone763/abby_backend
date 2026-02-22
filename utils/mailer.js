/**
 * utils/mailer.js
 * Nodemailer setup with beautiful HTML email templates
 * Sends order notifications to bakery owner at lyndagift06@gmail.com
 */

const nodemailer = require("nodemailer");

// ─── Create Transporter ───────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,     // Your Gmail address
      pass: process.env.EMAIL_PASS,     // Gmail App Password (not regular password)
    },
    // Optional: Use SMTP directly instead of Gmail service
    // host: process.env.SMTP_HOST,
    // port: parseInt(process.env.SMTP_PORT) || 587,
    // secure: false,
    // auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
};

// ─── HTML Email Template: New Order ──────────────────────────
const buildOrderEmailHTML = (order) => {
  const statusColor = "#c97d6e";
  const isDelivery = order.delivery?.type === "delivery";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Order – Abby Cake and Bites</title>
</head>
<body style="margin:0;padding:0;background:#fdf6ee;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ee;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(107,63,42,0.10);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#c97d6e,#b56e60);padding:36px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:36px;">🎂</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">New Order Received!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Abby Cake and Bites · Njiapanda, Himo</p>
            </td>
          </tr>

          <!-- ORDER ID BADGE -->
          <tr>
            <td style="padding:24px 32px 0;text-align:center;">
              <span style="display:inline-block;background:#fdf0e6;color:#c97d6e;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:700;border:1.5px solid #f5d6c8;letter-spacing:0.05em;">
                ORDER #${order.orderId}
              </span>
              <p style="color:#9a7060;font-size:12px;margin:8px 0 0;">${new Date().toLocaleString("en-TZ", { timeZone: "Africa/Dar_es_Salaam", dateStyle: "full", timeStyle: "short" })}</p>
            </td>
          </tr>

          <!-- CUSTOMER INFO -->
          <tr>
            <td style="padding:24px 32px 0;">
              <h2 style="margin:0 0 14px;color:#6b3f2a;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #f5d6c8;padding-bottom:8px;">👤 Customer Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#6b3f2a;font-weight:600;width:140px;font-size:14px;">Name</td>
                  <td style="padding:6px 0;color:#2c1810;font-size:14px;">${order.customer?.name || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b3f2a;font-weight:600;font-size:14px;">Phone / WhatsApp</td>
                  <td style="padding:6px 0;color:#2c1810;font-size:14px;">${order.customer?.phone || "N/A"}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ORDER DETAILS -->
          <tr>
            <td style="padding:20px 32px 0;">
              <h2 style="margin:0 0 14px;color:#6b3f2a;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #f5d6c8;padding-bottom:8px;">🎂 Order Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#6b3f2a;font-weight:600;width:140px;font-size:14px;">Item</td><td style="padding:6px 0;color:#2c1810;font-size:14px;">${order.item?.type || "N/A"}</td></tr>
                <tr><td style="padding:6px 0;color:#6b3f2a;font-weight:600;font-size:14px;">Flavor</td><td style="padding:6px 0;color:#2c1810;font-size:14px;">${order.item?.flavor || "N/A"}</td></tr>
                <tr><td style="padding:6px 0;color:#6b3f2a;font-weight:600;font-size:14px;">Size</td><td style="padding:6px 0;color:#2c1810;font-size:14px;">${order.item?.size || "N/A"}</td></tr>
                <tr><td style="padding:6px 0;color:#6b3f2a;font-weight:600;font-size:14px;">Quantity</td><td style="padding:6px 0;color:#2c1810;font-size:14px;">${order.item?.quantity || "N/A"}</td></tr>
              </table>
            </td>
          </tr>

          <!-- DELIVERY INFO -->
          <tr>
            <td style="padding:20px 32px 0;">
              <h2 style="margin:0 0 14px;color:#6b3f2a;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #f5d6c8;padding-bottom:8px;">${isDelivery ? "🚗 Delivery Info" : "🏪 Pickup Info"}</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#6b3f2a;font-weight:600;width:140px;font-size:14px;">Type</td><td style="padding:6px 0;font-size:14px;"><span style="background:${isDelivery ? "#fef3cd" : "#d4edda"};color:${isDelivery ? "#856404" : "#155724"};padding:3px 10px;border-radius:10px;font-weight:600;font-size:12px;">${isDelivery ? "Delivery" : "Pickup"}</span></td></tr>
                ${isDelivery ? `<tr><td style="padding:6px 0;color:#6b3f2a;font-weight:600;font-size:14px;">Address</td><td style="padding:6px 0;color:#2c1810;font-size:14px;">${order.delivery?.address || "N/A"}</td></tr>` : ""}
                <tr><td style="padding:6px 0;color:#6b3f2a;font-weight:600;font-size:14px;">Date Needed</td><td style="padding:6px 0;color:#c97d6e;font-weight:700;font-size:14px;">${order.dateNeeded || "N/A"}</td></tr>
              </table>
            </td>
          </tr>

          ${order.notes ? `
          <!-- NOTES -->
          <tr>
            <td style="padding:20px 32px 0;">
              <h2 style="margin:0 0 10px;color:#6b3f2a;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #f5d6c8;padding-bottom:8px;">📝 Customer Notes</h2>
              <p style="margin:0;color:#6b5050;font-size:14px;line-height:1.6;background:#fdf9f7;padding:12px 16px;border-radius:10px;border-left:3px solid #c97d6e;">${order.notes}</p>
            </td>
          </tr>` : ""}

          <!-- ACTION BUTTON -->
          <tr>
            <td style="padding:28px 32px;text-align:center;">
              <a href="https://wa.me/255${(order.customer?.phone || "").replace(/^0/, "")}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:25px;font-weight:700;font-size:15px;">
                💬 Reply on WhatsApp
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#fdf0e6;padding:20px 32px;text-align:center;border-top:1px solid #f5d6c8;">
              <p style="margin:0;color:#9a7060;font-size:13px;line-height:1.6;">
                <strong style="color:#6b3f2a;">Abby Cake and Bites</strong><br/>
                Njiapanda, 25232 Njiapanda, Himo · 📞 0620 767 919<br/>
                <span style="color:#c4a090;">This notification was sent automatically from your AI order system.</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ─── Customer Confirmation Email ──────────────────────────────
const buildConfirmationEmailHTML = (order) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#fdf6ee;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ee;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(107,63,42,0.10);">
        <tr><td style="background:linear-gradient(135deg,#c97d6e,#b56e60);padding:36px 32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:40px;">🎉</p>
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Order Confirmed!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Thank you for choosing Abby Cake and Bites</p>
        </td></tr>
        <tr><td style="padding:32px;text-align:center;">
          <p style="color:#6b3f2a;font-size:16px;line-height:1.6;">Hi <strong>${order.customer?.name}</strong>,</p>
          <p style="color:#8a6050;font-size:15px;line-height:1.6;">We've received your order and will contact you at <strong>${order.customer?.phone}</strong> to confirm. 🎂</p>
          <div style="background:#fdf9f7;border-radius:14px;padding:20px;margin:20px 0;text-align:left;">
            <p style="margin:0 0 8px;font-weight:700;color:#6b3f2a;">Order #${order.orderId}</p>
            <p style="margin:4px 0;color:#8a6050;font-size:14px;">📦 ${order.item?.type} · ${order.item?.flavor} · ${order.item?.size}</p>
            <p style="margin:4px 0;color:#8a6050;font-size:14px;">🗓️ Needed: ${order.dateNeeded}</p>
            <p style="margin:4px 0;color:#8a6050;font-size:14px;">${order.delivery?.type === "delivery" ? "🚗 Delivery" : "🏪 Pickup"}</p>
          </div>
          <p style="color:#9a7060;font-size:14px;">Questions? Call or WhatsApp us at <strong style="color:#c97d6e;">0620 767 919</strong></p>
        </td></tr>
        <tr><td style="background:#fdf0e6;padding:16px 32px;text-align:center;border-top:1px solid #f5d6c8;">
          <p style="margin:0;color:#9a7060;font-size:12px;">Abby Cake and Bites · Njiapanda, Himo</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Send Functions ────────────────────────────────────────────

/**
 * Send order notification to bakery owner
 */
const sendOrderNotification = async (order) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Abby Cake & Bites Orders" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL || "lyndagift06@gmail.com",
    subject: `🎂 New Order #${order.orderId} — ${order.customer?.name}`,
    html: buildOrderEmailHTML(order),
    // Plain text fallback
    text: `New Order Received!\n\nOrder ID: ${order.orderId}\nCustomer: ${order.customer?.name}\nPhone: ${order.customer?.phone}\nItem: ${order.item?.type} (${order.item?.flavor}, ${order.item?.size})\nQuantity: ${order.item?.quantity}\nDelivery: ${order.delivery?.type}\nDate Needed: ${order.dateNeeded}\nNotes: ${order.notes || "None"}`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Owner notification sent: ${info.messageId}`);
  return info;
};

/**
 * Verify email configuration is working
 */
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email transporter verified successfully");
    return true;
  } catch (err) {
    console.warn("⚠️  Email transporter verification failed:", err.message);
    console.warn("   Orders will still be saved, but email notifications may not work.");
    return false;
  }
};

module.exports = {
  sendOrderNotification,
  verifyEmailConfig,
};
