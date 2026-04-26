const db = require("../db");

const GUNLUK_LIMIT    = 5;
const AYRICALI_EMAIL  = "karabulutayfun@gmail.com";
const AYRICALI_ISIM   = "tayfun";

function rateLimiter(req, res, next) {
  // Ayrıcalıklı kullanıcı kontrolü — limitten muaf
  if (req.body && req.body.userId) {
    const kullanici = db.prepare("SELECT email, name FROM users WHERE id = ?").get(req.body.userId);
    if (kullanici) {
      const isPrivileged =
        kullanici.email.toLowerCase() === AYRICALI_EMAIL ||
        kullanici.name.toLowerCase()  === AYRICALI_ISIM;
      if (isPrivileged) {
        console.log(`[RATE LIMIT] Ayrıcalıklı kullanıcı (${kullanici.email}) → limit yok`);
        return next();
      }
    }
  }

  const ip    = (req.ip || req.connection.remoteAddress).replace("::ffff:", "");
  const simdi = Date.now();

  const kayit = db.prepare("SELECT * FROM rate_limit WHERE ip = ?").get(ip);

  if (!kayit || simdi > kayit.sifirlanacak) {
    db.prepare("INSERT OR REPLACE INTO rate_limit (ip, sayi, sifirlanacak) VALUES (?, 1, ?)")
      .run(ip, simdi + 24 * 60 * 60 * 1000);
    console.log(`[RATE LIMIT] ${ip} → 1/${GUNLUK_LIMIT}`);
    return next();
  }

  if (kayit.sayi >= GUNLUK_LIMIT) {
    console.log(`[RATE LIMIT] ${ip} limiti aştı (${kayit.sayi}/${GUNLUK_LIMIT})`);
    return res.status(429).json({
      hata: `Günlük ${GUNLUK_LIMIT} istek limitine ulaştınız. 24 saat sonra tekrar deneyin.`
    });
  }

  db.prepare("UPDATE rate_limit SET sayi = sayi + 1 WHERE ip = ?").run(ip);
  console.log(`[RATE LIMIT] ${ip} → ${kayit.sayi + 1}/${GUNLUK_LIMIT}`);
  next();
}

module.exports = rateLimiter;
