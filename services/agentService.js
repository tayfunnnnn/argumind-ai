const { aiCagir } = require("./openaiService");
const {
  kullaniciDegeriPrompt,
  isStratejisiPrompt,
  teknikPrompt,
  bossPrompt
} = require("../prompts/evaluationPrompts");

async function kullaniciDegeriAjani(fikir) {
  return await aiCagir(kullaniciDegeriPrompt, fikir);
}

async function isStratejisiAjani(fikir) {
  return await aiCagir(isStratejisiPrompt, fikir);
}

async function teknikAjani(fikir) {
  return await aiCagir(teknikPrompt, fikir);
}

async function bossAjani(fikir, kullanici, isStrateji, teknik) {
  const kullaniciMesaji = `
Fikir: ${fikir}
Kullanıcı Değeri Analizi: ${kullanici}
İş/Strateji Analizi: ${isStrateji}
Teknik Analiz: ${teknik}`;

  const cevap = await aiCagir(bossPrompt, kullaniciMesaji);
  const temiz = cevap.replace(/```json|```/g, "").trim();
  return JSON.parse(temiz);
}

module.exports = { kullaniciDegeriAjani, isStratejisiAjani, teknikAjani, bossAjani };
