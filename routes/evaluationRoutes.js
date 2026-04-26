const express = require("express");
const db          = require("../db");
const rateLimiter = require("../middleware/rateLimiter");
const { kullaniciDegeriAjani, isStratejisiAjani, teknikAjani, bossAjani } = require("../services/agentService");

const router = express.Router();

router.post("/api/degerlendir", rateLimiter, async (req, res) => {
  const { fikir, userId } = req.body;

  console.log("[DEGERLENDIR] userId alındı:", userId, "| type:", typeof userId);

  if (!fikir) {
    return res.status(400).json({ hata: "Fikir boş olamaz." });
  }

  console.log("Değerlendirilen fikir:", fikir);

  try {
    console.log("Ajanlar çalışıyor...");
    const [kullanici, isStrateji, teknik] = await Promise.all([
      kullaniciDegeriAjani(fikir),
      isStratejisiAjani(fikir),
      teknikAjani(fikir)
    ]);

    console.log("Boss AI karar veriyor...");
    const boss = await bossAjani(fikir, kullanici, isStrateji, teknik);

    console.log("Boss Kararı:", boss);

    if (userId) {
      // Yeni değerlendirmeyi kaydet
      const insertResult = db.prepare(`
        INSERT INTO evaluations
          (user_id, fikir, userValue, businessStrategy, technicalFeasibility,
           boss_karar, boss_skor, boss_aciklama, boss_gucluYonler)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, fikir, kullanici, isStrateji, teknik,
             boss.karar, boss.skor, boss.aciklama, JSON.stringify(boss.gucluYonler));

      console.log("[DB] Evaluation saved — lastInsertRowid:", insertResult.lastInsertRowid, "| userId:", userId);

      // Son 10 kaydı tut, eski kayıtları sil
      db.prepare(`
        DELETE FROM evaluations
        WHERE user_id = ? AND id NOT IN (
          SELECT id FROM evaluations
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 10
        )
      `).run(userId, userId);
    } else {
      console.log("[DB] INSERT atlandı — userId yok veya falsy:", userId);
    }

    res.json({
      userValue:            kullanici,
      businessStrategy:     isStrateji,
      technicalFeasibility: teknik,
      boss:                 boss
    });

  } catch (hata) {
    console.error("Hata:", hata.message);
    res.status(500).json({ hata: "Bir sorun oluştu: " + hata.message });
  }
});

router.get("/api/gecmis/:userId", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  console.log("[GECMİS] History requested for user:", req.params.userId, "| parsed:", userId);

  if (isNaN(userId)) return res.status(400).json({ hata: "Geçersiz userId." });

  const rows = db.prepare(`
    SELECT * FROM evaluations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(userId);

  console.log("[GECMİS] History rows:", rows.length);
  res.json(rows);
});

router.delete("/api/gecmis/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ hata: "Geçersiz id." });

  const sonuc = db.prepare("DELETE FROM evaluations WHERE id = ?").run(id);
  if (sonuc.changes === 0) return res.status(404).json({ hata: "Kayıt bulunamadı." });

  res.json({ mesaj: "Silindi." });
});

module.exports = router;
