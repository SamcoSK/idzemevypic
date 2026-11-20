const fs = require('fs');

let content = fs.readFileSync('src/data/kto-by-najskor.json', 'utf8');

const lines = content.split('\n');
const items = [];
let validLines = 0;
let fixedLines = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (!line || line === '[' || line === ']') continue;
  if (line.endsWith(',')) line = line.slice(0, -1);
  try {
    const item = JSON.parse(line);
    items.push(item);
    validLines++;
  } catch (e) {
    const idMatch = line.match(/"id":\s*(\d+)/);
    const katMatch = line.match(/"kategoria":\s*"([^"]+)"/);
    const ostMatch = line.match(/"ostrost":\s*"([^"]+)"/);
    if (idMatch && katMatch && ostMatch) {
      const id = parseInt(idMatch[1]);
      // Extract text between "text":" and ","kategoria"
      const textStart = line.indexOf('"text":"') + 8;
      const textEnd = line.lastIndexOf('","kategoria"');
      if (textStart > 7 && textEnd > textStart) {
        let text = line.substring(textStart, textEnd);
        text = text.replace(/"/g, '“'); // replace unescaped inner double quotes with Slovak quotes
        items.push({
          id,
          text,
          kategoria: katMatch[1],
          ostrost: ostMatch[1]
        });
        fixedLines++;
        continue;
      }
    }
    console.log('Failed to parse line ' + (i+1) + ': ' + line);
  }
}

console.log(`Parsed total: ${items.length} items (valid: ${validLines}, fixed: ${fixedLines})`);

// Ensure IDs are 1..500
items.forEach((item, idx) => {
  item.id = idx + 1;
});

// Category & sharpness stats
const categories = {};
const sharpness = {};
items.forEach(q => {
  categories[q.kategoria] = (categories[q.kategoria] || 0) + 1;
  sharpness[q.ostrost] = (sharpness[q.ostrost] || 0) + 1;
});

console.log('Categories:', categories);
console.log('Sharpness:', sharpness);

fs.writeFileSync('src/data/kto-by-najskor.json', JSON.stringify(items, null, 2), 'utf8');
console.log('Successfully saved src/data/kto-by-najskor.json!');
