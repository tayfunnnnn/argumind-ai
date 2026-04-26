const express = require("express");
const bcrypt  = require("bcrypt");
const db      = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ hata: "Ad, e-posta ve şifre zorunludur." });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, hash);
    res.status(201).json({ mesaj: "Kayıt başarılı." });
  } catch (hata) {
    if (hata.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ hata: "Bu e-posta zaten kayıtlı." });
    }
    console.error("Kayıt hatası:", hata.message);
    res.status(500).json({ hata: "Kayıt sırasında bir sorun oluştu." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ hata: "E-posta ve şifre zorunludur." });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user) {
      return res.status(401).json({ hata: "E-posta veya şifre hatalı." });
    }

    const eslesti = await bcrypt.compare(password, user.password);

    if (!eslesti) {
      return res.status(401).json({ hata: "E-posta veya şifre hatalı." });
    }

    res.json({ mesaj: "Giriş başarılı.", kullanici: { id: user.id, name: user.name, email: user.email } });
  } catch (hata) {
    console.error("Giriş hatası:", hata.message);
    res.status(500).json({ hata: "Giriş sırasında bir sorun oluştu." });
  }
});

module.exports = router;
