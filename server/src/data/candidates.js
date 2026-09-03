import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const candidates = JSON.parse(
  readFileSync(path.join(__dirname, 'candidates.json'), 'utf-8')
);

export default candidates;
