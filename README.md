 FlashGen — AI-Powered PDF to Quiz Generator

Turn boring PDFs into interactive quizzes in seconds.

FlashGen is a full-stack AI application that converts study material into flashcards, MCQs, and fill-in-the-blank questions — helping users actively learn instead of passively reading.

---

  Features

- Upload any PDF (notes, textbooks, articles)
- AI-generated:
  - Flashcards
  - Multiple Choice Questions (MCQs)
  - Fill-in-the-Blanks
-  Interactive quiz experience
-  Real-time performance tracking
-  Clean, modern UI (black & gold aesthetic)


---

 How It Works

1. Upload a PDF  
2. Text is extracted using `pdf-parse`  
3. AI processes the content and generates structured questions  
4. The frontend renders an interactive quiz interface  

---

Tech Stack

- Frontend: HTML, CSS, JavaScript  
- Backend:Node.js, Express  
- Libraries: Multer, PDF-Parse  
- AI: Groq API (LLaMA / Mixtral models)

 Setup (2 minutes)

flashgen/
├── server.js        ← Node.js backend (Express)
├── .env             ← Your API key goes here
├── package.json     ← Dependencies
└── public/
    └── index.html   ← Frontend (HTML + CSS + JS)
```
