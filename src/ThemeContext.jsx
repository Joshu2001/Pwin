import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const defaultState = {
  accentColor: '#9333ea',
  themeId: 'Light',
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

// color utilities
function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(rgbA, rgbB) {
  const L1 = relativeLuminance(rgbA);
  const L2 = relativeLuminance(rgbB);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgbSafe(hex) {
  const rgb = hexToRgb(hex);
  return rgb || { r: 0, g: 0, b: 0 };
}

function clamp(n, a=0, b=255){ return Math.min(b, Math.max(a, Math.round(n))); }

function adjustColorTowards(bgRgb, lighten=true, step=8, attempts=24) {
  // attempt to produce a color with greater contrast by moving bgRgb towards white or black
  let r = bgRgb.r, g = bgRgb.g, b = bgRgb.b;
  for (let i=0;i<attempts;i++){
    r = clamp(r + (lighten ? step : -step));
    g = clamp(g + (lighten ? step : -step));
    b = clamp(b + (lighten ? step : -step));
    const candidate = { r, g, b };
    const crWhite = contrastRatio(candidate, { r:255,g:255,b:255 });
    const crBlack = contrastRatio(candidate, { r:0,g:0,b:0 });
    if (crWhite >= 4.5 || crBlack >= 4.5) {
      return candidate;
    }
  }
  return { r: clamp(bgRgb.r), g: clamp(bgRgb.g), b: clamp(bgRgb.b) };
}

function rgbToHex({r,g,b}){
  return `#${((1<<24)+(clamp(r)<<16)+(clamp(g)<<8)+clamp(b)).toString(16).slice(1)}`;
}

export function ThemeProvider({ children }) {
  const [accentColor, setAccentColor] = useState(() => {
    try {
      const raw = localStorage.getItem('regaarder_theme');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.accentColor) return parsed.accentColor;
      }
    } catch (e) {}
    return defaultState.accentColor;
  });

  const [themeId, setThemeId] = useState(() => {
    try {
      const raw = localStorage.getItem('regaarder_theme');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.themeId) return parsed.themeId;
      }
    } catch (e) {}
    return defaultState.themeId;
  });
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Previously we read from localStorage in an effect which caused a render
  // with the default color before the persisted color was applied. Using a
  // lazy initializer for state ensures the persisted color is used on first
  // render, avoiding flicker and preventing reversion when navigating.

  useEffect(() => {
    try { localStorage.setItem('regaarder_theme', JSON.stringify({ accentColor, themeId })); } catch (e) {}
    const rgb = hexToRgb(accentColor);
    if (rgb) {
      // primary accent -- may be used for buttons / highlights
      document.documentElement.style.setProperty('--color-gold', accentColor);
      document.documentElement.style.setProperty('--brand-gold', accentColor);
      document.documentElement.style.setProperty('--color-primary', accentColor);
      document.documentElement.style.setProperty('--color-accent', accentColor);

      // ensure there is a readable text color over the accent by checking WCAG contrast
      const bg = hexToRgbSafe(accentColor);
      const crWithWhite = contrastRatio(bg, { r:255,g:255,b:255 });
      const crWithBlack = contrastRatio(bg, { r:0,g:0,b:0 });

      let safeText = '#000000';
      if (crWithWhite >= 4.5) {
        safeText = '#ffffff';
        document.documentElement.style.setProperty('--color-accent-safe', accentColor);
      } else if (crWithBlack >= 4.5) {
        safeText = '#000000';
        document.documentElement.style.setProperty('--color-accent-safe', accentColor);
      } else {
        // neither black nor white is sufficient; try to adjust the accent slightly towards both directions
        const lighter = adjustColorTowards(bg, true);
        const darker = adjustColorTowards(bg, false);
        const lighterCr = Math.max(contrastRatio(lighter, {r:255,g:255,b:255}), contrastRatio(lighter, {r:0,g:0,b:0}));
        const darkerCr = Math.max(contrastRatio(darker, {r:255,g:255,b:255}), contrastRatio(darker, {r:0,g:0,b:0}));
        const chosen = lighterCr > darkerCr ? lighter : darker;
        const chosenHex = rgbToHex(chosen);
        // expose adjusted safe accent as --color-accent-safe and pick a matching readable text
        document.documentElement.style.setProperty('--color-accent-safe', chosenHex);
        const crWithWhite2 = contrastRatio(chosen, { r:255,g:255,b:255 });
        safeText = crWithWhite2 >= 4.5 ? '#ffffff' : '#000000';
      }

      document.documentElement.style.setProperty('--color-accent-text', safeText);
      
      // Like button colors (premium red that works with any accent)
      document.documentElement.style.setProperty('--color-like', '#EF4444'); // red-500
      document.documentElement.style.setProperty('--color-like-hover', '#DC2626'); // red-600
      document.documentElement.style.setProperty('--color-like-active', '#B91C1C'); // red-700
      
      // color for lighter overlay states
      document.documentElement.style.setProperty('--color-gold-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      // expose RGB triplet for use in CSS rgba(var(--color-gold-rgb), a)
      document.documentElement.style.setProperty('--color-gold-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      document.documentElement.style.setProperty('--brand-gold-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      document.documentElement.style.setProperty('--color-gold-light-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
      document.documentElement.style.setProperty('--color-gold-icon-bg', accentColor);
      const lighterRgb = { r: Math.min(255, rgb.r + 80), g: Math.min(255, rgb.g + 80), b: Math.min(255, rgb.b + 80) };
      document.documentElement.style.setProperty('--color-gold-cream', `rgb(${lighterRgb.r}, ${lighterRgb.g}, ${lighterRgb.b})`);
      document.documentElement.style.setProperty('--color-accent-soft', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
      
      // Also set purple color variables for dashboard and other uses
      document.documentElement.style.setProperty('--color-purple', accentColor);
      document.documentElement.style.setProperty('--color-purple-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      document.documentElement.style.setProperty('--color-purple-light-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
      // also provide accessibility-safe colors for the built-in final/purple CTA
      try {
        const finalHex = '#7C3AED';
        const finalRgb = hexToRgbSafe(finalHex);
        const finalCrWhite = contrastRatio(finalRgb, {r:255,g:255,b:255});
        const finalCrBlack = contrastRatio(finalRgb, {r:0,g:0,b:0});
        if (finalCrWhite >= 4.5) {
          document.documentElement.style.setProperty('--color-final', finalHex);
          document.documentElement.style.setProperty('--color-final-text', '#ffffff');
          document.documentElement.style.setProperty('--color-final-safe', finalHex);
        } else if (finalCrBlack >= 4.5) {
          document.documentElement.style.setProperty('--color-final', finalHex);
          document.documentElement.style.setProperty('--color-final-text', '#000000');
          document.documentElement.style.setProperty('--color-final-safe', finalHex);
        } else {
          const lighterF = adjustColorTowards(finalRgb, true);
          const darkerF = adjustColorTowards(finalRgb, false);
          const lCr = Math.max(contrastRatio(lighterF, {r:255,g:255,b:255}), contrastRatio(lighterF, {r:0,g:0,b:0}));
          const dCr = Math.max(contrastRatio(darkerF, {r:255,g:255,b:255}), contrastRatio(darkerF, {r:0,g:0,b:0}));
          const chosenF = lCr > dCr ? lighterF : darkerF;
          const chosenHexF = rgbToHex(chosenF);
          document.documentElement.style.setProperty('--color-final', chosenHexF);
          const finalCrWithWhite2 = contrastRatio(chosenF, {r:255,g:255,b:255});
          document.documentElement.style.setProperty('--color-final-text', finalCrWithWhite2 >= 4.5 ? '#ffffff' : '#000000');
          document.documentElement.style.setProperty('--color-final-safe', chosenHexF);
        }
      } catch (e) {}
    }
  }, [accentColor, themeId]);

  const openThemeModal = () => setShowThemeModal(true);
  const closeThemeModal = () => setShowThemeModal(false);

  return (
    <ThemeContext.Provider value={{ accentColor, themeId, setAccentColor, setThemeId, openThemeModal, closeThemeModal, showThemeModal }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;
