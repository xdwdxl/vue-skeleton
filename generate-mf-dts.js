import fs from 'fs';
import path from 'path';

const exposes = {
  './bootstrap': './src/main.ts',
  './theme': './src/theme/index.ts',
  './styles': './src/styles/variables.css',
  './http': './src/http/api.ts',
  './api': './src/api/index.ts',
  './i18n': './src/i18n/index.ts',
  './storage': './src/storage/index.ts',
  './error': './src/error/index.ts',
  './audit': './src/audit/client.ts',
  './regionalization': './src/regionalization/index.ts',
  './gantt': './src/gantt/index.ts',
  './dialog': './src/dialog/index.ts',
  './BaseDialog': './src/dialog/BaseDialog.vue',
  './FormDialog': './src/dialog/FormDialog.vue',
  './PortalIcon': './src/components/PortalIcon.vue',
  './PortalTable': './src/components/PortalTable.vue',
  './PortalTableColumn': './src/components/PortalTableColumn.ts',
  './notify': './src/notify/index.ts',
  './dashboard-styles': './src/styles/dashboard.css'
};

const distDir = path.resolve('dist/@mf-types');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const lines = [];

for (const [key, value] of Object.entries(exposes)) {
  if (value.endsWith('.css')) continue;

  const keyName = key.replace('./', '');
  const relativeSrc = value.replace('./src/', '');
  
  let importPath = `./compiled-types/${relativeSrc}`;
  
  if (importPath.endsWith('.ts')) {
    importPath = importPath.replace('.ts', '');
  }
  
  lines.push(`declare module "portal/${keyName}" {`);
  lines.push(`  export * from "${importPath}"`);
  lines.push(`}`);
  lines.push('');
}

fs.writeFileSync(path.join(distDir, 'index.d.ts'), lines.join('\n'));
console.log('Generated dist/@mf-types/index.d.ts');
