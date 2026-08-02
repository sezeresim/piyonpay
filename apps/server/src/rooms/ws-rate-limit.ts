/** Lightweight in-memory rate limit for Socket.IO handlers (HTTP ThrottlerGuard is not WS-safe). */
export class WsRateLimit {
  private readonly hits = new Map<string, number[]>()

  constructor(
    private readonly limit: number,
    private readonly ttlMs: number,
  ) {}

  /** @returns true if the key is allowed */
  allow(key: string): boolean {
    const now = Date.now()
    const windowStart = now - this.ttlMs
    const stamps = (this.hits.get(key) ?? []).filter((ts) => ts > windowStart)
    if (stamps.length >= this.limit) {
      this.hits.set(key, stamps)
      return false
    }
    stamps.push(now)
    this.hits.set(key, stamps)
    return true
  }
}
