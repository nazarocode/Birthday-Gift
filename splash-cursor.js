const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d", { alpha: true });

if (context && !reducedMotion) {
  const layer = document.createElement("div");
  layer.className = "splash-cursor";
  layer.setAttribute("aria-hidden", "true");
  canvas.className = "splash-cursor__canvas";
  layer.append(canvas);
  document.body.append(layer);

  const color = [0, 13, 168];
  const particles = [];
  const ripples = [];
  const pointer = { x: 0, y: 0, previousX: 0, previousY: 0, active: false };
  const maxParticles = 260;
  let pixelRatio = 1;
  let animationFrame = 0;

  function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(window.innerWidth * pixelRatio);
    canvas.height = Math.round(window.innerHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function addParticle(x, y, angle, speed, size) {
    const swirl = (Math.random() - 0.5) * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed + swirl,
      vy: Math.sin(angle) * speed + swirl,
      size,
      age: 0,
      lifetime: 0.5 + Math.random() * 0.55,
      spin: (Math.random() - 0.5) * 0.16,
      angle: Math.random() * Math.PI * 2,
    });
    if (particles.length > maxParticles) particles.splice(0, particles.length - maxParticles);
  }

  function scheduleFrame() {
    if (!animationFrame) animationFrame = requestAnimationFrame(draw);
  }

  function onPointerMove(event) {
    const x = event.clientX;
    const y = event.clientY;
    pointer.active = true;
    pointer.x = x;
    pointer.y = y;

    const dx = x - pointer.previousX;
    const dy = y - pointer.previousY;
    const distance = Math.hypot(dx, dy);
    if (distance > 2) {
      const steps = Math.min(12, Math.ceil(distance / 12));
      const direction = Math.atan2(dy, dx) + Math.PI;
      for (let step = 0; step < steps; step++) {
        const progress = (step + 1) / steps;
        const offsetX = pointer.previousX + dx * progress;
        const offsetY = pointer.previousY + dy * progress;
        addParticle(
          offsetX + (Math.random() - 0.5) * 10,
          offsetY + (Math.random() - 0.5) * 10,
          direction + (Math.random() - 0.5) * 1.5,
          0.3 + Math.random() * 1.3,
          5 + Math.random() * 13
        );
      }
    }

    pointer.previousX = x;
    pointer.previousY = y;
    scheduleFrame();
  }

  function onPointerDown(event) {
    pointer.active = true;
    pointer.x = pointer.previousX = event.clientX;
    pointer.y = pointer.previousY = event.clientY;
    ripples.push({ x: pointer.x, y: pointer.y, age: 0 });

    for (let index = 0; index < 28; index++) {
      const angle = (index / 28) * Math.PI * 2 + Math.random() * 0.25;
      addParticle(pointer.x, pointer.y, angle, 1 + Math.random() * 5, 5 + Math.random() * 15);
    }
    scheduleFrame();
  }

  function onPointerLeave() {
    pointer.active = false;
    scheduleFrame();
  }

  function drawParticle(particle, delta) {
    particle.age += delta;
    const progress = particle.age / particle.lifetime;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
    particle.angle += particle.spin;

    const opacity = Math.max(0, 1 - progress);
    const radius = particle.size * (0.45 + progress * 0.75);
    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(particle.angle);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity * 0.3})`);
    gradient.addColorStop(0.55, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity * 0.15})`);
    gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(0, 0, radius * 0.72, radius, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return progress < 1;
  }

  function draw(now) {
    animationFrame = 0;
    const delta = Math.min(0.04, (now - (draw.lastTime || now)) / 1000);
    draw.lastTime = now;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.splice(0, particles.length, ...particles.filter((particle) => drawParticle(particle, delta)));

    for (let index = ripples.length - 1; index >= 0; index--) {
      const ripple = ripples[index];
      ripple.age += delta;
      const progress = ripple.age / 0.7;
      if (progress >= 1) {
        ripples.splice(index, 1);
        continue;
      }
      context.beginPath();
      context.arc(ripple.x, ripple.y, 8 + progress * 55, 0, Math.PI * 2);
      context.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(1 - progress) * 0.3})`;
      context.lineWidth = 2 * (1 - progress);
      context.stroke();
    }

    if (pointer.active) {
      const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 28);
      glow.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`);
      glow.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
      context.fillStyle = glow;
      context.fillRect(pointer.x - 28, pointer.y - 28, 56, 56);
    }

    if (particles.length || ripples.length || pointer.active) scheduleFrame();
    else draw.lastTime = 0;
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("blur", onPointerLeave);
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  resize();
}
