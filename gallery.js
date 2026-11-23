const memories = [
  { image: `${import.meta.env.BASE_URL}gallery/memory-01.png`, title: "Sept 7, 2024", description: "The day It started how I'm crazy to your voice" },
  { image: `${import.meta.env.BASE_URL}gallery/memory-02.png`, title: "September 2024", description: "" },
  { image: `${import.meta.env.BASE_URL}gallery/memory-03.png`, title: "So Cute >.<", description: "Remember this? we used to do this everytime we play Heart Emote" },
  { image: `${import.meta.env.BASE_URL}gallery/memory-04.png`, title: "I MISS YOU BABI!!", description: "" },
  { image: `${import.meta.env.BASE_URL}gallery/memory-05.png`, title: "PUBG Players Cutiee", description: "We used to play PUBG too bebe pero busy ka naman na:<" },
  { image: `${import.meta.env.BASE_URL}gallery/memory-06.png`, title: "PUBG Players Cutiee", description: "We used to play PUBG too bebe pero busy ka naman na:<" },
  { image: `${import.meta.env.BASE_URL}gallery/memory-07.png`, title: "I really miss playing PUBG with you my love.", description: "Sana makapag play ulit tayo gaya dati:<" },
  { image: `${import.meta.env.BASE_URL}gallery/memory-08.png`, title: "I really miss playing PUBG with you my love.", description: "Sana makapag play ulit tayo gaya dati:<" },
];

const menu = document.getElementById("infiniteMenu");
const stage = document.getElementById("menuStage");
const ring = document.getElementById("menuRing");
const info = document.getElementById("menuInfo");
const title = document.getElementById("memoryTitle");
const description = document.getElementById("memoryDescription");
const count = document.getElementById("menuCount");
const dialog = document.getElementById("memoryDialog");
const dialogImage = document.getElementById("dialogImage");
const dialogCaption = document.getElementById("dialogCaption");
const viewButton = document.getElementById("viewMemory");
const step = 360 / memories.length;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const tiles = [];

let rotation = 0;
let targetRotation = 0;
let radius = 360;
let pointerId = null;
let startX = 0;
let startRotation = 0;
let didDrag = false;
let suppressClick = false;
let activeIndex = -1;
let frame = 0;

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function selectedIndex(angle) {
  return modulo(Math.round(-angle / step), memories.length);
}

function updateSelected(index) {
  if (index === activeIndex) return;
  activeIndex = index;
  const memory = memories[index];
  title.textContent = memory.title;
  description.textContent = memory.description;
  count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(memories.length).padStart(2, "0")}`;
  viewButton.setAttribute("aria-label", `View photo: ${memory.title}`);
  tiles.forEach((tile, tileIndex) => {
    const active = tileIndex === index;
    tile.classList.toggle("is-active", active);
    tile.setAttribute("aria-pressed", String(active));
  });
}

function resizeMenu() {
  radius = Math.max(215, Math.min(440, menu.clientWidth * 0.43));
  menu.style.setProperty("--menu-radius", `${radius}px`);
}

function openMemory(index = activeIndex) {
  const memory = memories[index];
  dialogImage.src = memory.image;
  dialogImage.alt = memory.title;
  dialogCaption.textContent = memory.description;
  dialog.showModal();
}

memories.forEach((memory, index) => {
  const tile = document.createElement("button");
  tile.className = "menu-tile";
  tile.type = "button";
  tile.style.setProperty("--tile-angle", `${index * step}deg`);
  tile.setAttribute("aria-label", `Select ${memory.title}`);
  tile.setAttribute("aria-pressed", "false");

  const image = document.createElement("img");
  image.src = memory.image;
  image.alt = "";
  image.draggable = false;
  image.loading = index < 3 ? "eager" : "lazy";
  tile.append(image);
  tile.addEventListener("click", () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (index === activeIndex) openMemory(index);
    else targetRotation = -index * step + 360 * Math.round((targetRotation + index * step) / 360);
  });
  ring.append(tile);
  tiles.push(tile);
});

function rotateBy(direction) {
  targetRotation += direction * step;
}

document.getElementById("previousMemory").addEventListener("click", () => rotateBy(1));
document.getElementById("nextMemory").addEventListener("click", () => rotateBy(-1));
viewButton.addEventListener("click", () => openMemory());
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

stage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || event.target.closest(".menu-arrow, .view-memory")) return;
  pointerId = event.pointerId;
  startX = event.clientX;
  startRotation = targetRotation;
  didDrag = false;
  stage.setPointerCapture(pointerId);
  stage.classList.add("is-dragging");
});

stage.addEventListener("pointermove", (event) => {
  if (event.pointerId !== pointerId) return;
  const delta = event.clientX - startX;
  if (Math.abs(delta) > 5) didDrag = true;
  if (!didDrag) return;
  targetRotation = startRotation + (delta / Math.max(stage.clientWidth, 1)) * 220;
  info.classList.add("is-moving");
});

function finishDrag(event) {
  if (event.pointerId !== pointerId) return;
  pointerId = null;
  stage.classList.remove("is-dragging");
  if (didDrag) {
    targetRotation = Math.round(targetRotation / step) * step;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
  }
}

stage.addEventListener("pointerup", finishDrag);
stage.addEventListener("pointercancel", finishDrag);

menu.addEventListener("keydown", (event) => {
  if (event.target !== menu) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    rotateBy(1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    rotateBy(-1);
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openMemory();
  }
});

let lastAutoAdvance = performance.now();
function animate(now) {
  const distance = targetRotation - rotation;
  rotation += distance * (reduceMotion ? 0.28 : 0.085);
  if (Math.abs(distance) < 0.04) rotation = targetRotation;
  ring.style.setProperty("--menu-rotation", `${rotation}deg`);

  const nextIndex = selectedIndex(targetRotation);
  updateSelected(nextIndex);
  if (Math.abs(distance) < 0.5) info.classList.remove("is-moving");

  if (!reduceMotion && pointerId === null && !dialog.open && !document.hidden && now - lastAutoAdvance > 3000) {
    rotateBy(-1);
    lastAutoAdvance = now;
  }
  frame = requestAnimationFrame(animate);
}

resizeMenu();
new ResizeObserver(resizeMenu).observe(menu);
updateSelected(0);
requestAnimationFrame(() => menu.classList.add("is-ready"));
frame = requestAnimationFrame(animate);

window.addEventListener("pagehide", () => cancelAnimationFrame(frame), { once: true });
