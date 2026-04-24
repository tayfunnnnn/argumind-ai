// ===========================
// SCRIPT.JS — Kullanıcı sistemi + Fikir analizi
// ===========================


// ===========================
// SAYFA AÇILINCA
// Kullanıcı daha önce giriş yaptıysa direkt uygulamayı göster
// ===========================

window.onload = function () {
  const kullanici = localStorage.getItem("kullanici");

  if (kullanici) {
    // Giriş yapılmış → uygulamayı göster
    const bilgi = JSON.parse(kullanici);
    uygulamaGoster(bilgi.name);
    gecmisiniCek(bilgi.id);
    sprintleriYukle();
  } else {
    // Giriş yapılmamış → auth ekranını göster
    document.getElementById("auth-ekrani").classList.remove("gizli");
  }
};


// ===========================
// SEKME: GİRİŞ / KAYIT geçişi
// ===========================

function sekmeGoster(sekme) {
  const loginForm    = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const butonlar     = document.querySelectorAll(".sekme-btn");

  if (sekme === "login") {
    loginForm.classList.remove("gizli");
    registerForm.classList.add("gizli");
    butonlar[0].classList.add("aktif");
    butonlar[1].classList.remove("aktif");
  } else {
    loginForm.classList.add("gizli");
    registerForm.classList.remove("gizli");
    butonlar[0].classList.remove("aktif");
    butonlar[1].classList.add("aktif");
  }
}


// ===========================
// GİRİŞ YAP
// POST /login
// ===========================

async function girisYap() {
  const email = document.getElementById("login-email").value.trim();
  const sifre = document.getElementById("login-sifre").value;
  const hataEl = document.getElementById("login-hata");

  hataEl.classList.add("gizli");

  if (!email || !sifre) {
    hataEl.textContent = "Email ve şifre zorunludur.";
    hataEl.classList.remove("gizli");
    return;
  }

  try {
    const yanit = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: sifre })
    });

    const veri = await yanit.json();

    if (veri.hata) {
      hataEl.textContent = veri.hata;
      hataEl.classList.remove("gizli");
      return;
    }

    // Kullanıcı bilgisini localStorage'a kaydet (oturumu hatırlat)
    localStorage.setItem("kullanici", JSON.stringify(veri.kullanici));

    // Uygulamayı göster
    uygulamaGoster(veri.kullanici.name);
    gecmisiniCek(veri.kullanici.id);
    sprintleriYukle();

  } catch (hata) {
    hataEl.textContent = "Sunucuya bağlanılamadı.";
    hataEl.classList.remove("gizli");
  }
}


// ===========================
// KAYIT OL
// POST /register
// ===========================

async function kayitOl() {
  const isim   = document.getElementById("register-isim").value.trim();
  const email  = document.getElementById("register-email").value.trim();
  const sifre  = document.getElementById("register-sifre").value;
  const hataEl    = document.getElementById("register-hata");
  const basariEl  = document.getElementById("register-basari");

  hataEl.classList.add("gizli");
  basariEl.classList.add("gizli");

  if (!isim || !email || !sifre) {
    hataEl.textContent = "Tüm alanları doldurun.";
    hataEl.classList.remove("gizli");
    return;
  }

  try {
    const yanit = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: isim, email, password: sifre })
    });

    const veri = await yanit.json();

    if (veri.hata) {
      hataEl.textContent = veri.hata;
      hataEl.classList.remove("gizli");
      return;
    }

    // Başarı mesajı göster, giriş sekmesine geç
    basariEl.textContent = "✓ Kayıt başarılı! Şimdi giriş yapabilirsiniz.";
    basariEl.classList.remove("gizli");

    // 1.5 saniye sonra giriş sekmesine geç
    setTimeout(() => sekmeGoster("login"), 1500);

  } catch (hata) {
    hataEl.textContent = "Sunucuya bağlanılamadı.";
    hataEl.classList.remove("gizli");
  }
}


// ===========================
// ÇIKIŞ YAP
// ===========================

function cikisYap() {
  localStorage.removeItem("kullanici");
  location.reload(); // Sayfayı yenile → auth ekranı gelir
}


// ===========================
// UYGULAMA EKRANINI GÖSTER
// ===========================

function uygulamaGoster(isim) {
  document.getElementById("auth-ekrani").classList.add("gizli");
  document.getElementById("uygulama-ekrani").classList.remove("gizli");
  document.getElementById("kullanici-adi").textContent = isim;
  boardDragKurulum();
}


// ===========================
// FİKİR DEĞERLENDİR (mevcut sistem, değişmedi)
// ===========================

async function degerlendirFikir() {
  const fikir = document.getElementById("fikir-alani").value.trim();

  const bosUyari = document.getElementById("bos-uyari");
  if (fikir === "") {
    bosUyari.classList.remove("gizli");
    return;
  }
  bosUyari.classList.add("gizli");

  yuklemeyiBaslat();
  document.getElementById("hata-kutusu").classList.add("gizli");
  document.getElementById("sonuclar").classList.add("gizli");

  try {
    const userId = JSON.parse(localStorage.getItem("kullanici")).id;

    const yanit = await fetch("/api/degerlendir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fikir, userId })
    });

    const veri = await yanit.json();

    if (veri.hata) {
      const hataKutusu = document.getElementById("hata-kutusu");
      hataKutusu.textContent = "❌ " + veri.hata;
      hataKutusu.classList.remove("gizli");
      yuklemeyiBitir();
      return;
    }

    document.getElementById("userValue-metni").textContent            = veri.userValue;
    document.getElementById("businessStrategy-metni").textContent     = veri.businessStrategy;
    document.getElementById("technicalFeasibility-metni").textContent = veri.technicalFeasibility;

    bossSonucunuGoster(veri.boss);

    const sonuclar = document.getElementById("sonuclar");
    sonuclar.classList.remove("gizli");
    sonuclar.scrollIntoView({ behavior: "smooth" });

    gecmisiniCek(userId);

  } catch (hata) {
    const hataKutusu = document.getElementById("hata-kutusu");
    hataKutusu.textContent = "❌ Sunucuya bağlanılamadı.";
    hataKutusu.classList.remove("gizli");
  }

  yuklemeyiBitir();
}


// ===========================
// BOSS AI SONUCU EKRANA YAZ
// ===========================

function bossSonucunuGoster(boss) {
  window._sonBoss = boss;

  document.getElementById("boss-skor").textContent     = boss.skor;
  document.getElementById("boss-aciklama").textContent = boss.aciklama;

  // VAZGEÇ dışında butonu göster
  const btn = document.getElementById("gorev-uret-btn");
  gorevOnayKapat();
  if (boss.karar.includes("VAZGEÇ")) {
    btn.classList.add("gizli");
  } else {
    btn.classList.remove("gizli");
  }

  const kararEl = document.getElementById("boss-karar-etiketi");
  kararEl.textContent = "⭐ ÖNERİ: " + boss.karar;
  kararEl.className = "boss-karar-etiketi";

  if (boss.karar.includes("GELİŞTİREREK"))   kararEl.classList.add("karar-gelistir");
  else if (boss.karar.includes("DEVAM ET"))  kararEl.classList.add("karar-devam");
  else if (boss.karar.includes("PİVOT"))     kararEl.classList.add("karar-pivot");
  else if (boss.karar.includes("VAZGEÇ"))    kararEl.classList.add("karar-vazgec");
  else                                        kararEl.classList.add("karar-gelistir");

  const liste = document.getElementById("boss-guclu-liste");
  liste.innerHTML = "";
  boss.gucluYonler.forEach(function (madde) {
    const li = document.createElement("li");
    li.textContent = madde;
    liste.appendChild(li);
  });
}


// ===========================
// LOADING
// ===========================

function yuklemeyiBaslat() {
  document.getElementById("btn-yazi").classList.add("gizli");
  document.getElementById("btn-loading").classList.remove("gizli");
  document.getElementById("degerlendir-btn").disabled = true;
}

function yuklemeyiBitir() {
  document.getElementById("btn-yazi").classList.remove("gizli");
  document.getElementById("btn-loading").classList.add("gizli");
  document.getElementById("degerlendir-btn").disabled = false;
}


// ===========================
// GEÇMİŞ: SUNUCUDAN ÇEK
// ===========================

async function gecmisiniCek(userId) {
  try {
    const yanit = await fetch(`/api/gecmis/${userId}`);
    const rows  = await yanit.json();
    const gecmis = rows.map(function (r) {
      return {
        id:                   r.id,
        fikir:                r.fikir,
        tarih:                new Date(r.created_at).toLocaleString("tr-TR"),
        userValue:            r.userValue,
        businessStrategy:     r.businessStrategy,
        technicalFeasibility: r.technicalFeasibility,
        boss: {
          karar:      r.boss_karar,
          skor:       r.boss_skor,
          aciklama:   r.boss_aciklama,
          gucluYonler: JSON.parse(r.boss_gucluYonler)
        }
      };
    });
    gecmisiGoster(gecmis);
  } catch (hata) {
    console.error("Geçmiş yüklenemedi:", hata.message);
  }
}


// ===========================
// GEÇMİŞ: GÖSTER
// ===========================

// ===========================
// BOARD: SPRİNT YÜKLE
// ===========================

async function sprintleriYukle() {
  const kullanici = JSON.parse(localStorage.getItem("kullanici"));
  if (!kullanici) return;

  const yanit  = await fetch(`/api/sprints/${kullanici.id}`);
  const listesi = await yanit.json();

  const secici = document.getElementById("sprint-secici");
  secici.innerHTML = '<option value="">— Sprint seç —</option>';

  listesi.forEach(function (sprint) {
    const option = document.createElement("option");
    option.value       = sprint.id;
    option.textContent = sprint.name;
    secici.appendChild(option);
  });

  // Sprint varsa ilkini otomatik seç
  if (listesi.length > 0) {
    secici.value = listesi[0].id;
    sprintSec();
  }
}


// ===========================
// BOARD: SPRİNT SEÇ → TASKLERİ YÜKLE
// ===========================

async function sprintSec() {
  const sprintId = document.getElementById("sprint-secici").value;

  // 3 sütunu temizle
  ["YAPILACAK", "DEVAM_EDIYOR", "TAMAMLANDI"].forEach(function (durum) {
    document.getElementById("sutun-" + durum).innerHTML = "";
  });

  if (!sprintId) {
    document.getElementById("yeni-task-satiri").classList.add("gizli");
    return;
  }

  document.getElementById("yeni-task-satiri").classList.remove("gizli");

  const yanit = await fetch(`/api/tasks/${sprintId}`);
  const tasks = await yanit.json();

  tasks.forEach(function (task) {
    taskKartiOlustur(task);
  });
}


// ===========================
// BOARD: TASK KARTI OLUŞTUR
// ===========================

var _suruklenenTaskId = null;

function taskKartiOlustur(task) {
  const sutun = document.getElementById("sutun-" + task.status);
  if (!sutun) return;

  const kart = document.createElement("div");
  kart.className = "task-kart";
  kart.draggable = true;
  kart.dataset.taskId = String(task.id);

  const katSinif = {
    "Araştırma": "kat-arastirma",
    "Tasarım":   "kat-tasarim",
    "Teknik":    "kat-teknik",
    "Büyüme":    "kat-buyume"
  }[task.kategori] || "";

  const badgeHtml = task.kategori
    ? `<div class="task-kategori-satiri"><span class="gorev-kategori ${katSinif}">${task.kategori}</span></div>`
    : "";

  kart.innerHTML = `<div class="task-baslik">${task.title}</div>${badgeHtml}`;

  kart.ondragstart = function (e) {
    _suruklenenTaskId = task.id;
    e.dataTransfer.effectAllowed = "move";
    setTimeout(function () {
      kart.classList.add("surukleniyor");
      document.querySelector(".board-sutunlar").classList.add("drag-aktif");
    }, 0);
  };

  kart.ondragend = function () {
    kart.classList.remove("surukleniyor");
    document.querySelector(".board-sutunlar").classList.remove("drag-aktif");
    _suruklenenTaskId = null;
  };

  sutun.appendChild(kart);
}


function boardDragKurulum() {
  document.querySelectorAll(".board-sutun[data-durum]").forEach(function (kutu) {
    var durum  = kutu.dataset.durum;
    var icerik = document.getElementById("sutun-" + durum);

    kutu.ondragover = function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      icerik.classList.add("uzerine-gelindi");
    };

    kutu.ondragleave = function (e) {
      if (!kutu.contains(e.relatedTarget)) {
        icerik.classList.remove("uzerine-gelindi");
      }
    };

    kutu.ondrop = function (e) {
      e.preventDefault();
      icerik.classList.remove("uzerine-gelindi");

      var taskId = _suruklenenTaskId;
      if (!taskId) return;

      var kart = document.querySelector('[data-task-id="' + taskId + '"]');
      if (kart) icerik.appendChild(kart);

      fetch("/api/tasks/" + taskId + "/status", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: durum })
      });
    };
  });
}


// ===========================
// ÖRNEK FİKİR
// ===========================

function ornekFikirGetir() {
  const ornekler = [
    "Freelancer'ların müşteri takibini ve faturalarını yöneten mobil uygulama",
    "Kitap okuma alışkanlığını gamification ile geliştiren uygulama",
    "Küçük restoranlar için QR menü ve sipariş yönetim sistemi",
    "Spor salonları için üyelik ve antrenman takip platformu",
    "Ev sahipleri ile kiracıları bir araya getiren güvenilir kiralama platformu"
  ];
  const rastgele = ornekler[Math.floor(Math.random() * ornekler.length)];
  document.getElementById("fikir-alani").value = rastgele;
  document.getElementById("fikir-alani").focus();
}


// ===========================
// FİKİR KOÇU
// ===========================

var _kocSorular = [];

async function fikirKocuBaslat() {
  const fikir = document.getElementById("fikir-alani").value.trim();
  if (!fikir) {
    document.getElementById("bos-uyari").classList.remove("gizli");
    return;
  }
  document.getElementById("bos-uyari").classList.add("gizli");

  const btn = document.querySelector("[onclick='fikirKocuBaslat()']");
  btn.disabled = true;
  btn.textContent = "⏳ Sorular hazırlanıyor...";

  try {
    const yanit = await fetch("/api/idea-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mod: "sorular", fikir })
    });
    const veri = await yanit.json();
    if (veri.hata) throw new Error(veri.hata);

    _kocSorular = veri.sorular;
    kocSorularGoster(veri.sorular);

    document.getElementById("koc-alani").classList.remove("gizli");
    document.getElementById("koc-alani").scrollIntoView({ behavior: "smooth" });
  } catch (hata) {
    alert("Hata: " + hata.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "💡 Sorularla Geliştir";
  }
}

function kocSorularGoster(sorular) {
  const liste = document.getElementById("koc-sorular-liste");
  liste.innerHTML = "";
  document.getElementById("koc-sonuc-alani").classList.add("gizli");
  document.getElementById("koc-sorular-alani").classList.remove("gizli");

  sorular.forEach(function (soru, i) {
    const grup = document.createElement("div");
    grup.className = "koc-soru-grup";
    grup.innerHTML = `
      <div class="koc-soru-metin">${i + 1}. ${soru}</div>
      <textarea class="koc-soru-input" id="koc-cevap-${i}" placeholder="Cevabınız..."></textarea>
    `;
    liste.appendChild(grup);
  });
}

async function fikriGelistir() {
  const fikir = document.getElementById("fikir-alani").value.trim();
  const cevaplar = {};

  _kocSorular.forEach(function (soru, i) {
    const el = document.getElementById("koc-cevap-" + i);
    cevaplar[soru] = el ? el.value.trim() : "";
  });

  const yazı  = document.getElementById("koc-gelistir-yazi");
  const yukleniyor = document.getElementById("koc-gelistir-loading");
  yazı.classList.add("gizli");
  yukleniyor.classList.remove("gizli");

  try {
    const yanit = await fetch("/api/idea-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mod: "gelistir", fikir, cevaplar })
    });
    const veri = await yanit.json();
    if (veri.hata) throw new Error(veri.hata);

    kocSonucGoster(veri);
  } catch (hata) {
    alert("Hata: " + hata.message);
  } finally {
    yazı.classList.remove("gizli");
    yukleniyor.classList.add("gizli");
  }
}

function kocSonucGoster(veri) {
  document.getElementById("koc-sorular-alani").classList.add("gizli");
  document.getElementById("koc-sonuc-alani").classList.remove("gizli");

  document.getElementById("koc-baslik").textContent    = veri.baslik;
  document.getElementById("koc-hedef").textContent     = veri.hedefKitle;
  document.getElementById("koc-problem").textContent   = veri.problem;
  document.getElementById("koc-cozum").textContent     = veri.cozum;
  document.getElementById("koc-deger").textContent     = veri.nedenDegerli;

  const ul = document.getElementById("koc-ozellikler");
  ul.innerHTML = "";
  (veri.temelOzellikler || []).forEach(function (oz) {
    const li = document.createElement("li");
    li.textContent = oz;
    ul.appendChild(li);
  });
}

function fikriAktarAna() {
  const baslik  = document.getElementById("koc-baslik").textContent;
  const hedef   = document.getElementById("koc-hedef").textContent;
  const problem = document.getElementById("koc-problem").textContent;
  const cozum   = document.getElementById("koc-cozum").textContent;
  const ozellikler = Array.from(document.getElementById("koc-ozellikler").querySelectorAll("li"))
    .map(function (li) { return "- " + li.textContent; }).join("\n");

  const ozet = `${baslik}\n\nHedef Kitle: ${hedef}\nProblem: ${problem}\nÇözüm: ${cozum}\nTemel Özellikler:\n${ozellikler}`;
  document.getElementById("fikir-alani").value = ozet;
  document.getElementById("koc-alani").classList.add("gizli");
  document.getElementById("fikir-alani").scrollIntoView({ behavior: "smooth" });
}

function kocuSifirla() {
  document.getElementById("koc-sorular-alani").classList.remove("gizli");
  document.getElementById("koc-sonuc-alani").classList.add("gizli");
  kocSorularGoster(_kocSorular);
}


// ===========================
// TASK AGENT: GÖREV ÜRET
// ===========================

async function gorevUret() {
  const fikir = document.getElementById("fikir-alani").value.trim();
  const btn   = document.getElementById("gorev-uret-btn");

  btn.disabled    = true;
  btn.textContent = "⏳ Görevler üretiliyor...";

  try {
    const kullanici = JSON.parse(localStorage.getItem("kullanici"));
    const yanit = await fetch("/api/task-agent", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ fikir, boss: window._sonBoss })
    });

    const veri = await yanit.json();
    if (veri.hata) throw new Error(veri.hata);

    window._agentSonuc = veri;

    // Sprint adını göster
    document.getElementById("gorev-sprint-adi-metin").textContent = veri.sprintAdi;

    // Görev listesini oluştur
    const liste = document.getElementById("gorev-liste");
    liste.innerHTML = "";

    veri.gorevler.forEach(function (gorev, i) {
      const katSinif = {
        "Araştırma": "kat-arastirma",
        "Tasarım":   "kat-tasarim",
        "Teknik":    "kat-teknik",
        "Büyüme":    "kat-buyume"
      }[gorev.kategori] || "kat-teknik";

      const satir = document.createElement("div");
      satir.className = "gorev-satir";
      satir.innerHTML = `
        <input type="checkbox" id="gorev-cb-${i}" checked />
        <label class="gorev-satir-metin" for="gorev-cb-${i}">${gorev.baslik}</label>
        <span class="gorev-kategori ${katSinif}">${gorev.kategori}</span>
      `;
      satir.querySelector("input").addEventListener("change", secimSayacGuncelle);
      liste.appendChild(satir);
    });

    secimSayacGuncelle();

    document.getElementById("gorev-onay-alani").classList.remove("gizli");

  } catch (hata) {
    alert("Görev üretilemedi: " + hata.message);
  }

  btn.disabled    = false;
  btn.textContent = "✨ AI Görev Üret";
}


// ===========================
// TASK AGENT: SEÇİM SAYACI
// ===========================

function secimSayacGuncelle() {
  const toplam  = document.querySelectorAll("#gorev-liste input[type='checkbox']").length;
  const secili  = document.querySelectorAll("#gorev-liste input[type='checkbox']:checked").length;
  document.getElementById("gorev-secim-sayac").textContent = `${secili} / ${toplam} görev seçildi`;
}


// ===========================
// TASK AGENT: SPRINT'E EKLE
// ===========================

async function sprinteEkle() {
  const kullanici = JSON.parse(localStorage.getItem("kullanici"));
  const veri      = window._agentSonuc;

  // Seçili görevleri topla
  const seciliGorevler = veri.gorevler.filter(function (_, i) {
    return document.getElementById("gorev-cb-" + i).checked;
  });

  if (seciliGorevler.length === 0) {
    alert("En az bir görev seçin.");
    return;
  }

  document.getElementById("gorev-ekle-yazi").classList.add("gizli");
  document.getElementById("gorev-ekle-loading").classList.remove("gizli");

  try {
    // Yeni sprint oluştur
    const sprintYanit = await fetch("/api/sprints", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: veri.sprintAdi, userId: kullanici.id })
    });
    const sprint = await sprintYanit.json();

    // Seçili görevleri sırayla ekle
    for (const gorev of seciliGorevler) {
      await fetch("/api/tasks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sprintId: sprint.id, userId: kullanici.id, title: gorev.baslik, kategori: gorev.kategori })
      });
    }

    gorevOnayKapat();
    await sprintleriYukle();

    // Board'u yeni sprinte odakla
    document.getElementById("sprint-secici").value = sprint.id;
    sprintSec();
    document.getElementById("board-alani").scrollIntoView({ behavior: "smooth" });

  } catch (hata) {
    alert("Eklenemedi: " + hata.message);
  }

  document.getElementById("gorev-ekle-yazi").classList.remove("gizli");
  document.getElementById("gorev-ekle-loading").classList.add("gizli");
}


// ===========================
// TASK AGENT: ONAY KAPAT
// ===========================

function gorevOnayKapat() {
  document.getElementById("gorev-onay-alani").classList.add("gizli");
  document.getElementById("gorev-liste").innerHTML = "";
}


// ===========================
// BOARD: YENİ SPRİNT FORMU AÇ / KAPAT
// ===========================

async function sprintSil() {
  const secici   = document.getElementById("sprint-secici");
  const sprintId = secici.value;

  if (!sprintId) return;

  const sprintAdi = secici.options[secici.selectedIndex].textContent;
  if (!confirm(`"${sprintAdi}" sprintini ve tüm görevlerini silmek istediğinden emin misin?`)) return;

  const yanit = await fetch(`/api/sprints/${sprintId}`, { method: "DELETE" });
  if (!yanit.ok) { alert("Sprint silinemedi."); return; }

  secici.remove(secici.selectedIndex);
  secici.value = "";
  sprintSec();
}

function yeniSprintAc() {
  document.getElementById("yeni-sprint-formu").classList.remove("gizli");
  document.getElementById("sprint-adi").focus();
}

function yeniSprintKapat() {
  document.getElementById("yeni-sprint-formu").classList.add("gizli");
  document.getElementById("sprint-adi").value = "";
}


// ===========================
// BOARD: SPRİNT OLUŞTUR
// ===========================

async function sprintOlustur() {
  const ad       = document.getElementById("sprint-adi").value.trim();
  const kullanici = JSON.parse(localStorage.getItem("kullanici"));

  if (!ad) return;

  const yanit  = await fetch("/api/sprints", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name: ad, userId: kullanici.id })
  });
  const sprint = await yanit.json();

  // Dropdown'a ekle ve seç
  const secici = document.getElementById("sprint-secici");
  const option = document.createElement("option");
  option.value       = sprint.id;
  option.textContent = sprint.name;
  secici.insertBefore(option, secici.options[1]);
  secici.value = sprint.id;

  yeniSprintKapat();
  sprintSec();
}


// ===========================
// BOARD: TASK EKLE
// ===========================

async function taskEkle() {
  const baslik   = document.getElementById("yeni-task-input").value.trim();
  const sprintId = document.getElementById("sprint-secici").value;
  const kullanici = JSON.parse(localStorage.getItem("kullanici"));

  if (!baslik || !sprintId) return;

  const yanit = await fetch("/api/tasks", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ sprintId, userId: kullanici.id, title: baslik })
  });
  const task = await yanit.json();

  document.getElementById("yeni-task-input").value = "";
  taskKartiOlustur(task);
}


// ===========================
// BOARD: DURUM GÜNCELLE
// ===========================

async function durumGuncelle(taskId, yeniDurum) {
  await fetch(`/api/tasks/${taskId}/status`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ status: yeniDurum })
  });

  sprintSec(); // board'u yenile
}


function gecmisiToggle() {
  const icerik = document.getElementById("gecmis-icerik");
  const ok     = document.getElementById("gecmis-ok");
  icerik.classList.toggle("gizli");
  ok.classList.toggle("acik");
}

function gecmisiGoster(gecmis) {
  const alan  = document.getElementById("gecmis-alani");
  const liste = document.getElementById("gecmis-liste");

  if (!alan) return;

  if (gecmis.length === 0) { alan.classList.add("gizli"); return; }

  alan.classList.remove("gizli");
  liste.innerHTML = "";

  // Max 10 item göster
  gecmis.slice(0, 10).forEach(function (kayit) {
    const kart = document.createElement("div");
    kart.className = "gecmis-kart";
    kart.innerHTML = `
      <div class="gecmis-kart-bilgi">
        <div class="gecmis-kart-fikir">${kayit.fikir}</div>
        <div class="gecmis-kart-tarih">${kayit.tarih}</div>
      </div>
      <button class="gecmis-sil-btn" title="Sil">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    `;

    kart.querySelector(".gecmis-kart-bilgi").onclick = function () {
      document.getElementById("fikir-alani").value                     = kayit.fikir;
      document.getElementById("userValue-metni").textContent            = kayit.userValue;
      document.getElementById("businessStrategy-metni").textContent     = kayit.businessStrategy;
      document.getElementById("technicalFeasibility-metni").textContent = kayit.technicalFeasibility;
      bossSonucunuGoster(kayit.boss);
      document.getElementById("sonuclar").classList.remove("gizli");
      document.getElementById("sonuclar").scrollIntoView({ behavior: "smooth" });
    };

    kart.querySelector(".gecmis-sil-btn").onclick = async function (e) {
      e.stopPropagation();
      const yanit = await fetch(`/api/gecmis/${kayit.id}`, { method: "DELETE" });
      if (!yanit.ok) return;
      kart.remove();
      if (liste.children.length === 0) {
        document.getElementById("gecmis-alani").classList.add("gizli");
      }
    };

    liste.appendChild(kart);
  });
}
