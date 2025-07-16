// 🔥 نسخه‌ی نهایی script.js با تمام ویژگی‌های درخواستی:
// - شافل
// - ذخیره‌ی پیشرفت در localStorage
// - حالت مرور کلمات غلط
// - حالت مرور کلی همه کلمات
// - پخش صدا در جلو و پشت کارت

let allWords = [];      // کل لغات
let cards = [];         // فلش‌کارت‌ها (گروهی)
let currentIndex = 0;   // کارت فعلی
let answers = [null, null, null, null]; // درست/غلط برای هر کارت
let reviewMode = "normal"; // modes: normal, wrong, review-all

// --- یار ذخیره‌سازی در localStorage ---
const STORAGE_KEY = "flashcard_progress";
function saveProgress(word, isCorrect) {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  saved[word] = isCorrect;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}
function loadProgress() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

// --- شافل کردن آرایه ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// --- بارگذاری داده ---
fetch("data.json")
  .then((res) => res.json())
  .then((data) => {
    allWords = [...data];
    startNormalMode();
  });

// --- ساخت کارت‌ها از آرایه کلمات ---
function buildCards(wordArray) {
  cards = [];
  for (let i = 0; i < wordArray.length; i += 4) {
    cards.push(wordArray.slice(i, i + 4));
  }
}

// --- حالت‌های مختلف شروع ---
function startNormalMode() {
  reviewMode = "normal";
  shuffle(allWords);
  buildCards(allWords);
  currentIndex = 0;
  render();
}
function startWrongOnlyMode() {
  reviewMode = "wrong";
  const progress = loadProgress();
  const wrongWords = allWords.filter((w) => progress[w.word] === false);
  buildCards(wrongWords);
  currentIndex = 0;
  render();
}
function startReviewAllMode() {
  reviewMode = "review-all";
  renderReviewAll();
}

// --- رندر فلش‌کارت ---
function render() {
  const flashcard = document.querySelector(".flashcard");
  const front = document.getElementById("card-front");
  const back = document.getElementById("card-back");
  const counter = document.getElementById("card-counter");

  if (cards.length === 0) {
    front.innerHTML = "<p>No words to show</p>";
    back.innerHTML = "";
    counter.innerText = "";
    return;
  }

  const group = cards[currentIndex];
  answers = [null, null, null, null];

  front.innerHTML = "";
  back.innerHTML = "";
  flashcard.classList.remove("flipped");
  flashcard.onclick = null;

  group.forEach((card, i) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <input type="text" placeholder="Type the word"
        onblur="checkAnswer(this, '${card.word}', ${i})" />
      <button onclick="event.stopPropagation(); playSound('${card.word}')">🔊</button>
    `;
    front.appendChild(row);
  });

  renderBack();
  counter.innerText = `Card ${currentIndex + 1} of ${cards.length}`;
}

// --- پشت کارت با تیک/ضربدر + صدا ---
function renderBack() {
  const back = document.getElementById("card-back");
  const group = cards[currentIndex];
  back.innerHTML = "";

  group.forEach((card, i) => {
    const line = document.createElement("div");
    line.className = "syllable-line";
    const syllablesHTML = card.syllables
      .map((s, j) => `<span class='syllable'>${s}</span>`)
      .join(" ");
    let status = answers[i] === true ? "✅" : answers[i] === false ? "❌" : "";
    line.innerHTML = `
      ${syllablesHTML}
      <button onclick=\"event.stopPropagation(); playSound('${card.word}')\">🔊</button>
      <span class='status'>${status}</span>`;
    back.appendChild(line);
  });
}

function flipCard() {
  document.querySelector(".flashcard").classList.toggle("flipped");
  renderBack();
}

function playSound(word) {
  const audio = new Audio("audio/" + word + ".mp3");
  audio.play();
}

function checkAnswer(input, correct, index) {
  const isCorrect = input.value.trim().toLowerCase() === correct.toLowerCase();
  answers[index] = isCorrect;
  saveProgress(correct, isCorrect);

  if (!isCorrect) {
    if (reviewMode === "normal") cards.push(cards[currentIndex]);
    input.style.border = "2px solid red";
  } else {
    input.style.border = "2px solid limegreen";
  }
}

function prev() {
  if (currentIndex > 0) {
    currentIndex--;
    render();
  }
}

function next() {
  if (currentIndex < cards.length - 1) {
    currentIndex++;
    render();
  }
}

// --- حالت مرور کامل ---
function renderReviewAll() {
  const container = document.querySelector(".container");
  container.innerHTML = `<h2>All Words (Syllables + Sound)</h2>`;

  allWords.forEach((card) => {
    const line = document.createElement("div");
    line.className = "syllable-line";
    const syls = card.syllables
      .map((s, j) => `<span class='syllable'>${s}</span>`)
      .join(" ");
    line.innerHTML = `
      ${syls}
      <button onclick=\"playSound('${card.word}')\">🔊</button>`;
    container.appendChild(line);
  });
}
