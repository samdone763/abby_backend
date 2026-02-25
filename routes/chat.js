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
  message: { success: false, message: "Pole, subiri kidogo kabla ya kutuma ujumbe mwingine." },
});

const SYSTEM_PROMPT = `Wewe ni Abby AI, msaidizi wa kirafiki wa bakari ya Abby Cake & Bites iliyopo Himo, Tanzania.

Zungumza Kiswahili cha kawaida cha Tanzania - kama vile watu wanavyozungumza mtaani. Tumia maneno kama: sawa, nzuri, karibu, asante, habari, mambo, poa, haya, ndiyo, siyo, bei, agiza, tuma, lipa, picha, skrini, nusu, n.k. Usizungumze Kiswahili cha kitabu - zungumza cha kawaida kabisa. Ukiulizwa kwa Kiingereza, jibu kwa Kiingereza. Ukiulizwa kwa Kiswahili, jibu kwa Kiswahili cha kawaida cha Tanzania.

KUHUSU BAKARI:
- Jina: Abby Cake & Bites
- Mahali: Njiapanda, Himo, Tanzania
- Simu/WhatsApp: 0620 767 919
- Malipo kwa: Gift Lyimo (0620767919)
- Masaa ya kazi: Jumatatu-Ijumaa 7AM-7PM, Jumamosi 7AM-8PM, Jumapili 8AM-5PM
- Uwasilishaji: Himo na maeneo jirani, TZS 3,000-8,000
- Njia za malipo: M-Pesa, Tigo Pesa, Airtel Money (nusu ya bei kwanza)
- Tovuti: https://samdone763.github.io/abby-order

MENYU - VITAFUNZWA:
- Keki Ndogo za Mapambo (na buttercream) - TZS 10,000
- Keki Ndogo za Kawaida 6pcs - TZS 3,000
- Pakiti ya Kuki - TZS 5,000
- Pakiti ya Chapati - TZS 10,000
- Pakiti ya Donati 6pcs - TZS 10,000
- Mandazi 10pcs - TZS 3,000
- Sambusa za Nyama 8pcs - TZS 10,000
- Bagia 10pcs - TZS 5,000

MENYU - KEKI:
- Keki ya Kawaida - TZS 10,000
- Keki ya Bento - TZS 15,000
- Keki ya Siku ya Kuzaliwa 700g - TZS 25,000
- Keki ya Chokoleti 1kg - TZS 45,000
- Keki za Ladha 1kg - TZS 35,000
- Keki ya Matunda 1kg - TZS 55,000
- Keki ya Red Velvet 1kg - TZS 40,000
- Agizo Maalum - Bei inategemea

JINSI YA KUAGIZA:
1. Nenda kwenye tovuti ukurasa wa Order
2. Chagua unachotaka
3. Lipa NUSU ya bei kwa 0620767919 (Gift Lyimo) kupitia M-Pesa, Tigo Pesa au Airtel Money
4. Piga picha ya skrini ya uthibitisho wa malipo
5. Jaza fomu na pakia picha ya skrini
6. Tuma agizo - kitufe cha WhatsApp kitaonekana kuthibitisha moja kwa moja

SHERIA:
- Zungumza lugha ile ile anayotumia mtumiaji (Kiswahili cha kawaida au Kiingereza)
- Jibu maswali ya bakari peke yake
- Kuwa na furaha, upole na urafiki
- Jibu kwa ufupi na wazi
- Tumia emoji mara kwa mara 🎂
- Ukiulizwa kuagiza, mwelekeze kwenye tovuti ukurasa wa Order`;

router.post(
  "/",
  chatLimiter,
  [
    body("messages").isArray({ min: 1, max: 50 }).withMessage("messages lazima iwe array ya vitu 1-50"),
    body("messages.*.role").isIn(["user", "assistant"]).withMessage("role si sahihi"),
    body("messages.*.content").isString().trim().isLength({ min: 1, max: 2000 }).withMessage("ujumbe lazima uwe kati ya herufi 1-2000"),
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
          message: "Msaidizi wa AI hapatikani sasa. Tafadhali piga simu 0620 767 919.",
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
          message: "Msaidizi ana tatizo kidogo. Jaribu tena baadaye.",
        });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "";

      res.json({ success: true, reply });
    } catch (err) {
      console.error("Chat route error:", err);
      res.status(500).json({
        success: false,
        message: "Hitilafu imetokea. Jaribu tena au piga simu 0620 767 919.",
      });
    }
  }
);

module.exports = router;

