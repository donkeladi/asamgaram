// Padam fail binaan lama (assets/ berhash) sebelum bina semula ke akar repo.
import { rmSync } from 'node:fs';
rmSync(new URL('../assets', import.meta.url), { recursive: true, force: true });
