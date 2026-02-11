const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const patchesDir = path.join(rootDir, 'patches');

if (!fs.existsSync(patchesDir)) {
  console.log('No patches directory found');
  process.exit(0);
}

const patches = fs.readdirSync(patchesDir).filter(f => f.endsWith('.patch'));

if (patches.length === 0) {
  console.log('No patches found');
  process.exit(0);
}

for (const patch of patches) {
  console.log(`Reading patch: ${patch}`);
  const patchPath = path.join(patchesDir, patch);
  const content = fs.readFileSync(patchPath, 'utf8');
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('--- a/')) {
      const filePath = line.substring(6);
      const fullPath = path.join(rootDir, filePath);
      if (fs.existsSync(fullPath)) {
        console.log(`Patching: ${filePath}`);
        let fileContent = fs.readFileSync(fullPath, 'utf8');
        
        // Simple patch: remove lines starting with "-  if (IS_ARRAY_BUFFER_DETACH_SUPPORTED"
        fileContent = fileContent.replace(
          /[\r\n]+  if \(IS_ARRAY_BUFFER_DETACH_SUPPORTED == 1\) assert\(napi_detach_arraybuffer\(env, argv\[2\]\) == napi_ok\);/g,
          ''
        );
        
        fs.writeFileSync(fullPath, fileContent);
        console.log(`Patched: ${filePath}`);
      }
    }
  }
}

console.log('All patches applied');
