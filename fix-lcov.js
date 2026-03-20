import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lcovPath = path.resolve(__dirname, 'coverage/lcov.info');

if (fs.existsSync(lcovPath)) {
  console.log(`Processing ${lcovPath}...`);
  let content = fs.readFileSync(lcovPath, 'utf8');
  
  // Normalize paths to be relative to the monorepo root
  // We are in frontend/portal, so we need to prepend frontend/portal/
  // And we should ensure forward slashes for better compatibility
  
  const lines = content.split(/\r?\n/);
  const newLines = lines.map(line => {
    if (line.startsWith('SF:')) {
      let filePath = line.substring(3);
      
      // If it's already absolute (e.g. E:\...), we might want to make it relative to repo root
      // OR just keep it absolute if Sonar supports it. 
      // But user said coverage is 0, so likely mismatch.
      // The snippet showed "SF:src\api\index.ts", which is relative to frontend/portal.
      
      if (filePath.startsWith('src\\') || filePath.startsWith('src/')) {
        // Normalize to forward slashes
        filePath = filePath.replace(/\\/g, '/');
        return `SF:frontend/portal/${filePath}`;
      }
    }
    return line;
  });
  
  fs.writeFileSync(lcovPath, newLines.join('\n'));
  console.log('Successfully updated lcov.info paths to be relative to project root.');
} else {
  console.error('lcov.info not found!');
  process.exit(1);
}
