import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/* ================= FIX __dirname FOR ESM ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= GET MODULE NAME ================= */

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('Please provide module name');
  process.exit(1);
}

const capitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

const basePath = path.join(__dirname, '../src/modules', moduleName);

/* ================= CREATE DIRECTORIES ================= */

const directories = [
  'application/dto',
  'application/interfaces',
  'application/services',
  'domain/repositories',
  'infrastructure',
  'presentation/controllers',
];

directories.forEach((dir) => {
  fs.mkdirSync(path.join(basePath, dir), { recursive: true });
});

/* ================= CREATE FILES ================= */

const files = {
  [`application/interfaces/${moduleName}.service.interface.ts`]: `export interface I${capitalized}Service {}\n`,

  [`application/services/${moduleName}.service.ts`]: `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${capitalized}Service {}
`,

  [`presentation/controllers/${moduleName}.controller.ts`]: `import { Controller } from '@nestjs/common';

@Controller('${moduleName}')
export class ${capitalized}Controller {}
`,

  [`${moduleName}.module.ts`]: `import { Module } from '@nestjs/common';
import { ${capitalized}Service } from './application/services/${moduleName}.service';
import { ${capitalized}Controller } from './presentation/controllers/${moduleName}.controller';

@Module({
  providers: [${capitalized}Service],
  controllers: [${capitalized}Controller],
})
export class ${capitalized}Module {}
`,
};

Object.entries(files).forEach(([relativePath, content]) => {
  const fullPath = path.join(basePath, relativePath);
  fs.writeFileSync(fullPath, content);
});

console.log(`Module "${moduleName}" generated successfully.`);
