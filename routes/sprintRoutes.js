const express = require("express");
const db      = require("../db");

const router = express.Router();

router.post("/api/sprints", (req, res) => {
  const { name, userId } = req.body;

  if (!name || !userId) {
    return res.status(400).json({ hata: "Sprint adı ve userId zorunludur." });
  }

  const sprint = db.prepare("INSERT INTO sprints (user_id, name) VALUES (?, ?)").run(userId, name);
  res.status(201).json({ id: sprint.lastInsertRowid, name });
});

router.get("/api/sprints/:userId", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ hata: "Geçersiz userId." });

  const sprints = db.prepare(
    "SELECT * FROM sprints WHERE user_id = ? ORDER BY created_at DESC"
  ).all(userId);

  res.json(sprints);
});

router.delete("/api/sprints/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ hata: "Geçersiz sprint id." });

  db.prepare("DELETE FROM tasks WHERE sprint_id = ?").run(id);
  const sonuc = db.prepare("DELETE FROM sprints WHERE id = ?").run(id);

  if (sonuc.changes === 0) return res.status(404).json({ hata: "Sprint bulunamadı." });

  res.json({ mesaj: "Sprint silindi." });
});

module.exports = router;
