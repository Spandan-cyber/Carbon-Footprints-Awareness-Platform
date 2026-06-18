/**
 * Sylva Premium Custom Mouse Cursor
 * Implements smooth-lag interactive ring cursor that expands on hover
 * and shrinks on click. Touch devices are automatically bypassed.
 */
export function initCustomCursor() {
  // Detect touch devices / non-pointer systems
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!hasFinePointer) return;

  // Create cursor elements dynamically
  const dot = document.createElement('div');
  dot.className = 'custom-cursor-dot';
  dot.id = 'cursor-dot';
  
  const ring = document.createElement('div');
  ring.className = 'custom-cursor-ring';
  ring.id = 'cursor-ring';
  
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  
  // Position coordinates state
  let mouseX = -100;
  let mouseY = -100;
  let dotX = -100;
  let dotY = -100;
  let ringX = -100;
  let ringY = -100;
  let isMoving = false;
  let visibilityTimeout = null;

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Snap instantly on first movement to avoid sliding from off-screen
    if (!isMoving) {
      isMoving = true;
      dotX = mouseX;
      dotY = mouseY;
      ringX = mouseX;
      ringY = mouseY;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    }

    // Reset visibility logic on move
    ring.classList.remove('cursor-hidden');
    dot.classList.remove('cursor-hidden');

    if (visibilityTimeout) clearTimeout(visibilityTimeout);
    
    // Hide cursor after 5 seconds of inactivity to keep layout clean
    visibilityTimeout = setTimeout(() => {
      ring.classList.add('cursor-hidden');
      dot.classList.add('cursor-hidden');
    }, 5000);
  });

  // Handle cursor entering and leaving window bounds
  document.addEventListener('mouseleave', () => {
    ring.classList.add('cursor-hidden');
    dot.classList.add('cursor-hidden');
  });

  document.addEventListener('mouseenter', () => {
    ring.classList.remove('cursor-hidden');
    dot.classList.remove('cursor-hidden');
  });
  
  // Click states
  window.addEventListener('mousedown', () => {
    ring.classList.add('cursor-clicking');
    dot.classList.add('cursor-clicking');
  });
  
  window.addEventListener('mouseup', () => {
    ring.classList.remove('cursor-clicking');
    dot.classList.remove('cursor-clicking');
  });
  
  // Check and apply hover class to interactive elements
  function bindHoverEffects() {
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], .habit-card, .slider-thumb, input[type="range"]');
    interactives.forEach(el => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';
      
      el.addEventListener('mouseenter', () => {
        ring.classList.add('cursor-hover');
        dot.classList.add('cursor-hover');
      });
      
      el.addEventListener('mouseleave', () => {
        ring.classList.remove('cursor-hover');
        dot.classList.remove('cursor-hover');
      });
    });
  }

  // Bind initially and observe DOM for dynamic element creation (e.g. habit cards)
  bindHoverEffects();
  const observer = new MutationObserver(bindHoverEffects);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Hide standard system cursor on desktop browser
  document.documentElement.classList.add('custom-cursor-active');
  
  // Main animation frame loop for fluid easing interpolation
  function render() {
    if (isMoving) {
      // Dot tracks the mouse instantly for 100% responsive clicking
      dotX = mouseX;
      dotY = mouseY;
      
      // Ring follows slowly with trailing lag (15% interpolation rate)
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      
      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    }
    
    requestAnimationFrame(render);
  }
  
  requestAnimationFrame(render);
}
