import fs from 'fs';
import path from 'path';

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('Please provide module name');
  process.exit(1);
}

const basePath = path.join('src/modules', moduleName);

const folders = [
  'application/dto',
  'application/services',
  'application/use-cases',
  'domain/enum',
  'domain/repositories',
  'infrastructure/persistence/prisma',
  'presentation/controllers',
];

folders.forEach((folder) => {
  fs.mkdirSync(path.join(basePath, folder), { recursive: true });
});

console.log(`Module "${moduleName}" generated successfully`);
