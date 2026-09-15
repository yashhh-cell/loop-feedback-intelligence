const fs = require('fs');
const path = require('path');

function patchApi(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const p = path.join(dir, entry);
    if (fs.statSync(p).isDirectory()) {
      patchApi(p);
    } else if (entry === 'route.ts') {
      let content = fs.readFileSync(p, 'utf8');
      if (!content.includes('export const dynamic')) {
        content = 'export const dynamic = "force-dynamic";\n\n' + content;
        fs.writeFileSync(p, content, 'utf8');
        console.log('Patched dynamic on:', p);
      }
    }
  }
}

patchApi('app/api');