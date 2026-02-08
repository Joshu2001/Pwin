const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'users.json');
const raw = fs.readFileSync(filePath);

// Read as buffer and convert, replacing any byte sequences that aren't valid UTF-8
let text = raw.toString('utf8');

// Remove BOM if present
if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

// Replace control characters (0x00-0x1F except \t \n \r, and 0x7F-0x9F) 
// that appear OUTSIDE of already-escaped sequences in JSON strings
// Strategy: go through line by line, find "emoji": "..." patterns, and replace the value

const emojiMap = {
  premium: '⭐',
  personal: '❤️',
  weekend: '☀️',
  playful: '😄',
  entertainment: '🎬',
  educational: '📚',
  diy: '🔬',
  debates: '💬',
  creative: '🎨',
  academic: '🎓',
  travel: '✈️',
  motivation: '💪',
  podcasts: '🎧',
  journalistic: '📰',
  entrepreneurship: '🚀',
  business_history: '🏛️',
  fashion: '👗',
  psychology: '🧠',
  health: '🏋️',
};

const lines = text.split('\n');
let currentCategoryId = null;
const fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Track the current category ID
  const idMatch = line.match(/"id":\s*"([^"]+)"/);
  if (idMatch) {
    currentCategoryId = idMatch[1];
  }
  
  // Fix emoji lines
  if (line.includes('"emoji"')) {
    const emoji = emojiMap[currentCategoryId];
    if (emoji) {
      // Replace the entire emoji value
      line = line.replace(/"emoji":\s*"[^"]*.*?"/, `"emoji": "${emoji}"`);
      // But we need to be careful - the corrupted bytes might span the closing quote
      // Let's just reconstruct the line entirely
      const indent = line.match(/^(\s*)/)[1];
      // Check if there's a comma after
      const hasComma = line.trimEnd().endsWith(',');
      line = `${indent}"emoji": "${emoji}"${hasComma ? ',' : ''}`;
    } else {
      // Unknown category, just put a generic emoji
      const indent = line.match(/^(\s*)/)[1];
      const hasComma = line.trimEnd().endsWith(',');
      line = `${indent}"emoji": "📌"${hasComma ? ',' : ''}`;
    }
  }
  
  // Also sanitize any other lines with control characters
  // Remove bytes 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F, 0x80-0x9F
  let cleanLine = '';
  for (let j = 0; j < line.length; j++) {
    const code = line.charCodeAt(j);
    if (code <= 0x08 || code === 0x0B || code === 0x0C || 
        (code >= 0x0E && code <= 0x1F) || code === 0x7F ||
        (code >= 0x80 && code <= 0x9F)) {
      // Skip control character
      continue;
    }
    // Also skip Unicode replacement character
    if (code === 0xFFFD) continue;
    cleanLine += line[j];
  }
  
  fixedLines.push(cleanLine);
}

const result = fixedLines.join('\n');

// Validate JSON before writing
try {
  const parsed = JSON.parse(result);
  console.log('JSON valid! Users:', parsed.length);
  
  // Count creators
  const creators = parsed.filter(u => u.isCreator || u.is_creator);
  console.log('Creators:', creators.length);
  creators.forEach(c => console.log(`  - ${c.name} (${c.email})`));
  
  // Write fixed file
  fs.writeFileSync(filePath, result, 'utf8');
  console.log('File written successfully');
} catch(e) {
  console.error('JSON still invalid:', e.message);
  
  // Try a more aggressive approach - find the exact position
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
  if (pos > 0) {
    console.log('Around position', pos, ':', JSON.stringify(result.substring(pos-20, pos+20)));
    console.log('Char codes:', Array.from(result.substring(pos-5, pos+5)).map(c => c.charCodeAt(0).toString(16)));
  }
}
