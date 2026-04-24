// ===========================
// SERVER.JS — Boss AI geliştirilmiş versiyon
// Boss AI artık JSON formatında yapılandırılmış cevap döner
// ===========================

const express = require("express");
const Database = require("better-sqlite3");
const bcrypt   = require("bcrypt");
require("dotenv").config();

const app  = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));


// ===========================
// VERİTABANI KURULUMU
// ===========================

const db = new Database("users.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    email    TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sprints (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sprint_id  INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    title      TEXT    NOT NULL,
    kategori   TEXT,
    status     TEXT    NOT NULL DEFAULT 'YAPILACAK',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

try { db.exec(`ALTER TABLE tasks ADD COLUMN kategori TEXT`); } catch (_) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS evaluations (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id              INTEGER,
    fikir                TEXT,
    userValue            TEXT,
    businessStrategy     TEXT,
    technicalFeasibility TEXT,
    boss_karar           TEXT,
    boss_skor            REAL,
    boss_aciklama        TEXT,
    boss_gucluYonler     TEXT,
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);


// ===========================
// ENDPOINT: /register
// ===========================

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ hata: "Ad, e-posta ve şifre zorunludur." });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    stmt.run(name, email, hash);
    res.status(201).json({ mesaj: "Kayıt başarılı." });
  } catch (hata) {
    if (hata.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ hata: "Bu e-posta zaten kayıtlı." });
    }
    console.error("Kayıt hatası:", hata.message);
    res.status(500).json({ hata: "Kayıt sırasında bir sorun oluştu." });
  }
});


// ===========================
// ENDPOINT: /login
// ===========================

app.post("/login", async (req, res) => {
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


// ===========================
// ENDPOINT: POST /api/sprints — Sprint oluştur
// ===========================

app.post("/api/sprints", (req, res) => {
  const { name, userId } = req.body;

  if (!name || !userId) {
    return res.status(400).json({ hata: "Sprint adı ve userId zorunludur." });
  }

  const sprint = db.prepare(
    "INSERT INTO sprints (user_id, name) VALUES (?, ?)"
  ).run(userId, name);

  res.status(201).json({ id: sprint.lastInsertRowid, name });
});


// ===========================
// ENDPOINT: GET /api/sprints/:userId — Sprintleri listele
// ===========================

app.get("/api/sprints/:userId", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ hata: "Geçersiz userId." });

  const sprints = db.prepare(
    "SELECT * FROM sprints WHERE user_id = ? ORDER BY created_at DESC"
  ).all(userId);

  res.json(sprints);
});


// ===========================
// ENDPOINT: DELETE /api/sprints/:id — Sprint ve görevlerini sil
// ===========================

app.delete("/api/sprints/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ hata: "Geçersiz sprint id." });

  db.prepare("DELETE FROM tasks WHERE sprint_id = ?").run(id);
  const sonuc = db.prepare("DELETE FROM sprints WHERE id = ?").run(id);

  if (sonuc.changes === 0) return res.status(404).json({ hata: "Sprint bulunamadı." });

  res.json({ mesaj: "Sprint silindi." });
});


// ===========================
// ENDPOINT: POST /api/tasks — Görev ekle
// ===========================

app.post("/api/tasks", (req, res) => {
  const { sprintId, userId, title, kategori } = req.body;

  if (!sprintId || !userId || !title) {
    return res.status(400).json({ hata: "sprintId, userId ve title zorunludur." });
  }

  const task = db.prepare(
    "INSERT INTO tasks (sprint_id, user_id, title, kategori) VALUES (?, ?, ?, ?)"
  ).run(sprintId, userId, title, kategori || null);

  res.status(201).json({ id: task.lastInsertRowid, title, kategori: kategori || null, status: "YAPILACAK" });
});


// ===========================
// ENDPOINT: GET /api/tasks/:sprintId — Sprint'in görevleri
// ===========================

app.get("/api/tasks/:sprintId", (req, res) => {
  const sprintId = parseInt(req.params.sprintId, 10);
  if (isNaN(sprintId)) return res.status(400).json({ hata: "Geçersiz sprintId." });

  const tasks = db.prepare(
    "SELECT * FROM tasks WHERE sprint_id = ? ORDER BY created_at ASC"
  ).all(sprintId);

  res.json(tasks);
});


// ===========================
// ENDPOINT: PATCH /api/tasks/:id/status — Durum güncelle
// ===========================

const GECERLI_DURUMLAR = ["YAPILACAK", "DEVAM_EDIYOR", "TAMAMLANDI"];

app.patch("/api/tasks/:id/status", (req, res) => {
  const id     = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (isNaN(id)) return res.status(400).json({ hata: "Geçersiz task id." });

  if (!GECERLI_DURUMLAR.includes(status)) {
    return res.status(400).json({ hata: "Geçersiz durum. Kabul edilenler: " + GECERLI_DURUMLAR.join(", ") });
  }

  const sonuc = db.prepare(
    "UPDATE tasks SET status = ? WHERE id = ?"
  ).run(status, id);

  if (sonuc.changes === 0) return res.status(404).json({ hata: "Görev bulunamadı." });

  res.json({ id, status });
});


// ===========================
// ENDPOINT: POST /api/task-agent
// ===========================

app.post("/api/task-agent", async (req, res) => {
  const { fikir, boss } = req.body;

  if (!fikir || !boss) {
    return res.status(400).json({ hata: "fikir ve boss zorunludur." });
  }

  const sistem = `Sen deneyimli bir proje müdürüsün.
Sana bir girişim fikri ve AI değerlendirmesi verilecek.
Bu fikri hayata geçirmek için ilk sprint'te yapılacak görevleri üret.

SADECE aşağıdaki JSON formatında cevap ver, başka hiçbir şey yazma:

{
  "sprintAdi": "Sprint adı buraya",
  "gorevler": [
    { "baslik": "Görev 1", "kategori": "Araştırma" },
    { "baslik": "Görev 2", "kategori": "Tasarım" },
    { "baslik": "Görev 3", "kategori": "Teknik" }
  ]
}

Kategoriler: Araştırma / Tasarım / Teknik / Büyüme
Görev sayısı: 5 ile 7 arasında olsun.
Görevler somut ve yapılabilir olsun. Türkçe yaz.`;

  const kullaniciMesaji = `
Fikir: ${fikir}
Boss AI Kararı: ${boss.karar}
Boss AI Skoru: ${boss.skor}/10
Boss AI Açıklaması: ${boss.aciklama}`;

  try {
    const cevap = await aiCagir(sistem, kullaniciMesaji);
    const temiz = cevap.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(temiz));
  } catch (hata) {
    console.error("Task Agent hatası:", hata.message);
    res.status(500).json({ hata: "Görev üretilemedi: " + hata.message });
  }
});


// ===========================
// YARDIMCI: Tek AI çağrısı
// ===========================

async function aiCagir(sistemMesaji, kullaniciMesaji) {
  const yanit = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.OPENAI_API_KEY
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 400,
      messages: [
        { role: "system", content: sistemMesaji },
        { role: "user",   content: kullaniciMesaji }
      ]
    })
  });

  const veri = await yanit.json();
  if (veri.error) throw new Error(veri.error.message);
  return veri.choices[0].message.content.trim();
}


// ===========================
// AJAN 1: Kullanıcı Değeri
// ===========================

async function kullaniciDegeriAjani(fikir) {
  const sistem = `Sen bir kullanıcı deneyimi uzmanısın.
Fikri şu açılardan değerlendir:
- İnsanlar bunu neden kullanır veya kullanmaz?
- Gerçek bir problemi çözüyor mu?
- Hedef kitle kim?
2-3 cümle yaz. Türkçe. Net ve dürüst ol. Gereksiz övgü yapma.`;
  return await aiCagir(sistem, fikir);
}


// ===========================
// AJAN 2: İş / Strateji
// ===========================

async function isStratejisiAjani(fikir) {
  const sistem = `Sen bir iş stratejisti ve girişim danışmanısın.
Fikri şu açılardan değerlendir:
- İş mantığı var mı?
- Rakiplerden nasıl ayrışabilir?
- Büyüme potansiyeli nasıl?
2-3 cümle yaz. Türkçe. Net ve dürüst ol. Gereksiz övgü yapma.`;
  return await aiCagir(sistem, fikir);
}


// ===========================
// AJAN 3: Teknik
// ===========================

async function teknikAjani(fikir) {
  const sistem = `Sen deneyimli bir yazılım mimarısısın.
Fikri şu açılardan değerlendir:
- Teknik olarak yapılabilir mi?
- İlk versiyon çıkarmak kolay mı, zor mu?
- Gereksiz karmaşıklık var mı?
2-3 cümle yaz. Türkçe. Net ve dürüst ol. Gereksiz övgü yapma.`;
  return await aiCagir(sistem, fikir);
}


// ===========================
// AJAN 4: Boss AI
// Yapılandırılmış JSON döner
// ===========================

async function bossAjani(fikir, kullanici, isStrateji, teknik) {
  const sistem = `Sen bir yatırımcı ve karar verici uzmansın.
Sana bir fikir ve 3 uzmanın analizi verilecek.

SADECE aşağıdaki JSON formatında cevap ver, başka hiçbir şey yazma:

{
  "karar": "DEVAM ET",
  "skor": 7.5,
  "aciklama": "2 cümle genel özet buraya",
  "gucluYonler": ["Madde 1", "Madde 2", "Madde 3"]
}

Karar alanı için sadece şu 4 seçenekten birini kullan:
DEVAM ET / GELİŞTİREREK DEVAM ET / PİVOT ET / VAZGEÇ

Skor 1-10 arasında olsun (ondalıklı olabilir).
gucluYonler tam olarak 3 madde olsun.
Türkçe yaz. Tok sözlü ol.`;

  const kullaniciMesaji = `
Fikir: ${fikir}
Kullanıcı Değeri Analizi: ${kullanici}
İş/Strateji Analizi: ${isStrateji}
Teknik Analiz: ${teknik}`;

  const cevap = await aiCagir(sistem, kullaniciMesaji);

  // JSON'ı temizle ve parse et
  const temiz = cevap.replace(/```json|```/g, "").trim();
  return JSON.parse(temiz);
}


// ===========================
// ANA ENDPOINT
// ===========================

app.post("/api/degerlendir", async (req, res) => {
  const { fikir, userId } = req.body;

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
      db.prepare(`
        INSERT INTO evaluations
          (user_id, fikir, userValue, businessStrategy, technicalFeasibility,
           boss_karar, boss_skor, boss_aciklama, boss_gucluYonler)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, fikir, kullanici, isStrateji, teknik,
        boss.karar, boss.skor, boss.aciklama, JSON.stringify(boss.gucluYonler)
      );
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


// ===========================
// ENDPOINT: GET /api/gecmis/:userId
// ===========================

app.get("/api/gecmis/:userId", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ hata: "Geçersiz userId." });

  const rows = db.prepare(`
    SELECT * FROM evaluations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(userId);

  res.json(rows);
});


// ===========================
// ENDPOINT: POST /api/idea-coach
// mod: "sorular" → 3-5 soru döner
// mod: "gelistir" → geliştirilmiş fikir döner
// ===========================

app.post("/api/idea-coach", async (req, res) => {
  const { mod, fikir, cevaplar } = req.body;

  if (!mod || !fikir) {
    return res.status(400).json({ hata: "mod ve fikir zorunludur." });
  }

  try {
    if (mod === "sorular") {
      const sistem = `Sen bir girişim koçusun. Kullanıcının fikrini daha iyi anlamak ve geliştirmesine yardımcı olmak için 3-5 net soru sor.

SADECE aşağıdaki JSON formatında cevap ver:
{
  "sorular": ["Soru 1?", "Soru 2?", "Soru 3?"]
}

Sorular kısa, net ve düşündürücü olsun. Türkçe yaz.`;

      const cevap = await aiCagir(sistem, `Fikir: ${fikir}`);
      const temiz = cevap.replace(/\`\`\`json|\`\`\`/g, "").trim();
      return res.json(JSON.parse(temiz));
    }

    if (mod === "gelistir") {
      const sistem = `Sen bir girişim koçusun. Kullanıcının fikrini ve sorulara verdiği cevapları kullanarak geliştirilmiş, net bir fikir özeti oluştur.

SADECE aşağıdaki JSON formatında cevap ver:
{
  "baslik": "Kısa ve çarpıcı fikir adı",
  "hedefKitle": "Kimler kullanacak?",
  "problem": "Hangi problemi çözüyor?",
  "cozum": "Çözüm nasıl çalışıyor?",
  "temelOzellikler": ["Özellik 1", "Özellik 2", "Özellik 3"],
  "nedenDegerli": "Bu fikri özel kılan nedir?"
}

Türkçe yaz. Somut ve özlü ol.`;

      const sorularMetni = Object.entries(cevaplar)
        .map(([soru, cevap]) => `Soru: ${soru}\nCevap: ${cevap}`)
        .join("\n\n");

      const kullaniciMesaji = `Orijinal Fikir: ${fikir}\n\n${sorularMetni}`;
      const cevap = await aiCagir(sistem, kullaniciMesaji);
      const temiz = cevap.replace(/\`\`\`json|\`\`\`/g, "").trim();
      return res.json(JSON.parse(temiz));
    }

    res.status(400).json({ hata: "Geçersiz mod." });
  } catch (hata) {
    console.error("Idea Coach hatası:", hata.message);
    res.status(500).json({ hata: "İşlem başarısız: " + hata.message });
  }
});


// ===========================
// ENDPOINT: DELETE /api/gecmis/:id — Değerlendirme sil
// ===========================

app.delete("/api/gecmis/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ hata: "Geçersiz id." });

  const sonuc = db.prepare("DELETE FROM evaluations WHERE id = ?").run(id);
  if (sonuc.changes === 0) return res.status(404).json({ hata: "Kayıt bulunamadı." });

  res.json({ mesaj: "Silindi." });
});


app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
