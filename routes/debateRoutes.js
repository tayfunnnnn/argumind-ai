const express     = require("express");
const rateLimiter = require("../middleware/rateLimiter");
const { debateYap } = require("../services/debateService");

const router = express.Router();

router.post("/api/debate", rateLimiter, async (req, res) => {
  const { fikir } = req.body;

  if (!fikir || !fikir.trim()) {
    return res.status(400).json({ hata: "Fikir boş olamaz." });
  }

  try {
    const sonuc = await debateYap(fikir.trim());
    res.json(sonuc);
  } catch (hata) {
    console.error("[DEBATE] Hata:", hata.message);
    res.status(500).json({ hata: "Debate sırasında bir sorun oluştu: " + hata.message });
  }
});

module.exports = router;
