# 🤖 AI Idea Evaluator

AI Idea Evaluator, kullanıcıların iş veya girişim fikirlerini yapay zekâ (AI) destekli analiz ederek değerlendirmesini sağlayan bir web uygulamasıdır.

Uygulama; girilen fikri farklı AI agent’lar (uzman roller) ile analiz eder, sonuçları birleştirir ve uygulanabilir bir aksiyon planı (task listesi) üretir.

---

## 🚀 Canlı Demo

👉 https://ai-idea-evaluator-r1sq.onrender.com/

📌 Not: İlk açılışta (Render free plan) 30–50 saniye gecikme olabilir.

---

## 📸 Uygulama Önizleme

![App Preview](./screenshot.png)

---

## 🧩 Problem & Çözüm

**Problem:**  
Bir iş fikrinin iyi olup olmadığını anlamak zor. Genelde:
- farklı açılardan değerlendirilmez
- objektif analiz yapılmaz
- aksiyona dönüştürülmez

**Çözüm:**  
AI Idea Evaluator:
- fikri farklı perspektiflerden analiz eder  
- tek bir karar üretir  
- direkt uygulanabilir görev listesine çevirir  

---

## ⚙️ Temel Özellikler

- 🔐 Kullanıcı kayıt & giriş sistemi (authentication – kimlik doğrulama)
- 🤖 AI destekli fikir analizi
- 🧠 Çoklu AI agent mimarisi:
  - Kullanıcı Değeri Analizi
  - İş / Strateji Analizi
  - Teknik Uygulanabilirlik Analizi
- 👨‍💼 Boss AI ile nihai karar & puanlama
- ❓ Soru bazlı fikir geliştirme akışı
- 📋 Otomatik task listesi üretimi
- 🗂️ Sprint Board (kanban) ile görev takibi
- 🕘 Kullanıcıya özel analiz geçmişi

---

## 🧱 Kullanılan Teknolojiler

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js (runtime), Express.js (framework)
- Veritabanı: SQLite
- Authentication: bcrypt (şifre güvenliği)
- AI: OpenAI API

---

## 🔄 Uygulama Akışı

1. Kullanıcı fikir girer  
2. AI agent’lar farklı açılardan analiz eder  
3. Boss AI sonuçları değerlendirir  
4. Nihai karar & skor oluşturulur  
5. Sistem task listesi üretir  
6. Kullanıcı Sprint Board üzerinden ilerler  

---

## 🛠️ Kurulum (Local)

```bash
git clone https://github.com/tayfunnnnn/ai-idea-evaluator.git
cd ai-idea-evaluator
npm install
npm start