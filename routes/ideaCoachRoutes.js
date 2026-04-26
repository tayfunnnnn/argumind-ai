const express = require("express");
const { aiCagir }       = require("../services/openaiService");
const { sorularPrompt, gelistirPrompt } = require("../prompts/ideaCoachPrompts");
const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/api/idea-coach", rateLimiter, async (req, res) => {
  const { mod, fikir, cevaplar } = req.body;

  if (!mod || !fikir) {
    return res.status(400).json({ hata: "mod ve fikir zorunludur." });
  }

  try {
    if (mod === "sorular") {
      const cevap = await aiCagir(sorularPrompt, `Fikir: ${fikir}`);
      const temiz = cevap.replace(/```json|```/g, "").trim();
      return res.json(JSON.parse(temiz));
    }

    if (mod === "gelistir") {
      const sorularMetni = Object.entries(cevaplar)
        .map(([soru, cevap]) => `Soru: ${soru}\nCevap: ${cevap}`)
        .join("\n\n");

      const kullaniciMesaji = `Orijinal Fikir: ${fikir}\n\n${sorularMetni}`;
      const cevap = await aiCagir(gelistirPrompt, kullaniciMesaji);
      const temiz = cevap.replace(/```json|```/g, "").trim();
      return res.json(JSON.parse(temiz));
    }

    res.status(400).json({ hata: "Geçersiz mod." });
  } catch (hata) {
    console.error("Idea Coach hatası:", hata.message);
    res.status(500).json({ hata: "İşlem başarısız: " + hata.message });
  }
});

module.exports = router;
