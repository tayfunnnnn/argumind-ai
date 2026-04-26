const { aiCagir } = require("./openaiService");
const { taskAgentPrompt } = require("../prompts/taskPrompts");

async function gorevUret(fikir, boss) {
  const kullaniciMesaji = `
Fikir: ${fikir}
Boss AI Kararı: ${boss.karar}
Boss AI Skoru: ${boss.skor}/10
Boss AI Açıklaması: ${boss.aciklama}`;

  const cevap = await aiCagir(taskAgentPrompt, kullaniciMesaji);
  const temiz = cevap.replace(/```json|```/g, "").trim();
  return JSON.parse(temiz);
}

module.exports = { gorevUret };
