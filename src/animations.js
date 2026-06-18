/**
 * Animates a number inside an HTML element from its current value to a new target value.
 * Uses cubic ease-out interpolation for a natural, organic transition speed.
 * Prevents animation overlap by cancelling active frames on the same element.
 * 
 * @param {HTMLElement} element - The target DOM element containing the text.
 * @param {number} targetValue - The number to animate towards.
 * @param {number} duration - Animation duration in milliseconds.
 * @param {number} decimals - Decimal precision for output string.
 */
export function animateNumber(element, targetValue, duration = 650, decimals = 2) {
  if (!element) return;

  const currentText = element.textContent.replace(/,/g, '');
  const startValue = parseFloat(currentText) || 0;
  
  if (startValue === targetValue) {
    element.textContent = targetValue.toFixed(decimals);
    return;
  }

  const startTime = performance.now();

  function updateNumber(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Cubic ease-out curve: f(t) = 1 - (1 - t)^3
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    const currentValue = startValue + (targetValue - startValue) * easeProgress;
    element.textContent = currentValue.toFixed(decimals);

    if (progress < 1) {
      element._numberAnimationFrame = requestAnimationFrame(updateNumber);
    } else {
      element._numberAnimationFrame = null;
    }
  }

  // Cancel running animations on this element to prevent conflicts
  if (element._numberAnimationFrame) {
    cancelAnimationFrame(element._numberAnimationFrame);
  }

  element._numberAnimationFrame = requestAnimationFrame(updateNumber);
}
