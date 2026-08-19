/**
 * 通し確認の足場。Chrome の起動、CDP 接続、判定の記録。
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { CDP, sleep, until } from './cdp.mjs'

export const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export const APP = 'http://localhost:4173/monmana/'
export const HERE = new URL('.', import.meta.url).pathname
/** 実行のたびに作り直す。リポジトリには入れない（.gitignore 済み） */
export const OUT = `${HERE}out`
export const SHOTS = `${OUT}/shots`
export const PROFILE = `${OUT}/profile`
export const DOWNLOADS = `${OUT}/downloads`

const WIDTH = 390
const HEIGHT = 844

/** ページに仕込む観測用のコード。アプリ本体には手を入れない */
export const PROBE = String.raw`
(() => {
  // 音が「鳴らそうとした」だけでなく「実際に流れ始めた」かを見るための記録
  window.__audio = { calls: 0, started: 0, rejected: [], last: null }
  const play = HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.play = function () {
    window.__audio.calls += 1
    window.__audio.last = this
    let result
    try { result = play.apply(this, arguments) } catch (e) { window.__audio.rejected.push(String(e)); throw e }
    Promise.resolve(result).then(
      () => { window.__audio.started += 1 },
      (e) => { window.__audio.rejected.push(String(e)) },
    )
    return result
  }

  // 25 分を待たずに終端へ寄せるための時計。差分をずらすだけで、進み方は実時間のまま。
  // **ずらした量はページを読み直しても持ち越す。**
  // 持ち越さないと時刻が巻き戻り、成長履歴の並びなど「順序」を見る検査が壊れる
  const RealNow = Date.now.bind(Date)
  const KEY = 'walkthrough.clock.offset'
  let offset = Number(sessionStorage.getItem(KEY) ?? '0') || 0
  window.__clock = {
    get offset() { return offset },
    set offset(v) { offset = v; try { sessionStorage.setItem(KEY, String(v)) } catch { /* 保存できなくても進む */ } },
  }
  Date.now = () => RealNow() + offset
})()
`

export class Run {
  constructor() {
    this.results = []
    this.step = '—'
    this.chrome = undefined
    this.cdp = undefined
  }

  setStep(step) {
    this.step = step
    console.log(`\n── ${step} ──`)
  }

  /** 判定を 1 件記録する。fn が throw したら不合格 */
  async check(name, fn) {
    try {
      const detail = await fn()
      this.results.push({ step: this.step, name, state: 'ok', detail: detail ?? '' })
      console.log(`  ✓ ${name}${detail ? `  — ${detail}` : ''}`)
    } catch (error) {
      this.results.push({ step: this.step, name, state: 'ng', detail: error.message })
      console.log(`  ✗ ${name}  — ${error.message}`)
    }
  }

  /** 自動では確かめられない項目。実機へ送る */
  skip(name, why) {
    this.results.push({ step: this.step, name, state: 'device', detail: why })
    console.log(`  · ${name}  — 実機のみ: ${why}`)
  }

  async launch({ fresh = true } = {}) {
    mkdirSync(OUT, { recursive: true })
    if (fresh) {
      rmSync(PROFILE, { recursive: true, force: true })
      rmSync(SHOTS, { recursive: true, force: true })
      rmSync(DOWNLOADS, { recursive: true, force: true })
    }
    mkdirSync(SHOTS, { recursive: true })
    mkdirSync(DOWNLOADS, { recursive: true })

    const port = 9500 + Math.floor(Math.random() * 200)
    this.chrome = spawn(
      CHROME,
      [
        '--headless=new',
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${PROFILE}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--hide-scrollbars',
        '--mute-audio',
        '--force-color-profile=srgb',
        `--force-device-scale-factor=2`,
        `--window-size=${WIDTH},${HEIGHT}`,
        // 自動再生の制限は緩めない。タップで unlock する経路（ADR-0013）ごと確かめるため
        'about:blank',
      ],
      { stdio: 'ignore' },
    )

    await until(
      async () => {
        try {
          await fetch(`http://127.0.0.1:${port}/json/version`)
          return true
        } catch {
          return false
        }
      },
      { timeout: 20000, label: 'Chrome の起動' },
    )

    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    this.cdp = await CDP.connect(list.find((t) => t.type === 'page').webSocketDebuggerUrl)
    await this.cdp.send('Page.enable')
    await this.cdp.send('Runtime.enable')
    await this.cdp.send('Network.enable')
    await this.cdp.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: DOWNLOADS,
    })
    await this.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await this.cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE })
    return this
  }

  async quit() {
    this.cdp?.close()
    this.chrome?.kill()
    await sleep(800)
  }

  async open(url = APP) {
    await this.cdp.send('Page.navigate', { url })
    await this.waitFor('.home, .plantview, .timer, .done')
  }

  eval(expr, opts) {
    return this.cdp.eval(expr, opts)
  }

  async waitFor(selector, { timeout = 15000 } = {}) {
    await until(
      async () => this.eval(`!!document.querySelector(${JSON.stringify(selector)})`),
      { timeout, label: `${selector} の表示` },
    )
  }

  async text(selector) {
    return this.eval(
      `(document.querySelector(${JSON.stringify(selector)})?.textContent ?? '').replace(/\\s+/g, ' ').trim()`,
    )
  }

  async count(selector) {
    return this.eval(`document.querySelectorAll(${JSON.stringify(selector)}).length`)
  }

  async bodyText() {
    return this.eval(`document.body.innerText.replace(/\\s+/g, ' ')`)
  }

  /** 実際のマウス操作で押す。ユーザー操作として扱われるので音の unlock も確かめられる */
  async click(text, { within = 'body' } = {}) {
    const box = await this.eval(`(() => {
      const root = document.querySelector(${JSON.stringify(within)})
      const want = ${JSON.stringify(text)}.replace(/\\s+/g, '')
      const all = [...root.querySelectorAll('button, a')]
      // 完全一致を先に見る。「記録する」が「時間だけ記録する」に当たるのを避ける
      const el = all.find((e) => e.textContent.replace(/\\s+/g, '') === want)
        ?? all.find((e) => e.textContent.replace(/\\s+/g, '').includes(want))
      if (!el) return null
      el.scrollIntoView({ block: 'center' })
      const r = el.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, disabled: !!el.disabled, label: el.textContent.trim() }
    })()`)
    if (box === null) throw new Error(`ボタンが見つかりません: ${text}`)
    if (box.disabled) throw new Error(`ボタンが押せません: ${text}`)
    const common = { x: box.x, y: box.y, button: 'left', clickCount: 1 }
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...common })
    await sleep(60)
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...common })
    await sleep(120)
    return box.label
  }

  /** ボタンが押せる状態かを見る */
  async disabled(text, { within = 'body' } = {}) {
    const state = await this.eval(`(() => {
      const root = document.querySelector(${JSON.stringify(within)})
      if (!root) return 'なし'
      const want = ${JSON.stringify(text)}.replace(/\\s+/g, '')
      const all = [...root.querySelectorAll('button')]
      const el = all.find((e) => e.textContent.replace(/\\s+/g, '') === want)
        ?? all.find((e) => e.textContent.replace(/\\s+/g, '').includes(want))
      return el ? !!el.disabled : 'なし'
    })()`)
    if (state === 'なし') throw new Error(`ボタンが見つかりません: ${text}`)
    return state
  }

  /** URL でホームに戻る。段階と段階のあいだを、前の段階の失敗から切り離す */
  async goHome() {
    await this.cdp.send('Page.navigate', { url: APP })
    await this.waitFor('.home')
  }

  /** React が管理する input に値を入れる */
  async fill(selector, value) {
    return this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (!el) throw new Error('入力欄が見つかりません')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(el, ${JSON.stringify(value)})
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return el.value
    })()`)
  }

  async shot(name) {
    const { data } = await this.cdp.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(data, 'base64'))
  }

  /** 残り時間を秒で読む */
  async remainingSeconds() {
    const t = await this.text('.clock')
    const m = /(\d+):(\d+)/.exec(t)
    if (m === null) throw new Error(`残り時間を読めません: ${t}`)
    return Number(m[1]) * 60 + Number(m[2])
  }
}

export function assert(condition, message) {
  if (!condition) throw new Error(message)
}

export function assertIncludes(haystack, needle) {
  assert(
    haystack.includes(needle),
    `「${needle}」が見つかりません（実際: ${haystack.slice(0, 120)}）`,
  )
}

export function assertExcludes(haystack, needle) {
  assert(!haystack.includes(needle), `「${needle}」が出ています`)
}

export { sleep, until }
