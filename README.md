# 🚀 ArguMind AI

![App Screenshot](./screenshot.png)

🔗 **Live Demo:**  
👉 https://argumind-ai.onrender.com

---

## 🧠 Proje Amacı

**ArguMind AI**, kullanıcıların iş ve ürün fikirlerini çoklu yapay zeka agent’larının tartışması (multi-agent debate) ile analiz eden bir karar destek sistemidir.

Geleneksel AI sistemleri:
- Tek cevap üretir  
- Yüzeysel analiz yapar  
- Fazla “uyumlu” davranır  

**ArguMind AI yaklaşımı:**
- Multi-agent system (çoklu AI agent)
- Adversarial debate (çatışmalı tartışma)
- Role-based reasoning (rol bazlı analiz)
- Decision engine (net karar üretimi)

---

## ⚙️ Nasıl Çalışır?

### 1. Kullanıcı fikrini girer

> “AI destekli restoran otomasyon sistemi”

---

### 2. 3 farklı AI agent analiz yapar

| Agent | Odak |
|------|------|
| 👤 Kullanıcı | Davranış, güven, adoption |
| 📈 İş | Pazar, gelir, rekabet |
| ⚙️ Teknik | Feasibility, maliyet, sistem |

---

### 3. Debate başlar

- Agent’lar birbirine itiraz eder  
- Argümanlar çürütülür  
- Yeni riskler ortaya çıkar  

---

### 4. Boss AI karar verir

- ✅ DEVAM ET  
- 🔄 PIVOT  
- ❌ VAZGEÇ  

---

### 5. Çıktı

```json
{
  "score": 3.5,
  "decision": "VAZGEÇ",
  "summary": "...",
  "strongPoints": ["..."],
  "risks": ["..."],
  "winningAgent": "user",
  "criticalMistake": "..."
}