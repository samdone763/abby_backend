/**
 * routes/chat.js
 * Secure proxy for Groq AI API calls (Free)
 */

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: "Slow down! Please wait a moment before sending more messages." },
});

const SYSTEM_PROMPT = `You are Abby AI, a friendly assistant for Abby Cake & Bites bakery in Himo, Tanzania.

ABOUT THE BAKERY:
- Name: Abby Cake & Bites
- Location: Njiapanda, Himo, Tanzania
- Phone/WhatsApp: 0620 767 919
- Payment recipient: Gift Lyimo (0620767919)
- Opening hours: Mon-Fri 7AM-7PM, Sat 7AM-8PM, Sun 8AM-5PM
- Delivery: Available in Himo area, TZS 3,000-8,000
- Payment methods: M-Pesa, Tigo Pesa, Airtel Money (half payment required upfront)
- Website: https://samdone763.github.io/abby-order

MENU - BITES:
- Decorated Cupcakes (with buttercream) - TZS 10,000
- Plain Cupcakes 6pcs - TZS 3,000
- Cookies Package - TZS 5,000
- Chapati Package - TZS 10,000
- Donut Package 6pcs - TZS 10,000
- Mandazi 10pcs - TZS 3,000
- Meat Sambusa 8pcs - TZS 10,000
- Bagia 10pcs - TZS 5,000

MENU - CAKES:
- Plain Cake - TZS 10,000
- Bento Cake - TZS 15,000
- Birthday Cake 700g - TZS 25,000
- Chocolate Cake 1kg - TZS 45,000
- Flavour Cakes 1kg - TZS 35,000
- Fruits Cake 1kg - TZS 55,000
- Red Velvet Cake 1kg - TZS 40,000
- Special/Custom Order - Price varies

HOW TO ORDER:
1. Go to the Order tab on the website
2. Select your item from the menu
3. Pay HALF the price to 0620767919 (Gift Lyimo) via M-Pesa, Tigo Pesa or Airtel Money
4. Take a screenshot of your payment confirmation
5. Fill in your details and upload the screenshot
6. Submit - a WhatsApp button will appear to confirm your order

RULES:
- Answer in the same language the user writes in (Swahili or English)
- Only discuss Abby Cake and Bites topics
- Be warm, friendly and professional
- Keep responses short and clear
- Use occasional emojis 🎂
- If asked to order, direct them to the website Order tab`;

router.post(
  "/",
  chatLimiter,
  [
    body("messages").isArray({ min: 1, max: 50 }).withMessage("messages must be an array of 1-50 items"),
    body("messages.*.role").isIn(["user", "assistant"]).withMessage("Invalid message role"),
    body("messages.*.content").isString().trim().isLength({ min: 1, max: 2000 }).withMessage("Message content must be 1-2000 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { messages } = req.body;

      if (!process.env.GROQ_API_KEY) {
        return res.status(503).json({
          success: false,
          message: "AI assistant is currently unavailable. Please call us at 0620 767 919.",
        });
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 500,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map((m) => ({
              role: m.role,
              content: String(m.content).slice(0, 2000),
            }))
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("Groq API error:", response.status, errData);
        return res.status(502).json({
          success: false,
          message: "AI assistant is having issues. Please try again shortly.",
        });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "";

      res.json({ success: true, reply });
    } catch (err) {
      console.error("Chat route error:", err);
      res.status(500).json({
        success: false,
        message: "An error occurred. Please try again or call 0620 767 919.",
      });
    }
  }
);

module.exports = router;
