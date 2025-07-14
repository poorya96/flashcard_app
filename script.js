let cards = [];
let currentIndex = 0;
const pageSize = 4;
let answers = [null, null, null, null]; // وضعیت درستی جواب‌ها

// --- شافل کردن لیست لغات ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// --- بارگذاری داده‌ها ---
fetch("data.json")
  .then((res) => res.json())
  .then((data) => {
    shuffle(data); // شافل کنیم
    cards = [];
    for (let i = 0; i < data.length; i += 4) {
      cards.push(data.slice(i, i + 4));
    }
    render();
  });

// --- رندر کارت فعلی ---
function render() {
  const front = document.getElementById("card-front");
  const back = document.getElementById("card-back");
  const counter = document.getElementById("card-counter");

  const group = cards[currentIndex];
  front.innerHTML = "";
  back.innerHTML = "";
  answers = [null, null, null, null];

  const flashcard = document.querySelector(".flashcard");
  flashcard.classList.remove("flipped");
  flashcard.onclick = null;

  // جلوی کارت (input + صوت)
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

  // پشت کارت (بخش‌بندی + وضعیت)
  renderBack();

  // شمارنده
  counter.innerText = `Card ${currentIndex + 1} of ${cards.length}`;
}

// --- رندر پشت کارت با وضعیت ✅❌ ---
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

    let status = "";
    if (answers[i] === true) status = "✅";
    else if (answers[i] === false) status = "❌";

    line.innerHTML = `${syllablesHTML} <span class="status">${status}</span>`;
    back.appendChild(line);
  });
}

// --- برگرداندن کارت ---
function flipCard() {
  const flashcard = document.querySelector(".flashcard");
  flashcard.classList.toggle("flipped");
  renderBack();
}

// --- پخش صدا ---
function playSound(word) {
  const audio = new Audio("audio/" + word + ".mp3");
  audio.play();
}

// --- بررسی پاسخ کاربر ---
function checkAnswer(input, correct, index) {
  const isCorrect = input.value.trim().toLowerCase() === correct.toLowerCase();
  answers[index] = isCorrect;

  if (!isCorrect) {
    cards.push(cards[currentIndex]); // کارت اشتباه دوباره به آخر اضافه میشه
    input.style.border = "2px solid red";
  } else {
    input.style.border = "2px solid limegreen";
  }
}

// --- کارت قبلی ---
function prev() {
  if (currentIndex > 0) {
    currentIndex--;
    render();
  }
}

// --- کارت بعدی ---
function next() {
  if (currentIndex < cards.length - 1) {
    currentIndex++;
    render();
  }
}
