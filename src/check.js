import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let issueFound = false;
files.forEach(file => {
  if (file.endsWith('.jsx') || file.endsWith('.js')) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      const match = line.match(/from\s+['"](.\/|..\/)([^'"]+)['"]/);
      if (match) {
        const importPath = match[2];
        const dir = path.dirname(file);
        let targetPath = path.resolve(dir, importPath);
        if (!path.extname(targetPath)) {
          if (fs.existsSync(targetPath + '.jsx')) targetPath += '.jsx';
          else if (fs.existsSync(targetPath + '.js')) targetPath += '.js';
          else if (fs.existsSync(targetPath + '.css')) targetPath += '.css';
          else if (fs.existsSync(targetPath + '/index.js')) targetPath += '/index.js';
        }
        if (fs.existsSync(targetPath)) {
          const basename = path.basename(targetPath);
          const actualBasename = fs.readdirSync(path.dirname(targetPath)).find(f => f.toLowerCase() === basename.toLowerCase());
          if (basename !== actualBasename) {
            console.log('CASE SENSITIVITY ISSUE in ' + file + ' line ' + (i+1) + ': imported as ' + basename + ' but file is ' + actualBasename);
            issueFound = true;
          }
        }
      }
    });
  }
});

if (!issueFound) console.log('No case sensitivity issues found.');
