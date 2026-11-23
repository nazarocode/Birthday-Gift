const canvas = document.getElementById("liquidCanvas");
const context = canvas?.getContext("2d", { alpha: true });
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const colors = [
  { r: 0, g: 95, b: 250 },
  { r: 59, g: 130, b: 246 },
  { r: 59, g: 130, b: 246 },
];
const autoSpeed = 0.5;
const autoIntensity = 2.2;
const cursorSize = 100;
const mouseForce = 20;

if (canvas && context) {
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frame = 0;
  let previousTime = 0;
  let pointerActive = false;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const bursts = [];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25) * 0.62;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    if (reduceMotion) draw(0, true);
  }

  function drawFlow(time, index) {
    const color = colors[index];
    const phase = index * 2.2;
    const scale = Math.max(width, height);
    let centerX = width * (0.18 + index * 0.31) + Math.sin(time * 0.00017 * autoSpeed + phase) * width * 0.11;
    let centerY = height * (0.33 + (index % 2) * 0.35) + Math.cos(time * 0.00013 * autoSpeed + phase) * height * 0.1;
    const radiusX = scale * (0.34 + index * 0.025);
    const radiusY = scale * (0.22 + index * 0.018);
    if (pointerActive) {
      const dx = pointer.x - centerX;
      const dy = pointer.y - centerY;
      const influence = Math.exp(-(dx * dx + dy * dy) / (cursorSize * cursorSize * 8)) * (mouseForce / 100);
      centerX -= dx * influence;
      centerY -= dy * influence;
    }
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 0.48);
    const brightness = Math.min(0.72, 0.3 + autoIntensity * 0.08);
    gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${brightness})`);
    gradient.addColorStop(0.35, `rgba(${color.r},${color.g},${color.b},${brightness * 0.62})`);
    gradient.addColorStop(0.68, `rgba(${color.r},${color.g},${color.b},${brightness * 0.28})`);
    gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);

    context.save();
    context.translate(centerX, centerY);
    context.rotate(Math.sin(time * 0.0001 * autoSpeed + phase) * 0.35);
    context.scale(radiusX / (scale * 0.48), radiusY / (scale * 0.48));
    context.translate(-centerX, -centerY);
    context.fillStyle = gradient;
    context.beginPath();

    const points = [];
    const pointCount = 28;
    for (let point = 0; point < pointCount; point++) {
      const angle = (point / pointCount) * Math.PI * 2;
      const wobble = 1 + Math.sin(angle * 3 + time * 0.00022 * autoSpeed + phase) * 0.16
        + Math.cos(angle * 5 - time * 0.00016 * autoSpeed + phase) * 0.09;
      points.push({
        x: centerX + Math.cos(angle) * scale * 0.48 * wobble,
        y: centerY + Math.sin(angle) * scale * 0.48 * wobble,
      });
    }
    const midpoint = (first, second) => ({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 });
    const firstMiddle = midpoint(points[pointCount - 1], points[0]);
    context.moveTo(firstMiddle.x, firstMiddle.y);
    for (let point = 0; point < pointCount; point++) {
      const current = points[point];
      const next = points[(point + 1) % pointCount];
      const middle = midpoint(current, next);
      context.quadraticCurveTo(current.x, current.y, middle.x, middle.y);
    }
    context.closePath();
    context.shadowColor = `rgba(${color.r},${color.g},${color.b},.28)`;
    context.shadowBlur = scale * 0.045;
    context.fill();
    context.restore();
  }

  function drawPointerFlow() {
    if (!pointerActive) return;
    pointer.x += (pointer.targetX - pointer.x) * 0.12;
    pointer.y += (pointer.targetY - pointer.y) * 0.12;
    const radius = cursorSize;
    const gradient = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);
    gradient.addColorStop(0, "rgba(0,95,250,.34)");
    gradient.addColorStop(0.35, "rgba(59,130,246,.2)");
    gradient.addColorStop(1, "rgba(59,130,246,0)");
    context.fillStyle = gradient;
    context.fillRect(pointer.x - radius, pointer.y - radius, radius * 2, radius * 2);
  }

  function drawBursts(delta) {
    for (let index = bursts.length - 1; index >= 0; index--) {
      const burst = bursts[index];
      burst.age += delta;
      const progress = burst.age / 0.9;
      if (progress >= 1) {
        bursts.splice(index, 1);
        continue;
      }
      context.beginPath();
      context.ellipse(burst.x, burst.y, 12 + progress * 130, 8 + progress * 70, burst.angle, 0, Math.PI * 2);
      context.strokeStyle = `rgba(59,130,246,${(1 - progress) * 0.36})`;
      context.lineWidth = 3 * (1 - progress);
      context.stroke();
    }
  }

  function draw(timestamp, still = false) {
    frame = 0;
    const delta = Math.min(0.04, (timestamp - (previousTime || timestamp)) / 1000);
    previousTime = timestamp;

    context.fillStyle = "rgba(8,13,25,.25)";
    context.fillRect(0, 0, width, height);
    context.save();
    context.globalCompositeOperation = "screen";
    colors.forEach((_, index) => drawFlow(timestamp, index));
    drawPointerFlow();
    drawBursts(delta);
    context.restore();

    if (!still && (!reduceMotion || bursts.length)) {
      frame = requestAnimationFrame(draw);
    }
  }

  function schedule() {
    if (!frame && !reduceMotion) frame = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointerActive = true;
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    schedule();
  }, { passive: true });
  window.addEventListener("pointerdown", (event) => {
    bursts.push({ x: event.clientX, y: event.clientY, age: 0, angle: Math.random() });
    schedule();
  }, { passive: true });
  window.addEventListener("blur", () => { pointerActive = false; });
  document.documentElement.addEventListener("pointerleave", () => { pointerActive = false; });
  window.addEventListener("pagehide", () => cancelAnimationFrame(frame), { once: true });

  resize();
  if (!reduceMotion) schedule();
}
