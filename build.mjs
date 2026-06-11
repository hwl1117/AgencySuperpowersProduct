import { readFileSync } from 'fs';

// Check the backup for other potential syntax issues
const html = readFileSync('landing_backup.html', 'utf-8');
const jsxStart = html.indexOf('<script type="text/babel">');
const jsxEnd = html.lastIndexOf('</script>');
const jsx = html.substring(jsxStart, jsxEnd);

// Check for common issues
const issues = [];

// 1. Check for unescaped </ in JSX (except </script>)
const lines = jsx.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Check for </script> inside JSX (which would break HTML parsing)
  if (line.includes('</script>') && i > 0) {
    issues.push('Line ' + (i+1) + ': contains </script> inside JSX');
  }
}

// 2. Check for unmatched quotes (basic check)
let singleQuotes = 0;
let doubleQuotes = 0;
for (const c of jsx) {
  if (c === "'") singleQuotes++;
  if (c === '"') doubleQuotes++;
}
console.log('Single quotes: ' + singleQuotes + ' (should be even: ' + (singleQuotes % 2 === 0) + ')');
console.log('Double quotes: ' + doubleQuotes + ' (should be even: ' + (doubleQuotes % 2 === 0) + ')');

// 3. Check for ))' patterns (potential extra closing parens)
let pos = 0;
while ((pos = jsx.indexOf("))'", pos)) !== -1) {
  const context = jsx.substring(Math.max(0, pos-20), pos+15);
  issues.push('Position ' + pos + ': ))' + "'" + ' found: ...' + context + '...');
  pos++;
}

// 4. Check for empty catch blocks (might cause issues with older Babel)
const emptyCatch = jsx.match(/catch\s*\{\s*\}/g);
if (emptyCatch) {
  console.log('Empty catch blocks: ' + emptyCatch.length + ' (might need catch(e){})');
}

if (issues.length === 0) {
  console.log('No issues found!');
} else {
  console.log('Issues found:');
  issues.forEach(i => console.log('  - ' + i));
}
