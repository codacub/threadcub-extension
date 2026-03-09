console.log('🎨 LOADING: rebrand-tokens.js');

// ThreadCub Rebrand Design Tokens
// New source of truth — components migrate here gradually
// Old design-tokens.js remains untouched until all components have migrated

const rebrandColors = {
  // ===== GREENS =====
  green100: '#E8F5EE',   // --color-green-100 | toast background, success surfaces

  // ===== WARM NEUTRALS =====
  warm900: '#231F1A',    // --color-warm-900 | near black | primary text

  // More tokens added here as components migrate
};

const rebrandSpacing = {
  4:  '4px',
  8:  '8px',
  16: '16px',
  24: '24px',
  32: '32px',
};

const rebrandBorders = {
  radius: {
    md:   '6px',
    lg:   '8px',
    xl:   '12px',
    full: '9999px',
  }
};

window.ThreadCubRebrand = {
  colors:  rebrandColors,
  spacing: rebrandSpacing,
  borders: rebrandBorders,
};

console.log('✅ ThreadCubRebrand defined:', typeof window.ThreadCubRebrand);
