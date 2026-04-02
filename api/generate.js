import pdfParse from 'pdf-parse';

// 🧠 Prompt Builder (same as yours)
function buildPrompt(text, mode, count) {
  const chunk = text.slice(0, 8000);

  if (mode === 'flashcard') {
    return `Create exactly ${count} flashcards from the text below. Return ONLY a JSON array. Each item: { "front": "...", "back": "..." }\n\nText:\n${chunk}`;
  }

  if (mode === 'mcq') {
    return `Create exactly ${count} multiple choice questions. Return ONLY JSON array. Format: { "question": "...", "options": ["A)..."], "answer": "A)..." }\n\nText:\n${chunk}`;
  }

  if (mode === 'fillblank') {
    return `Create exactly ${count} fill-in-the-blank questions. Return ONLY JSON array. Format: { "sentence": "...", "answer": "..." }\n\nText:\n${chunk}`;
  }
}

// 🚀 GROQ CALL (same logic)
async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Return valid JSON only.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Groq error');
  }

  let raw = data.choices?.[0]?.message?.content || '';
  raw = raw.replace(/```json|```/g, '').trim();

  return JSON.parse(raw);
}

// 🔥 MAIN HANDLER (this replaces Express)
export const config = {
  api: {
    bodyParser: false // needed for file upload
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    // ⚠️ Vercel doesn't support multer → use formData()
    const formData = await req.formData();
    const file = formData.get('pdf');

    if (!file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    const mode = formData.get('mode') || 'flashcard';
    const count = Math.min(Math.max(parseInt(formData.get('count')) || 10, 3), 20);

    // 📄 Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 📖 Parse PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.trim();

    if (text.length < 50) {
      return res.status(400).json({
        error: 'PDF has no readable text'
      });
    }

    const prompt = buildPrompt(text, mode, count);
    const cards = await callGroq(prompt);

    res.status(200).json({ mode, cards });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message || 'Something broke'
    });
  }
}
