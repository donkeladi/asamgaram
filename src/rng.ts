// Penjana rawak boleh ulang (mulberry32) supaya "kod dunia" memberi dunia yang sama.
export function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(a: readonly T[]): T {
    return a[Math.floor(this.next() * a.length)];
  }
  weighted<T>(a: readonly T[], w: (x: T) => number): T | null {
    let tot = 0;
    const ws = a.map((x) => {
      const v = Math.max(0, w(x));
      tot += v;
      return v;
    });
    if (tot <= 0) return null;
    let r = this.next() * tot;
    for (let i = 0; i < a.length; i++) {
      r -= ws[i];
      if (r < 0) return a[i];
    }
    return a[a.length - 1];
  }
  shuffle<T>(a: readonly T[]): T[] {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }
}

export function kodDunia(): string {
  const huruf = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const r = () => huruf[Math.floor(Math.random() * huruf.length)];
  return `${r()}${r()}-${Math.floor(1000 + Math.random() * 9000)}`;
}
