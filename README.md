
# FlashGen — PDF to Quiz App

Upload any PDF and generate Flashcards, MCQ, or Fill-in-the-Blank questions using AI.

## Setup (takes 2 minutes)

### 1. Install Node.js
Download from https://nodejs.org (get the LTS version)

### 2. Get your Anthropic API key
- Go to https://console.anthropic.com
- Sign up (free)
- Click "API Keys" → "Create Key" → copy it

### 3. Add your API key
Open the `.env` file and replace `your_api_key_here` with your actual key:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx...
```

### 4. Install dependencies
Open a terminal in this folder and run:
```
npm install
```

### 5. Start the server
```
npm start
```

### 6. Open the app
Go to http://localhost:3000 in your browser.

---

## How it works
1. Drop a PDF → the server extracts the text using `pdf-parse`
2. The text is sent to Claude AI with a prompt to generate questions
3. Claude returns structured JSON (flashcards / MCQ / fill-in-blank)
4. The frontend renders an interactive quiz

## Project structure
```
flashgen/
├── server.js        ← Node.js backend (Express)
├── .env             ← Your API key goes here
├── package.json     ← Dependencies
└── public/
    └── index.html   ← Frontend (HTML + CSS + JS)
```
