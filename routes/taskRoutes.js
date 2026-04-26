const express = require("express");
const db      = require("../db");
const { gorevUret } = require("../services/taskAgentService");
const rateLimiter   = require("../middleware/rateLimiter");

const router = express.Router();

const GECERLI_DURUMLAR = ["YAPILACAK", "DEVAM_EDIYOR", "TAMAMLANDI"];

router.post("/api/tasks", (req, res) => {
  const { sprintId, userId, title, kategori } = req.body;

  if (!sprintId || !userId || !title) {
    return res.status(400).json({ hata: "sprintId, userId ve title zorunludur." });
  }

  const task = db.prepare(
    "INSERT INTO tasks (sprint_id, user_id, title, kategori) VALUES (?, ?, ?, ?)"
  ).run(sprintId, userId, title, kategori || null);

  res.status(201).json({ id: task.lastInsertRowid, title, kategori: kategori || null, status: "YAPILACAK" });
});

router.get("/api/tasks/:sprintId", (req, res) => {
  const sprintId = parseInt(req.params.sprintId, 10);
  if (isNaN(sprintId)) return res.status(400).json({ hata: "Geçersiz sprintId." });

  const tasks = db.prepare(
    "SELECT * FROM tasks WHERE sprint_id = ? ORDER BY created_at ASC"
  ).all(sprintId);

  res.json(tasks);
});

router.patch("/api/tasks/:id/status", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (isNaN(id)) return res.status(400).json({ hata: "Geçersiz task id." });

  if (!GECERLI_DURUMLAR.includes(status)) {
    return res.status(400).json({ hata: "Geçersiz durum. Kabul edilenler: " + GECERLI_DURUMLAR.join(", ") });
  }

  const sonuc = db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id);
  if (sonuc.changes === 0) return res.status(404).json({ hata: "Görev bulunamadı." });

  res.json({ id, status });
});

router.post("/api/task-agent", rateLimiter, async (req, res) => {
  const { fikir, boss } = req.body;

  if (!fikir || !boss) {
    return res.status(400).json({ hata: "fikir ve boss zorunludur." });
  }

  try {
    const sonuc = await gorevUret(fikir, boss);
    res.json(sonuc);
  } catch (hata) {
    console.error("Task Agent hatası:", hata.message);
    res.status(500).json({ hata: "Görev üretilemedi: " + hata.message });
  }
});

module.exports = router;
