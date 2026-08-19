/** 最小の CDP クライアント。Node 22 の組み込み WebSocket を使う（依存を足さない） */
export class CDP {
  constructor(ws) {
    this.ws = ws
    this.nextId = 1
    this.pending = new Map()
    this.handlers = new Map()
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id)
        if (p === undefined) return
        this.pending.delete(msg.id)
        if (msg.error)
          p.reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error)})`))
        else p.resolve(msg.result)
      } else {
        for (const fn of this.handlers.get(msg.method) ?? []) fn(msg.params)
      }
    })
  }

  static async connect(url) {
    const ws = new WebSocket(url)
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true })
      ws.addEventListener('error', reject, { once: true })
    })
    return new CDP(ws)
  }

  send(method, params = {}) {
    const id = this.nextId++
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }))
  }

  on(method, fn) {
    const list = this.handlers.get(method) ?? []
    list.push(fn)
    this.handlers.set(method, list)
  }

  /** ページ内で式を評価して値を取り出す */
  async eval(expression, { awaitPromise = false } = {}) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
    })
    if (res.exceptionDetails) {
      throw new Error(
        `ページ内でエラー: ${res.exceptionDetails.text} ${res.exceptionDetails.exception?.description ?? ''}`,
      )
    }
    return res.result.value
  }

  close() {
    this.ws.close()
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 条件が真になるまで待つ */
export async function until(fn, { timeout = 30000, interval = 100, label = '条件' } = {}) {
  const limit = Date.now() + timeout
  for (;;) {
    if (await fn()) return
    if (Date.now() > limit) throw new Error(`待機がタイムアウトしました: ${label}`)
    await sleep(interval)
  }
}
