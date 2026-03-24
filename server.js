require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 📦 Multer setup
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// 🧠 Prompt Builder
function buildPrompt(text, mode, count) {
  const chunk = text.slice(0, 8000);

  if (mode === 'flashcard') {
    return `Create exactly ${count} flashcards from the text below. Return ONLY a JSON array, no explanation, no markdown, no code fences. Each item: { "front": "question or concept", "back": "answer or explanation" }\n\nText:\n${chunk}`;
  }

  if (mode === 'mcq') {
    return `Create exactly ${count} multiple choice questions from the text below. Return ONLY a JSON array, no explanation, no markdown, no code fences. Each item: { "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A) ..." }. Only one correct answer.\n\nText:\n${chunk}`;
  }

  if (mode === 'fillblank') {
    return `Create exactly ${count} fill-in-the-blank questions from the text below. Return ONLY a JSON array, no explanation, no markdown, no code fences. Each item: { "sentence": "The ___ is responsible for ...", "answer": "missing word or phrase" }.\n\nText:\n${chunk}`;
  }
}

// 🚀 GROQ API CALL
async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;

  const { default: fetch } = await import('node-fetch');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a strict JSON generator. Always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Groq API error');
  }

  let raw = data.choices?.[0]?.message?.content || '';

  // 🧼 clean markdown junk
  raw = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("RAW AI RESPONSE:", raw); // debug lifesaver
    throw new Error('Invalid JSON from AI');
  }
}

// 📄 MAIN ROUTE
app.post('/api/generate', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    const { mode = 'flashcard', count = 10 } = req.body;

    const validModes = ['flashcard', 'mcq', 'fillblank'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const cardCount = Math.min(Math.max(parseInt(count) || 10, 3), 20);

    // 📖 Parse PDF
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.trim();

    if (text.length < 50) {
      return res.status(400).json({
        error: 'PDF has no readable text (maybe scanned image)'
      });
    }

    const prompt = buildPrompt(text, mode, cardCount);

    const cards = await callGroq(prompt);

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(500).json({
        error: 'AI returned unexpected format'
      });
    }

    res.json({ mode, cards });

  } catch (err) {
    console.error(err);

    if (err.message?.includes('JSON')) {
      return res.status(500).json({
        error: 'AI response parsing failed. Try again.'
      });
    }

    res.status(500).json({
      error: err.message || 'Something went wrong'
    });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`FlashGen running at http://localhost:${PORT}`);
});
