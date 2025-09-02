<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let particleCount = 150;
  export let particleSize = 8;
  export let colors = [
    "#1E40AF",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
  ];
  export let duration = 3000;
  export let particleSpeed = 1.5;
  export let spread = 100;
  export let angle = 90;

  let confettiCanvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let particles = [];
  let animationFrame: number;
  let startTime: number;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    angle: number;
    angularSpeed: number;
    rotationX: number;
    rotationY: number;
    opacity: number;
  }

  onMount(() => {
    if (!confettiCanvas) return;

    ctx = confettiCanvas.getContext("2d");
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    createParticles();
    startTime = Date.now();
    animate();

    // Handle window resize
    const handleResize = () => {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });

  function createParticles() {
    particles = [];
    const centerX = confettiCanvas.width / 2;
    const centerY = confettiCanvas.height * 0.6; // Slightly above center

    for (let i = 0; i < particleCount; i++) {
      // Calculate initial angle based on spread parameter
      const initialAngle =
        (angle - spread / 2 + Math.random() * spread) * (Math.PI / 180);

      // Calculate speed with some randomization
      const speed = particleSpeed * (0.7 + Math.random() * 0.6);

      const particle: Particle = {
        x: centerX,
        y: centerY,
        vx: Math.cos(initialAngle) * speed * (0.5 + Math.random()),
        vy: -Math.sin(initialAngle) * speed * (0.5 + Math.random()),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: particleSize * (0.5 + Math.random()),
        angle: Math.random() * 360,
        angularSpeed: (Math.random() - 0.5) * 15,
        rotationX: Math.random() < 0.5 ? 1 : 0.2,
        rotationY: Math.random() < 0.5 ? 1 : 0.2,
        opacity: 1,
      };

      particles.push(particle);
    }
  }

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    // Update and draw each particle
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Apply gravity over time
      p.vy += 0.08;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Update rotation
      p.angle += p.angularSpeed;

      // Update opacity based on progress
      p.opacity = 1 - progress;

      // Draw the particle
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.scale(p.rotationX, p.rotationY);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      // Draw a rectangle for confetti piece
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

      ctx.restore();
    }

    // Continue animation if not finished
    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    }
  }
</script>

<canvas
  bind:this={confettiCanvas}
  class="fixed inset-0 pointer-events-none z-50"
></canvas>
