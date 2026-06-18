/**
 * TerraTrace Live Forest Canopy Wallpaper Particle Engine
 * Features mouse-interactive particle physics (fluid-like repulsion)
 * where glowing fireflies smoothly scatter away from the cursor
 * and ease back into their natural upward drift.
 */
export function initWallpaper() {
  const canvas = document.getElementById('forest-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId = null;
  let particles = [];
  const particleCount = 90; // Doubled for high visual density and 60fps performance

  // Mouse state tracking
  const mouse = {
    x: null,
    y: null,
    radius: 130 // Interaction radius in pixels
  };

  function handleMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function handleMouseLeave() {
    mouse.x = null;
    mouse.y = null;
  }

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseleave', handleMouseLeave);

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Firefly {
    constructor(isInitial = false) {
      this.x = Math.random() * canvas.width;
      // Distribute evenly vertically on load, otherwise spawn at bottom
      this.y = isInitial ? Math.random() * canvas.height : canvas.height + 20;
      this.radius = Math.random() * 3.5 + 1.5;
      
      // Natural float speed variables
      this.speedY = Math.random() * 0.38 + 0.12;
      this.speedX = Math.random() * 0.16 - 0.08;
      
      // Current velocity vectors
      this.vx = this.speedX;
      this.vy = -this.speedY;
      
      this.opacity = Math.random() * 0.45 + 0.18;
      this.baseOpacity = this.opacity;
      
      // Sway parameters
      this.swaySpeed = Math.random() * 0.007 + 0.003;
      this.swayOffset = Math.random() * Math.PI * 2;
    }

    update(time) {
      // 1. Calculate base natural velocity (upward float + horizontal wave sway)
      let targetVx = this.speedX + Math.sin(time * this.swaySpeed + this.swayOffset) * 0.18;
      let targetVy = -this.speedY;

      // 2. Add mouse repulsion physics
      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          // Force is strongest when close to the center of the cursor
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          
          // Add smooth push vectors (stronger multiplier for responsive feedback)
          targetVx += Math.cos(angle) * force * 3.2;
          targetVy += Math.sin(angle) * force * 3.2;
        }
      }

      // 3. Smoothly interpolate velocity to avoid sudden snaps
      this.vx += (targetVx - this.vx) * 0.075;
      this.vy += (targetVy - this.vy) * 0.075;

      // 4. Apply velocity to coordinates
      this.x += this.vx;
      this.y += this.vy;

      // Subtle opacity breathing effect over time
      this.opacity = this.baseOpacity * (0.75 + Math.sin(time * 0.002 + this.swayOffset) * 0.25);

      // Reset when particle goes completely off-screen
      if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 20;
        this.radius = Math.random() * 3.5 + 1.5;
        this.speedY = Math.random() * 0.38 + 0.12;
        this.speedX = Math.random() * 0.16 - 0.08;
        this.vx = this.speedX;
        this.vy = -this.speedY;
        this.opacity = Math.random() * 0.45 + 0.18;
        this.baseOpacity = this.opacity;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      
      // Glow style (mint green / gold theme highlight)
      ctx.fillStyle = `rgba(167, 243, 208, ${this.opacity})`;
      ctx.shadowBlur = this.radius * 3.5;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.75)';
      ctx.fill();
    }
  }

  // Pre-populate particles across screen height
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Firefly(true));
  }

  function animate(timestamp) {
    ctx.shadowBlur = 0; // Performance optimization for screen clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.update(timestamp);
      p.draw();
    }
    
    animationFrameId = requestAnimationFrame(animate);
  }

  animationFrameId = requestAnimationFrame(animate);

  // Return cleanup function for script unmounting/re-rendering
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseleave', handleMouseLeave);
    window.removeEventListener('resize', resizeCanvas);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}
