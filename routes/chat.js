/**
 * routes/chat.js
 * Secure proxy for Anthropic Claude API calls
 * Keeps API key server-side and enforces bakery-only context
 */

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

// Strict rate limit for AI chat (expensive API calls)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 20,               // 20 messages per minute per IP
  message: { success: false, message: "Slow down! Please wait a moment before sending more messages." },
});

const SYSTEM_PROMPT = `You are the friendly AI assistant for Abby Cake and Bites, a professional bakery in Njiapanda, Himo, Tanzania. Your name is "Abby".

BUSINESS INFO:
- Name: Abby Cake and Bites
- Location: Njiapanda, 25232 Njiapanda, Himo, Tanzania
- Phone/WhatsApp: 0620 767 919
- Email: lyndagift06@gmail.com
- Hours: Mon–Thu 7AM–7PM, Fri–Sat 7AM–8PM, Sunday: Closed
- Current Status: Closed — Opens Monday 7AM
- Payment: Cash on pickup or M-Pesa

MENU & PRICES:
Custom Cakes: Birthday (TZS 25,000–80,000), Wedding (TZS 80,000–300,000), Anniversary (TZS 30,000–75,000), Baby Shower (TZS 28,000–60,000)
Flavors: Vanilla, Chocolate, Red Velvet, Lemon (included), Strawberry & Caramel (+TZS 3,000)
Bites: Cupcakes 6pcs/12pcs (TZS 12,000/22,000), Cookies (TZS 8,000–15,000), Brownies (TZS 10,000–20,000), Cake Pops (TZS 12,000–22,000), Doughnuts (TZS 9,000–17,000), Muffins (TZS 8,000–15,000)

DELIVERY: Available in Himo town and nearby. Fee: TZS 3,000–8,000.
CUSTOM ORDERS: Yes. Please order at least 3 days in advance.

ORDER COLLECTION: When a customer wants to order, collect these one by one:
1. Full name
2. Phone number
3. What they want (cake type or bites)
4. Size
5. Flavor
6. Quantity
7. Pickup or delivery?
8. If delivery: address
9. Date/time needed

When ALL details are collected, respond with this EXACT format at the end:
ORDER_JSON:{"customerName":"...","customerPhone":"...","itemType":"...","size":"...","flavor":"...","quantity":"...","deliveryType":"pickup or delivery","address":"...","dateNeeded":"...","notes":"..."}

RULES:
- Only discuss Abby Cake and Bites topics
- Be warm, friendly, and professional
- If asked about unrelated topics, politely redirect to bakery services
- Keep responses concise
- Use occasional emojis 🎂`;

// ─── POST /api/chat ────────────────────────────────────────────
router.post(
  "/",
  chatLimiter,
  [
    body("messages")
      .isArray({ min: 1, max: 50 })
      .withMessage("messages must be an array of 1–50 items"),
    body("messages.*.role")
      .isIn(["user", "assistant"])
      .withMessage("Invalid message role"),
    body("messages.*.content")
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Message content must be 1–2000 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { messages } = req.body;

      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({
          success: false,
          message: "AI assistant is currently unavailable. Please call us at 0620 767 919.",
        });
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({
            role: m.role,
            content: String(m.content).slice(0, 2000), // Hard cap
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("❌ Anthropic API error:", response.status, errData);
        return res.status(502).json({
          success: false,
          message: "AI assistant is having issues. Please try again shortly.",
        });
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || "";

      res.json({ success: true, reply });

    } catch (err) {
      console.error("❌ Chat route error:", err);
      res.status(500).json({
        success: false,
        message: "An error occurred. Please try again or call 0620 767 919.",
      });
    }
  }
);

module.exports = router;
