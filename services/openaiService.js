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

module.exports = { aiCagir };
