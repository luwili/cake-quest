"use strict";

const game = document.querySelector("#game");
const ingredientNames = {
  flour: { name: "Мука", icon: "🌾" },
  eggs: { name: "Яйца", icon: "🥚" },
  milk: { name: "Молоко", icon: "🥛" },
  butter: { name: "Масло", icon: "🧈" },
  berries: { name: "Ягоды", icon: "🍓" }
};
const stageTitles = {
  1: "Кладовая",
  2: "Птичий двор",
  3: "Волшебный луг",
  4: "Кухня",
  5: "Сказочный сад"
};
const state = {
  screen: 0,
  solved: {},
  ingredients: [],
  feedback: "",
  tiles: [4, 1, 5, 2, 0, 3],
  selectedTile: null,
  showReference: false,
  danceStarted: false,
  danceDone: false,
  danceRemaining: 35,
  danceTimer: null,
  surpriseLocation: "в уголке группы"
};
let audioContext = null;
let musicTimer = null;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}

function addIngredients(ids) {
  ids.forEach(function (id) {
    if (!state.ingredients.includes(id)) state.ingredients.push(id);
  });
  updateProgress();
}

function updateProgress() {
  const count = state.ingredients.length;
  const label = document.querySelector("#progress-count");
  const fill = document.querySelector("#progress-fill");
  const bar = document.querySelector("#progress-bar");
  const copy = document.querySelector("#progress-label");
  label.textContent = count + " из 5";
  fill.style.width = (count * 20) + "%";
  bar.setAttribute("aria-valuenow", String(count));
  copy.textContent = count === 5 ? "Все ингредиенты собраны!" : "Ингредиенты в корзине";
}

function basketMarkup() {
  const chips = state.ingredients.map(function (id) {
    const item = ingredientNames[id];
    return '<span class="basket-chip"><span aria-hidden="true">' + item.icon + '</span>' + item.name + '</span>';
  }).join("");
  return '<section class="basket-strip" aria-label="Корзина с продуктами"><span class="basket-label">В корзинке:</span><div class="basket-items">' +
    (chips || '<span class="basket-empty">Пока пусто — отправляемся за первым продуктом!</span>') +
    '</div></section>';
}

function chefKitchen() {
  return '<svg class="kitchen-svg" viewBox="0 0 480 410" role="img" aria-label="Поварёнок в уютной сказочной кухне">' +
    '<defs><linearGradient id="apron" x2="0" y2="1"><stop stop-color="#89ad79"/><stop offset="1" stop-color="#64885f"/></linearGradient></defs>' +
    '<rect x="32" y="28" width="157" height="146" rx="13" fill="#c8ddd3"/><rect x="44" y="40" width="133" height="121" rx="8" fill="#eff4dd"/>' +
    '<path d="M110 40v121M44 100h133" stroke="#fffaf0" stroke-width="9"/><circle cx="148" cy="67" r="19" fill="#f2c66c"/>' +
    '<path d="M36 174h149M30 181h163" stroke="#b97858" stroke-linecap="round" stroke-width="10"/>' +
    '<path d="M50 149c5-24 13-32 21-22 7-12 19-10 23 3 9-9 18-3 20 19" fill="#779b6e"/>' +
    '<path d="M61 183h321v128H61z" fill="#d2a07b"/><path d="M53 181h337v19H53z" fill="#ecc7a6"/>' +
    '<path d="M80 311h282v18H80z" fill="#be8967"/><path d="M92 328v45m257-45v45" stroke="#9c725d" stroke-width="12" stroke-linecap="round"/>' +
    '<ellipse cx="306" cy="181" rx="49" ry="12" fill="#f8ead2"/><path d="M275 179c3-28 8-40 14-48m10 47c1-33 6-48 12-58m8 58c0-27 5-39 12-47" fill="none" stroke="#7f9c72" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="288" cy="129" r="9" fill="#e28b81"/><circle cx="312" cy="115" r="9" fill="#e8c06a"/><circle cx="331" cy="132" r="9" fill="#d97883"/>' +
    '<ellipse cx="226" cy="262" rx="76" ry="66" fill="#f2c6a6"/><path d="M160 269c-7 60 6 88 65 88 57 0 74-25 65-88-11 24-31 32-65 32-34 0-53-8-65-32z" fill="url(#apron)"/>' +
    '<path d="M176 223c-8-38 5-69 50-73 47-4 70 27 61 75-7 36-29 57-58 57-28 0-45-21-53-59z" fill="#ffd9bc"/>' +
    '<path d="M173 214c2-42 16-67 53-68 32-2 55 15 62 56-17-11-27-23-31-37-14 20-39 34-84 40z" fill="#785642"/>' +
    '<path d="M193 148c4-24 18-40 35-40 18 0 31 16 35 40-17-9-49-9-70 0z" fill="#fffdf7"/>' +
    '<path d="M209 126c3-17 10-27 19-27 10 0 16 10 19 27" fill="#fffdf7"/><circle cx="228" cy="118" r="5" fill="#e7b24f"/>' +
    '<ellipse cx="207" cy="216" rx="4" ry="6" fill="#435448"/><ellipse cx="249" cy="216" rx="4" ry="6" fill="#435448"/>' +
    '<path d="M217 237c7 8 18 8 25 0" fill="none" stroke="#bd6e67" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="195" cy="231" r="8" fill="#e99a91" opacity=".58"/><circle cx="260" cy="231" r="8" fill="#e99a91" opacity=".58"/>' +
    '<path d="M204 278l23 25 23-25" fill="#fff7e9"/><circle cx="227" cy="322" r="4" fill="#f2c66c"/>' +
    '<path d="M145 265c-22 2-38 14-39 33 16 6 34-1 47-17m148-16c23 1 38 13 40 31-14 9-34 4-49-13" fill="#ffd9bc" stroke="#f1c2a1" stroke-width="3"/>' +
    '<ellipse cx="361" cy="178" rx="40" ry="10" fill="#f6e7c9"/><path d="M326 176c4-34 16-48 35-48s31 14 35 48" fill="#f4c66b"/><path d="M321 176h80" stroke="#fff4d8" stroke-width="7"/>' +
    '<path d="M342 150h38" stroke="#dba74f" stroke-width="3" stroke-linecap="round"/><circle cx="359" cy="111" r="6" fill="#d97883"/>' +
    '<path d="M93 129c5-7 10-7 15 0m-8-7v14" stroke="#fffdf2" stroke-width="3" stroke-linecap="round"/><path d="M406 72l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#e6ba5d"/>' +
    '</svg>';
}

function strawberryArt(className) {
  return '<svg' + (className ? ' class="' + className + '"' : '') + ' viewBox="0 0 360 200" role="img" aria-label="Красная клубника с зелёными листочками">' +
    '<rect width="360" height="200" rx="14" fill="#fff4e7"/><ellipse cx="180" cy="173" rx="76" ry="12" fill="#d8ddc5"/>' +
    '<path d="M176 56c-8-20-23-27-43-24 6 18 18 27 39 29-19-7-37-2-45 13 18 7 34 3 48-9-10 14-10 28 0 40 12-12 17-25 13-41 4 18 16 30 33 30-1-19-10-32-27-39 17 8 34 5 45-8-15-13-31-15-49-6 9-14 7-29-3-41-13 11-18 26-11 45z" fill="#739969"/>' +
    '<path d="M180 55c-29-2-58 11-67 35-12 33 7 69 67 105 60-36 79-72 67-105-9-24-38-37-67-35z" fill="#df5966"/>' +
    '<path d="M180 59c-20-5-41 2-50 17 19 7 36 4 50-6 14 10 31 13 50 6-9-15-30-22-50-17z" fill="#83a76d"/>' +
    '<g fill="#ffdda0"><ellipse cx="145" cy="93" rx="3.2" ry="5" transform="rotate(-24 145 93)"/><ellipse cx="166" cy="88" rx="3.2" ry="5" transform="rotate(-9 166 88)"/><ellipse cx="190" cy="90" rx="3.2" ry="5" transform="rotate(10 190 90)"/><ellipse cx="211" cy="95" rx="3.2" ry="5" transform="rotate(24 211 95)"/><ellipse cx="135" cy="116" rx="3.2" ry="5" transform="rotate(-20 135 116)"/><ellipse cx="158" cy="112" rx="3.2" ry="5" transform="rotate(-8 158 112)"/><ellipse cx="181" cy="114" rx="3.2" ry="5"/><ellipse cx="203" cy="114" rx="3.2" ry="5" transform="rotate(10 203 114)"/><ellipse cx="225" cy="117" rx="3.2" ry="5" transform="rotate(20 225 117)"/><ellipse cx="146" cy="139" rx="3.2" ry="5" transform="rotate(-15 146 139)"/><ellipse cx="169" cy="139" rx="3.2" ry="5" transform="rotate(-6 169 139)"/><ellipse cx="192" cy="139" rx="3.2" ry="5" transform="rotate(7 192 139)"/><ellipse cx="214" cy="140" rx="3.2" ry="5" transform="rotate(16 214 140)"/><ellipse cx="163" cy="163" rx="3.2" ry="5"/><ellipse cx="188" cy="163" rx="3.2" ry="5" transform="rotate(5 188 163)"/></g>' +
    '<path d="M120 100v100M240 100v100M0 100h360" fill="none" stroke="#fff9ed" stroke-width="3" opacity=".8"/></svg>';
}

function visualForStage(stage) {
  if (stage === 1) {
    return '<div class="shadow-sack" aria-label="Тень от мешочка с мукой"><svg viewBox="0 0 100 100" role="img"><path d="M37 12h26l-4 13c18 9 24 24 25 52 0 10-8 15-34 15S16 87 16 77c1-28 7-43 25-52zm3 8-3 10c-15 8-20 19-21 46 0 5 7 9 34 9s34-4 34-9c-1-27-6-38-21-46l-3-10zM36 20h28v8H36z"/></svg></div>' +
      '<div class="pantry-shelves" aria-label="Полки с банками и мешочками"><div class="pantry-row"><span class="pantry-jar">🍯</span><span class="pantry-jar">🫙</span><span class="pantry-jar">🥫</span></div><div class="pantry-row"><span class="pantry-jar">🍬</span><span class="pantry-jar">🌾</span><span class="pantry-jar">🥛</span></div></div>';
  }
  if (stage === 2) return '<div class="farm-scene"><div class="farm-sky"><span class="farm-cloud">☁</span>🐔<span class="farm-cloud two">☁</span></div><div class="farm-grass"><span>🦆</span><span>🐓</span><span>🪿</span><span>🐦</span></div></div>';
  if (stage === 3) return '<div class="meadow-scene"><span class="meadow-sun" aria-hidden="true">✦</span><span class="cow-large" role="img" aria-label="Корова на лугу">🐄</span><span class="meadow-flowers" aria-hidden="true">🌼 🌷 🌼</span></div>';
  if (stage === 4) return '<div class="bowl-scene"><span class="whisk" aria-hidden="true">🥄</span><div class="bowl" aria-hidden="true">' + (state.solved[4] ? "☁" : "") + '</div><p class="bowl-caption">' + (state.solved[4] ? "Пышный крем готов!" : "Большая миска для крема") + '</p></div>';
  return '<div class="scene-illustration">' + strawberryArt("") + '</div>';
}

function solvedMarkup(stage) {
  const result = {
    1: ["Мука в корзинке!", "Нашли нужный мешочек. Теперь можно отправляться за свежими яйцами."],
    2: ["Яйца готовы!", "Курочка поделилась свежими яичками для праздничного торта."],
    3: ["Молоко и масло готовы!", "Сапожок убрали, а коровка поделилась молоком. Масло тоже отправляется в корзинку."],
    4: ["Крем пышный!", "Вы отлично потрудились: теперь у нас есть нежный крем для торта."],
    5: ["Клубника нашлась!", "Собранная картинка подсказала, чем украсить наш праздничный торт."]
  }[stage];
  const next = stage === 5 ? "На праздничный стол!" : "Дальше";
  return '<div class="success-box" role="status"><h2><span aria-hidden="true">✿</span>' + result[0] + '</h2><p>' + result[1] + '</p><div class="success-actions"><button class="primary-button" type="button" data-action="next">' + next + '<span class="button-arrow" aria-hidden="true">→</span></button></div></div>';
}

function objectButton(name, icon, value, extraClass) {
  const className = ("object-button " + (extraClass || "")).trim();
  return '<button class="' + className + '" type="button" data-action="choose" data-choice="' + value + '"><span class="object-icon" aria-hidden="true">' + icon + '</span><span>' + name + '</span></button>';
}

function flourTask() {
  return '<h2>Какой мешочек нужен?</h2><p class="instruction">Найдите на полке мешок с мукой, который подходит к этой тени, и нажмите на него.</p>' +
    '<div class="answer-grid" role="group" aria-label="Выберите продукт">' +
    objectButton("Мука", "🌾", "flour", "sack-icon") + objectButton("Сахар", "🍚", "sugar", "sack-icon") +
    objectButton("Молоко", "🥛", "milk-choice") + objectButton("Конфеты", "🍬", "candy") + '</div>' +
    '<p class="feedback" id="feedback" role="status">' + escapeHTML(state.feedback) + '</p>';
}

function birdButton(name, icon, value) {
  return '<button class="object-button" type="button" data-action="choose-bird" data-choice="' + value + '"><span class="object-icon" aria-hidden="true">' + icon + '</span><span class="object-name">' + name + '</span></button>';
}

function eggTask() {
  return '<h2>Кто нас зовёт?</h2><p class="instruction">Послушайте голос птицы. Нажмите на ту, что так кудахчет, и она поделится яичками.</p>' +
    '<div class="audio-card"><button class="sound-button" type="button" data-action="chicken-sound" aria-label="Послушать кудахтанье курицы">▶</button><div><strong>Послушать голос</strong><small>Кудахтанье из птичьего двора</small></div></div>' +
    '<div class="answer-grid bird-grid" role="group" aria-label="Какая птица кудахчет?">' +
    birdButton("Курица", "🐔", "chicken") + birdButton("Утка", "🦆", "duck") +
    birdButton("Гусь", "🪿", "goose") + birdButton("Воробей", "🐦", "sparrow") + '</div>' +
    '<p class="feedback" id="feedback" role="status">' + escapeHTML(state.feedback) + '</p>';
}

function itemButton(name, icon, value) {
  return '<button class="object-button item-choice" type="button" data-action="choose-item" data-choice="' + value + '"><span class="object-icon" aria-hidden="true">' + icon + '</span><span>' + name + '</span></button>';
}

function meadowTask() {
  return '<h2>Найди лишний предмет</h2><p class="instruction">Коровка отдаст молоко, если мы уберём предмет, который совсем не подходит для торта. Нажмите на него!</p>' +
    '<div class="item-grid" role="group" aria-label="Что не подходит для торта?">' +
    itemButton("Молоко", "🥛", "milk") + itemButton("Масло", "🧈", "butter") +
    itemButton("Сметана", "🥣", "cream") + itemButton("Резиновый сапог", "🥾", "boot") + '</div>' +
    '<p class="feedback" id="feedback" role="status">' + escapeHTML(state.feedback) + '</p>';
}

function danceTask() {
  if (state.danceDone) return '<h2>Нажми на миску</h2><p class="instruction">Крем уже взбит! Нажмите на большую миску, чтобы добавить его в наш рецепт.</p><button class="secondary-button" type="button" data-action="finish-stage"><span aria-hidden="true">🥣</span>В миске готов крем!</button>';
  const controls = state.danceStarted
    ? '<div class="dance-controls"><div class="dance-progress"><div class="dance-progress-top"><span>Взбиваем весёлый крем!</span><strong id="dance-count">35 сек</strong></div><div class="dance-progress-track"><span id="dance-fill"></span></div></div><div class="move-card"><span aria-hidden="true">🌀</span><div class="dance-caption" id="dance-caption">Крутим ручками, как миксер!</div></div><button class="teacher-skip" type="button" data-action="finish-dance">Закончить разминку</button></div>'
    : '<div class="dance-controls"><button class="primary-button" type="button" data-action="start-dance"><span aria-hidden="true">♪</span>Начать разминку</button><div class="move-card"><span aria-hidden="true">🌀</span><div>Крутим ручками, как миксер, прыгаем как пузырьки и дуем на корж!</div></div></div>';
  return '<h2>Взбиваем пышный крем!</h2><p class="instruction">Все продукты для теста готовы. Вставайте со стульчиков и повторяйте движения под весёлую музыку.</p>' + controls;
}

function puzzleTask() {
  const correct = state.tiles.filter(function (tile, index) { return tile === index; }).length;
  const tiles = state.tiles.map(function (tile, index) {
    const col = tile % 3;
    const row = Math.floor(tile / 3);
    const selected = state.selectedTile === index;
    const isCorrect = tile === index;
    const label = "Часть " + (index + 1) + ", фрагмент " + (tile + 1) + (isCorrect ? ", на своём месте" : "");
    const svg = strawberryArt("").replace('<svg viewBox="0 0 360 200"', '<svg viewBox="' + (col * 120) + ' ' + (row * 100) + ' 120 100"');
    return '<button class="puzzle-tile' + (selected ? ' is-selected' : '') + (isCorrect ? ' is-correct' : '') + '" type="button" data-action="puzzle-tile" data-index="' + index + '" aria-label="' + label + '" aria-pressed="' + selected + '">' +
      svg + '<span class="tile-number" aria-hidden="true">' + (index + 1) + '</span></button>';
  }).join("");
  const reference = '<div class="puzzle-reference"' + (state.showReference ? '' : ' hidden') + '>' + strawberryArt("") + '<span>Так должна выглядеть клубничка.</span></div>';
  return '<h2>Собери клубничку</h2><p class="instruction">Картинка рассыпалась на части. Нажимайте по очереди на два кусочка, чтобы поменять их местами.</p>' +
    '<div class="puzzle-toolbar"><small>На месте: <strong>' + correct + ' из 6</strong></small><button class="text-button" type="button" data-action="toggle-reference">' + (state.showReference ? "Скрыть подсказку" : "Показать картинку") + '</button></div>' +
    '<div class="puzzle-board" role="group" aria-label="Пазл из шести частей">' + tiles + '</div>' + reference +
    '<p class="feedback" id="feedback" role="status">' + escapeHTML(state.feedback || (state.selectedTile === null ? "Выберите первую часть картинки." : "Теперь нажмите на вторую часть.")) + '</p>';
}

function stageContent(stage) {
  if (state.solved[stage]) return solvedMarkup(stage);
  if (stage === 1) return flourTask();
  if (stage === 2) return eggTask();
  if (stage === 3) return meadowTask();
  if (stage === 4) return danceTask();
  return puzzleTask();
}

function introMarkup() {
  return '<section class="intro-card"><div class="intro-copy"><span class="eyebrow">Сказочное приключение</span><h1>Секретный рецепт <em>торта для мамы</em></h1>' +
    '<p class="intro-lead">Ребята, беда! Скоро День матери, а хитрый сквозняк унёс продукты по разным сказочным комнатам. Помогите поварёнку собрать пять ингредиентов и испечь самый вкусный торт!</p>' +
    '<button class="primary-button" type="button" data-action="start">В путь!<span class="button-arrow" aria-hidden="true">→</span></button>' +
    '<p class="tiny-note">Пять заданий, одна общая радость и много любви.</p></div><div class="intro-art"><div class="floating-tag tag-top"><span aria-hidden="true">✦</span>Маленьким помощникам</div>' +
    chefKitchen() + '<div class="floating-tag tag-bottom"><span aria-hidden="true">♡</span>Рецепт с секретом</div></div></section>';
}

function stageMarkup(stage) {
  return '<section class="quest-card"><div class="quest-heading"><div class="quest-title"><span class="eyebrow">Собираем ингредиенты</span><h1>' + stageTitles[stage] + '</h1></div>' +
    '<div class="step-count"><strong>' + stage + '</strong><span>из 5 заданий</span></div></div><div class="quest-layout">' +
    '<section class="scene-panel" aria-label="Сказочная комната"><h2 class="scene-heading">' + stageTitles[stage] + '</h2><div class="scene-illustration">' + visualForStage(stage) + '</div></section>' +
    '<section class="task-panel">' + stageContent(stage) + '</section></div></section>' + basketMarkup();
}

function cakeIllustration() {
  return '<svg class="cake-svg" viewBox="0 0 400 370" role="img" aria-label="Праздничный торт со свечами и цветами">' +
    '<ellipse cx="200" cy="335" rx="145" ry="19" fill="#d9ddc5"/><path d="M72 289h256l-20 37H91z" fill="#e3b46f"/><ellipse cx="200" cy="289" rx="128" ry="25" fill="#fff6e4"/>' +
    '<path d="M99 223h202l-16 66H115z" fill="#d87580"/><ellipse cx="200" cy="223" rx="101" ry="20" fill="#fff1e6"/><path d="M113 256c22-14 44 12 67-1s42 11 64-1 39 7 51-1" fill="none" stroke="#fff6e8" stroke-width="9" stroke-linecap="round"/>' +
    '<path d="M132 169h136l-12 54h-112z" fill="#edc875"/><ellipse cx="200" cy="169" rx="68" ry="16" fill="#fff8e8"/><path d="M142 192c16-11 29 9 44-1s28 8 42-1 24 6 34-1" fill="none" stroke="#fffdf5" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M161 130h78l-7 39h-64z" fill="#e59592"/><ellipse cx="200" cy="130" rx="39" ry="12" fill="#fff5e8"/>' +
    '<path d="M177 102v27m23-34v35m23-28v29" stroke="#7c9c72" stroke-width="8" stroke-linecap="round"/><path d="M177 94c-8-10 3-17 0-25m23 18c-8-10 4-17 0-25m23 33c-8-10 4-17 0-25" fill="none" stroke="#e7b44d" stroke-width="5" stroke-linecap="round"/>' +
    '<g fill="#d97883"><circle cx="127" cy="220" r="10"/><circle cx="273" cy="220" r="10"/><circle cx="153" cy="164" r="8"/><circle cx="247" cy="164" r="8"/></g>' +
    '<g fill="#f5c968"><circle cx="127" cy="220" r="3"/><circle cx="273" cy="220" r="3"/><circle cx="153" cy="164" r="2.5"/><circle cx="247" cy="164" r="2.5"/></g>' +
    '<path d="M186 296c-10-12-25-2-17 8 6 7 17 14 17 14s11-7 17-14c8-10-7-20-17-8z" fill="#d97883"/>' +
    '<path d="M70 138l4 9 9 4-9 4-4 9-4-9-9-4 9-4zM324 112l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#e4b351"/>' +
    '<path d="M337 182c8-10 19-9 23 0-4 10-15 10-23 0zm-2 0c-8-10-19-9-23 0 4 10 15 10 23 0z" fill="#eaa0a0"/><circle cx="336" cy="182" r="4" fill="#e6b64d"/>' +
    '<path d="M63 262c8-10 19-9 23 0-4 10-15 10-23 0zm-2 0c-8-10-19-9-23 0 4 10 15 10 23 0z" fill="#eaa0a0"/><circle cx="62" cy="262" r="4" fill="#e6b64d"/></svg>';
}

function endingMarkup() {
  return '<section class="ending-card"><div class="ending-copy"><span class="eyebrow">Вот и готово!</span><h1>С Днём матери!</h1>' +
    '<p>Ура! Торт готов. А главный секретный ингредиент в нём — ваша любовь к мамам. Вы замечательная команда!</p><div class="love-reveal"><span aria-hidden="true">♡</span>Самое важное — любовь</div>' +
    '<label class="location-label" for="surprise-location">Где спрятан сюрприз для мам?</label><input class="location-input" id="surprise-location" type="text" maxlength="80" value="' + escapeHTML(state.surpriseLocation) + '" autocomplete="off">' +
    '<div class="location-preview" id="location-preview">Поведите ребят к сюрпризу: ' + escapeHTML(state.surpriseLocation) + '.</div><button class="soft-button restart-final" type="button" data-action="reset">Сыграть ещё раз</button></div>' +
    '<div class="ending-art"><div class="confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>' + cakeIllustration() + '<div class="floating-tag final-tag"><span aria-hidden="true">🍓</span>Торт с любовью</div></div></section>';
}

function render() {
  if (state.screen === 0) game.innerHTML = introMarkup() + basketMarkup();
  else if (state.screen >= 1 && state.screen <= 5) game.innerHTML = stageMarkup(state.screen);
  else game.innerHTML = endingMarkup();
  updateProgress();
  if (state.danceStarted && !state.danceDone) updateDanceDisplay();
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function tone(frequency, start, duration, type, volume) {
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type || "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume || 0.08, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playSuccess() {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  [523, 659, 784].forEach(function (frequency, index) {
    tone(frequency, now + index * 0.095, 0.25, "sine", 0.055);
  });
}

function playChickenSound() {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const clucks = [
    { at: 0, from: 850, to: 430, length: 0.14 },
    { at: 0.2, from: 700, to: 360, length: 0.16 },
    { at: 0.48, from: 920, to: 440, length: 0.12 },
    { at: 0.68, from: 740, to: 380, length: 0.18 },
    { at: 1.03, from: 820, to: 420, length: 0.15 }
  ];
  clucks.forEach(function (cluck) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(cluck.from, now + cluck.at);
    oscillator.frequency.exponentialRampToValueAtTime(cluck.to, now + cluck.at + cluck.length);
    gain.gain.setValueAtTime(0.0001, now + cluck.at);
    gain.gain.exponentialRampToValueAtTime(0.045, now + cluck.at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cluck.at + cluck.length);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + cluck.at);
    oscillator.stop(now + cluck.at + cluck.length + 0.02);
  });
}

function stopDanceMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}

function startDanceMusic() {
  stopDanceMusic();
  const context = getAudioContext();
  if (!context) return;
  const melody = [392, 494, 587, 494, 440, 523, 659, 523];
  let note = 0;
  musicTimer = window.setInterval(function () {
    const current = getAudioContext();
    if (!current) return;
    tone(melody[note % melody.length], current.currentTime, 0.24, "sine", 0.025);
    note += 1;
  }, 330);
}

function startDance() {
  state.danceStarted = true;
  state.danceRemaining = 35;
  startDanceMusic();
  render();
  state.danceTimer = window.setInterval(function () {
    state.danceRemaining = Math.max(0, state.danceRemaining - 1);
    updateDanceDisplay();
    if (state.danceRemaining <= 0) finishDance();
  }, 1000);
}

function updateDanceDisplay() {
  const count = document.querySelector("#dance-count");
  const fill = document.querySelector("#dance-fill");
  const caption = document.querySelector("#dance-caption");
  if (!count || !fill) return;
  count.textContent = state.danceRemaining + " сек";
  fill.style.width = ((35 - state.danceRemaining) / 35 * 100) + "%";
  if (caption) {
    const elapsed = 35 - state.danceRemaining;
    caption.textContent = elapsed < 12 ? "Крутим ручками, как миксер!" : (elapsed < 24 ? "Прыгаем, как пузырьки в тесте!" : "Дуем на горячий корж!");
  }
}

function finishDance() {
  if (state.danceTimer !== null) {
    window.clearInterval(state.danceTimer);
    state.danceTimer = null;
  }
  stopDanceMusic();
  state.danceDone = true;
  state.feedback = "";
  render();
}

function completeStage(stage, ingredients) {
  state.solved[stage] = true;
  state.feedback = "";
  if (ingredients) addIngredients(ingredients);
  playSuccess();
  render();
}

function resetGame() {
  if (state.screen > 0 && !window.confirm("Начать квест заново? Прогресс корзинки сбросится.")) return;
  if (state.danceTimer !== null) window.clearInterval(state.danceTimer);
  state.danceTimer = null;
  stopDanceMusic();
  state.screen = 0;
  state.solved = {};
  state.ingredients = [];
  state.feedback = "";
  state.tiles = [4, 1, 5, 2, 0, 3];
  state.selectedTile = null;
  state.showReference = false;
  state.danceStarted = false;
  state.danceDone = false;
  state.danceRemaining = 35;
  render();
  game.focus();
}

document.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "start") {
    state.screen = 1;
    state.feedback = "";
    render();
  } else if (action === "reset") {
    resetGame();
  } else if (action === "next") {
    state.screen += 1;
    state.feedback = "";
    state.selectedTile = null;
    if (state.screen > 5) state.screen = 6;
    render();
    game.focus();
  } else if (action === "choose") {
    if (button.dataset.choice === "flour") completeStage(1, ["flour"]);
    else {
      state.feedback = "Присмотритесь к форме и размеру: тень оставил именно мешочек с мукой.";
      render();
    }
  } else if (action === "chicken-sound") {
    playChickenSound();
  } else if (action === "choose-bird") {
    if (button.dataset.choice === "chicken") completeStage(2, ["eggs"]);
    else {
      state.feedback = "Послушайте ещё раз: кто из птиц кудахчет?";
      render();
    }
  } else if (action === "choose-item") {
    if (button.dataset.choice === "boot") completeStage(3, ["milk", "butter"]);
    else {
      state.feedback = "Этот продукт может пригодиться для торта. Найдите на лугу то, что совсем не съедобно.";
      render();
    }
  } else if (action === "start-dance") {
    startDance();
  } else if (action === "finish-dance") {
    finishDance();
  } else if (action === "finish-stage") {
    completeStage(4, []);
  } else if (action === "puzzle-tile") {
    const index = Number(button.dataset.index);
    state.feedback = "";
    if (state.selectedTile === null) state.selectedTile = index;
    else if (state.selectedTile === index) state.selectedTile = null;
    else {
      const previous = state.tiles[state.selectedTile];
      state.tiles[state.selectedTile] = state.tiles[index];
      state.tiles[index] = previous;
      state.selectedTile = null;
      const solved = state.tiles.every(function (tile, tileIndex) { return tile === tileIndex; });
      if (solved) {
        completeStage(5, ["berries"]);
        return;
      }
    }
    render();
  } else if (action === "toggle-reference") {
    state.showReference = !state.showReference;
    render();
  }
});

game.addEventListener("input", function (event) {
  if (event.target.id === "surprise-location") {
    state.surpriseLocation = event.target.value.trim() || "место, которое выберет воспитатель";
    const preview = document.querySelector("#location-preview");
    if (preview) preview.textContent = "Поведите ребят к сюрпризу: " + state.surpriseLocation + ".";
  }
});

render();
