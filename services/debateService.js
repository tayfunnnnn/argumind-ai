const { aiCagir } = require("./openaiService");
const { tur1, tur2, tur3, bossDebate } = require("../prompts/debatePrompts");

// TUR 1: 3 agent bağımsız analiz yapar (paralel)
async function tur1Analiz(fikir) {
  const [kullanici, isStrateji, teknik] = await Promise.all([
    aiCagir(tur1.kullanici,  fikir),
    aiCagir(tur1.isStrateji, fikir),
    aiCagir(tur1.teknik,     fikir),
  ]);
  return { kullanici, isStrateji, teknik };
}

// TUR 2: Her agent diğer ikisini okuyup doğrudan itiraz eder (paralel)
async function tur2Debate(fikir, t1) {
  const digerler = (kendisi) => {
    const hepsi = {
      "Kullanıcı Değeri": t1.kullanici,
      "İş Stratejisi":    t1.isStrateji,
      "Teknik":           t1.teknik,
    };
    return Object.entries(hepsi)
      .filter(([ad]) => ad !== kendisi)
      .map(([ad, mesaj]) => `${ad}: ${mesaj}`)
      .join("\n\n");
  };

  const [kullanici2, isStrateji2, teknik2] = await Promise.all([
    aiCagir(tur2.kullanici,  `Fikir: ${fikir}\n\nDiğer uzmanların görüşleri:\n${digerler("Kullanıcı Değeri")}`),
    aiCagir(tur2.isStrateji, `Fikir: ${fikir}\n\nDiğer uzmanların görüşleri:\n${digerler("İş Stratejisi")}`),
    aiCagir(tur2.teknik,     `Fikir: ${fikir}\n\nDiğer uzmanların görüşleri:\n${digerler("Teknik")}`),
  ]);

  return { kullanici: kullanici2, isStrateji: isStrateji2, teknik: teknik2 };
}

// Tur 2 sonrası çatışma kalitesini ölç (yetersizse Tur 3 tetiklenir)
function yeterliCatismaVarMi(t2) {
  const k  = t2.kullanici.toLowerCase();
  const is = t2.isStrateji.toLowerCase();
  const te = t2.teknik.toLowerCase();
  const tumMetin = [k, is, te].join(" ");

  // Çatışma sinyal sayısı
  const sinyaller = ["yanılıyor", "yanlış", "hatalı", "katılmıyorum", "aksine",
                     "tamamen yanlış", "çalışmaz", "imkansız", "hata"];
  const catismaSayisi = sinyaller.filter(w => tumMetin.includes(w)).length;

  // Konu çeşitliliği: her domain'den en az 1 kelime var mı?
  const kullaniciDomain = ["adoption", "güven", "trust", "switching", "kullanıcı davranışı"];
  const isDomain        = ["gelir", "pazar", "rekabet", "unit economics", "churn", "cac"];
  const teknikDomain    = ["maliyet", "sistem", "vendor", "drift", "ölçek", "teknik debt", "veri"];

  const domainKapsama = [
    kullaniciDomain.some(w => tumMetin.includes(w)),
    isDomain.some(w => tumMetin.includes(w)),
    teknikDomain.some(w => tumMetin.includes(w)),
  ].filter(Boolean).length;

  // Sadece 1 ana konu etrafında dönüyorsa → düşük kalite → Tur 3
  if (domainKapsama <= 1) {
    console.log(`[DEBATE] Konu çeşitliliği düşük (${domainKapsama}/3 domain) → Tur 3 tetikleniyor`);
    return false;
  }

  // Çatışma sinyali de yetersizse → Tur 3
  if (catismaSayisi < 2) {
    console.log(`[DEBATE] Çatışma sinyali yetersiz (${catismaSayisi}) → Tur 3 tetikleniyor`);
    return false;
  }

  console.log(`[DEBATE] Çatışma kalitesi yeterli (sinyal: ${catismaSayisi}, domain: ${domainKapsama}/3)`);
  return true;
}

// TUR 3 (Adaptif): Tartışma derinleştirilir, yeni perspektifler eklenir
async function tur3Debate(fikir, t1, t2) {
  const gecmisTartisma = `Fikir: ${fikir}

=== TUR 1 ===
Kullanıcı Değeri: ${t1.kullanici}
İş Stratejisi: ${t1.isStrateji}
Teknik: ${t1.teknik}

=== TUR 2 ===
Kullanıcı Değeri: ${t2.kullanici}
İş Stratejisi: ${t2.isStrateji}
Teknik: ${t2.teknik}`;

  const [kullanici3, isStrateji3, teknik3] = await Promise.all([
    aiCagir(tur3.kullanici,  gecmisTartisma),
    aiCagir(tur3.isStrateji, gecmisTartisma),
    aiCagir(tur3.teknik,     gecmisTartisma),
  ]);

  return { kullanici: kullanici3, isStrateji: isStrateji3, teknik: teknik3 };
}

// BOSS AI: Tüm turları okuyup nihai kararı verir
async function bossFinal(fikir, turSonuclari) {
  const ozetler = turSonuclari.map((t, i) =>
    `=== TUR ${i + 1} ===\nKullanıcı Değeri: ${t.kullanici}\nİş Stratejisi: ${t.isStrateji}\nTeknik: ${t.teknik}`
  ).join("\n\n");

  const cevap = await aiCagir(bossDebate, `Fikir: ${fikir}\n\n${ozetler}`);
  const temiz = cevap.replace(/```json|```/g, "").trim();
  return JSON.parse(temiz);
}

// ANA FONKSİYON
async function debateYap(fikir) {
  console.log("[DEBATE] Tur 1 başlıyor...");
  const t1 = await tur1Analiz(fikir);

  console.log("[DEBATE] Tur 2 başlıyor...");
  const t2 = await tur2Debate(fikir, t1);

  const turSonuclari = [t1, t2];

  if (!yeterliCatismaVarMi(t2)) {
    console.log("[DEBATE] Çatışma yetersiz → Tur 3 (adaptif) başlıyor...");
    const t3 = await tur3Debate(fikir, t1, t2);
    turSonuclari.push(t3);
  }

  console.log(`[DEBATE] ${turSonuclari.length} tur tamamlandı. Boss AI karar veriyor...`);
  const boss = await bossFinal(fikir, turSonuclari);

  const turlar = turSonuclari.map((t, i) => ({
    tur: i + 1,
    mesajlar: [
      { agent: "Kullanıcı Değeri", ikon: "👤", renk: "mavi",  mesaj: t.kullanici  },
      { agent: "İş Stratejisi",    ikon: "📈", renk: "yesil", mesaj: t.isStrateji },
      { agent: "Teknik",           ikon: "⚙️", renk: "mor",   mesaj: t.teknik     },
    ],
  }));

  return { turlar, boss };
}

module.exports = { debateYap };
