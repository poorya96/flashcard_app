import pandas as pd
import json
from pathlib import Path
from gtts import gTTS
import time

# ========== تنظیمات ==========
excel_path = "words.xlsx"
output_dir = Path("flashcard_app")
audio_dir = output_dir / "audio"
output_dir.mkdir(exist_ok=True)
audio_dir.mkdir(parents=True, exist_ok=True)

# ========== خواندن فایل اکسل ==========
df = pd.read_excel(excel_path, header=None, names=["word", "syllables"])
df = df.fillna("")
cards = []

for _, row in df.iterrows():
    word = row["word"].strip()
    syllables = [s.strip() for s in row["syllables"].split(',')]
    cards.append({
        "word": word,
        "syllables": syllables,
        "repeat": 1
    })

    # ===== تولید صدای MP3 =====
    mp3_path = audio_dir / f"{word}.mp3"
    if not mp3_path.exists():
        try:
            tts = gTTS(word)
            tts.save(str(mp3_path))
            print(f"✓ Audio created: {word}")
            time.sleep(0.5)  # برای جلوگیری از بلاک شدن توسط گوگل
        except Exception as e:
            print(f"خطا در تولید صدا برای {word}: {e}")

# ========== ذخیره JSON ==========
with open(output_dir / "data.json", "w", encoding="utf-8") as f:
    json.dump(cards, f, ensure_ascii=False, indent=2)

# ========== HTML ==========
html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Flashcards</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Flashcard Trainer</h1>
    <div id="flashcards" class="cards-container"></div>
    <div class="controls">
      <button onclick="prev()">◀ Prev</button>
      <button onclick="next()">Next ▶</button>
    </div>
  </div>
<script src="script.js"></script>
</body>
</html>
"""
with open(output_dir / "index.html", "w", encoding="utf-8") as f:
    f.write(html)

# ========== CSS ==========
css = """
body {
  background-color: #121212;
  color: white;
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 1rem;
}
.container {
  max-width: 900px;
  margin: auto;
  text-align: center;
}
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}
.flashcard {
  background-color: #1e1e1e;
  border: 1px solid #444;
  padding: 1rem;
  border-radius: 10px;
  position: relative;
  perspective: 1000px;
}
.card-inner {
  position: relative;
  transition: transform 0.8s;
  transform-style: preserve-3d;
}
.flashcard.flipped .card-inner {
  transform: rotateY(180deg);
}
.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}
.card-back {
  transform: rotateY(180deg);
}
input {
  margin-top: 0.5rem;
  padding: 0.3rem;
  width: 90%;
}
button {
  padding: 0.5rem 1rem;
  margin: 1rem;
  background: #333;
  color: white;
  border: none;
  border-radius: 5px;
}
.syllable:nth-child(1) { color: red; }
.syllable:nth-child(2) { color: cyan; }
.syllable:nth-child(3) { color: limegreen; }
.syllable:nth-child(4) { color: orange; }
.syllable:nth-child(5) { color: violet; }
"""
with open(output_dir / "style.css", "w", encoding="utf-8") as f:
    f.write(css)

# ========== JS ==========
js = """
let cards = [];
let currentIndex = 0;
let pageSize = 4;

fetch("data.json")
  .then((res) => res.json())
  .then((data) => {
    cards = data.flatMap(card => Array(card.repeat).fill(card));
    shuffle(cards);
    render();
  });

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function render() {
  const container = document.getElementById("flashcards");
  container.innerHTML = "";
  const page = cards.slice(currentIndex, currentIndex + pageSize);

  page.forEach((card, i) => {
    const div = document.createElement("div");
    div.className = "flashcard";
    div.innerHTML = `
      <div class="card-inner" onclick="this.parentElement.classList.toggle('flipped')">
        <div class="card-front">
          <h3>${card.word}</h3>
          <button onclick="event.stopPropagation(); playSound('${card.word}')">🔊</button>
          <input type="text" placeholder="Type the word"
            onblur="checkAnswer(this, '${card.word}', ${currentIndex + i})" />
        </div>
        <div class="card-back">
          <div>${card.syllables.map((s, i) => `<span class='syllable'>${s}</span>`).join("")}</div>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function playSound(word) {
  const audio = new Audio("audio/" + word + ".mp3");
  audio.play();
}

function checkAnswer(input, correct, index) {
  if (input.value.trim().toLowerCase() !== correct.toLowerCase()) {
    cards.push(cards[index]);  // تکرار کارت در صورت پاسخ اشتباه
    alert("❌ Wrong. Try again later!");
  } else {
    input.style.border = "2px solid limegreen";
  }
}

function prev() {
  if (currentIndex > 0) {
    currentIndex -= pageSize;
    render();
  }
}

function next() {
  if (currentIndex + pageSize < cards.length) {
    currentIndex += pageSize;
    render();
  }
}
"""
with open(output_dir / "script.js", "w", encoding="utf-8") as f:
    f.write(js)

print("✅ Flashcard web app created in 'flashcard_app/'")
