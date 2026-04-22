/**
 * boxicons@2.1.4 ships boxicons.js with //# sourceMappingURL=boxicons.js.map
 * but does not include the .map file, so webpack's source-map-loader warns (ENOENT).
 * A minimal valid map silences the warning without affecting runtime.
 */
const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '..', 'node_modules', 'boxicons', 'dist', 'boxicons.js.map');
const stub = JSON.stringify({
  version: 3,
  file: 'boxicons.js',
  sources: [],
  names: [],
  mappings: '',
});

try {
  fs.mkdirSync(path.dirname(mapPath), { recursive: true });
  fs.writeFileSync(mapPath, stub, 'utf8');
} catch (e) {
  if (e.code !== 'ENOENT') {
    console.warn('ensure-boxicons-sourcemap:', e.message);
  }
}
