/** run an async mapper over a list with a concurrency cap (replaces the old
 * serial-for + hardcoded-sleep loading pattern) */
export async function mapLimit<T, R>(
  list: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(list.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (next < list.length) {
      const i = next++
      results[i] = await fn(list[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

export function shortAddr(addr: string | null | undefined, head = 6, tail = 4): string {
  if (!addr) return ''
  if (addr.length <= head + tail + 2) return addr
  return addr.slice(0, head) + '...' + addr.slice(-tail)
}

export function isValidAmount(v: string | null | undefined): boolean {
  if (!v) return false
  return /^[+]?(\d+\.?\d*|\.\d+)$/.test(v) && parseFloat(v) > 0
}

export function parseIntSafe(v: string | null | undefined): number {
  const n = parseInt(v ?? '', 10)
  return Number.isNaN(n) ? 0 : n
}
