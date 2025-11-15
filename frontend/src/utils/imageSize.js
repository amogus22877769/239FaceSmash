/**
 * Utility to calculate optimal image sizes based on display dimensions and device pixel ratio
 * Accounts for mobile devices with 3x pixel density
 */

/**
 * Get device pixel ratio, with a reasonable maximum
 */
function getDevicePixelRatio() {
  if (typeof window === 'undefined') return 2;
  // Cap at 3x for practical purposes (most devices are 1x, 2x, or 3x)
  return Math.min(window.devicePixelRatio || 2, 3);
}

/**
 * Check if device is mobile based on screen width
 */
function isMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}

/**
 * Calculate optimal image size for RatePage
 * Desktop: 350px × 400px display
 * Mobile: up to ~400px × 400px display (full width on small screens)
 * Accounts for 2x-3x pixel density
 */
export function getRatePageImageSize() {
  const dpr = getDevicePixelRatio();
  const mobile = isMobile();
  
  // On mobile, cards can be full width (up to ~400px), desktop is 350px max
  const displayWidth = mobile ? 400 : 350;
  const displayHeight = 400;
  
  // Request 3x resolution to cover both 2x and 3x displays
  // This ensures sharp images on all devices
  const width = Math.ceil(displayWidth * 3);
  const height = Math.ceil(displayHeight * 3);
  
  return { width, height };
}

/**
 * Calculate optimal image size for RatingsPage
 * Avatar displays at 48px × 48px
 * Accounts for 2x-3x pixel density
 */
export function getRatingsPageImageSize() {
  const dpr = getDevicePixelRatio();
  
  // Avatar is always 48px regardless of device
  const displaySize = 48;
  
  // Request 3x resolution to cover both 2x and 3x displays
  const size = Math.ceil(displaySize * 3);
  
  return { width: size, height: size };
}

