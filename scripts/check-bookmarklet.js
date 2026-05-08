const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const trainerSource = fs.readFileSync(path.join(rootDir, 'turbotrainer.js'), 'utf8');

new vm.Script(trainerSource, { filename: 'turbotrainer.js' });

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!scriptMatch) {
  throw new Error('landing page bookmarklet script not found');
}

let href = '';
const element = {};
const sandbox = {
  document: {
    getElementById(id) {
      if (id !== 'bookmarklet') {
        throw new Error(`unexpected element lookup: ${id}`);
      }
      return element;
    }
  }
};

Object.defineProperty(element, 'href', {
  get() {
    return href;
  },
  set(value) {
    href = value;
  }
});

vm.createContext(sandbox);
new vm.Script(scriptMatch[1], { filename: 'index.html inline script' }).runInContext(sandbox);

if (!href.startsWith('javascript:')) {
  throw new Error(`bookmarklet href is not javascript: ${href}`);
}

if (href.length > 1000) {
  throw new Error(`bookmarklet is too long: ${href.length} chars`);
}

const url = new URL(href);
if (url.hash) {
  throw new Error(`bookmarklet URL has a fragment: ${url.hash}`);
}

new vm.Script(href.slice('javascript:'.length), { filename: 'bookmarklet.js' });

console.log('turbotrainer.js parses');
console.log(`bookmarklet length: ${href.length}`);
console.log('bookmarklet parses and has no fragment');
