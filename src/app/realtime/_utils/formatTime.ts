export function formatTime(startTime: string, timestamp: string): string {
  const t0 = new Date(startTime).valueOf();
  const t1 = new Date(timestamp).valueOf();
  const delta = t1 - t0;
  const hs = Math.floor(delta / 10) % 100;
  const s = Math.floor(delta / 1000) % 60;
  const m = Math.floor(delta / 60_000) % 60;

  const pad = (n: number): string => {
    let s = n.toString();
    while (s.length < 2) {
      s = '0' + s;
    }
    return s;
  };

  return `${pad(m)}:${pad(s)}.${pad(hs)}`;
}
