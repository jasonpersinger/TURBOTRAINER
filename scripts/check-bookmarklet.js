const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function extractTurboTrainer(source) {
  const start = source.indexOf('  function turboTrainer()');
  if (start === -1) {
    throw new Error('turboTrainer function not found');
  }

  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  let inString = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      inString = ch;
      continue;
    }

    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error('turboTrainer function did not close');
  }

  return source.slice(start, end).trim();
}

const functionSource = extractTurboTrainer(html);
const bookmarkletSource = `(${functionSource})();void 0;`;
const bookmarkletHref = `javascript:${encodeURIComponent(bookmarkletSource)}`;
const bookmarkletUrl = new URL(bookmarkletHref);

new vm.Script(`(${functionSource});`);
new vm.Script(decodeURIComponent(bookmarkletUrl.pathname));

if (bookmarkletUrl.hash) {
  throw new Error(`Generated bookmarklet has a URL fragment: ${bookmarkletUrl.hash}`);
}

console.log('turboTrainer source parses');
console.log(`bookmarklet length: ${bookmarkletHref.length}`);
console.log('bookmarklet URL has no fragment');
