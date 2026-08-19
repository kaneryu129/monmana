/**
 * MVP 通し確認（#46）のうち、デスクトップ Chrome で自動化できる範囲を通す。
 *
 * 手順は docs/mvp-checklist.md に対応させている。
 * 実機でしか確かめられない項目は skip() として結果に残す。
 */
import { writeFileSync } from 'node:fs'
import { Run, assert, assertIncludes, assertExcludes, sleep, OUT, APP } from './harness.mjs'

// 先に配信を確かめる。落ちていると原因の分かりにくい待機失敗になる
try {
  await fetch(APP)
} catch {
  console.error(`${APP} に繋がりません。先に別のタブで npm run preview を動かしてください。`)
  process.exit(2)
}

const run = new Run()
await run.launch()

const startedRealMs = Date.now()

// ───────────────────────────────────────────── 第 1 段階: 起動と表示
run.setStep('第 1 段階: 起動と表示')
await run.open()
await run.shot('01-home-first')

await run.check('ホーム画面が表示される', async () => {
  assert(await run.count('.home'), 'ホームが描画されていない')
})
await run.check(
  '「いまは記録を保存できません」が出ていない（IndexedDB が動いている）',
  async () => {
    assertExcludes(await run.bodyText(), 'いまは記録を保存できません')
    const persisted = await run.eval(
      `(async () => {
    const dbs = await indexedDB.databases()
    return dbs.map((d) => d.name + '@' + d.version).join(',')
  })()`,
      { awaitPromise: true },
    )
    assert(persisted.includes('monmana'), `IndexedDB に monmana がない（${persisted}）`)
    return persisted
  },
)
await run.check('日付が今日になっている', async () => {
  const d = new Date()
  const want = `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
  assertIncludes(await run.text('.home__date'), want)
  return want
})
await run.check('挨拶が出ている（初回なので「はじめまして。」）', async () => {
  assertIncludes(await run.text('.home__greeting'), 'はじめまして。')
})
await run.check('モンステラが表示されている', async () => {
  const paths = await run.count('.plantcard svg path')
  assert(paths > 0, 'モンステラの図形がない')
  return `${paths} 個の図形`
})
await run.check('統計が 0 から始まっている', async () => {
  const stats = await run.text('.stats')
  assertIncludes(stats, '0')
  return stats
})
await run.check('「モンステラを見る」で植物ビューへ移動できる', async () => {
  await run.click('モンステラを見る')
  await run.waitFor('.plantview')
})
await run.check('「← 戻る」でホームへ戻れる', async () => {
  await run.click('戻る')
  await run.waitFor('.home')
})
run.skip('アイコンが斑入りモンステラになっている', 'ホーム画面に追加した状態でしか見えない')
run.skip('起動時に Safari の枠が出ず全画面になる', 'iOS の standalone 表示')
run.skip('「ホーム画面に追加すると…」が出ていない', '追加済みと判定できるのは iOS 実機のみ')
run.skip('ノッチやホームバーに文字が隠れていない', '実機の安全領域')

// ───────────────────────────────────────────── 第 2 段階: 25 分タイマー
run.setStep('第 2 段階: 25 分タイマー')
await run.check('「25分、勉強を始める」でタイマー画面に切り替わる', async () => {
  await run.click('25分、勉強を始める')
  await run.waitFor('.timer')
})
await run.shot('02-timer-start')

await run.check('25:00 から始まる', async () => {
  const left = await run.remainingSeconds()
  assert(left >= 1498 && left <= 1500, `残りが ${left} 秒`)
  return `${left} 秒`
})
await run.check('履歴や統計が表示されていない', async () => {
  const body = await run.bodyText()
  for (const word of ['直近の記録', '累計', '連続']) assertExcludes(body, word)
})
await run.check('カテゴリを選べる。選び直しも解除もできる', async () => {
  await run.click('英語')
  assert((await run.count('.cat--on')) === 1, '選択が反映されない')
  await run.click('英語')
  assert((await run.count('.cat--on')) === 0, '解除できない')
})
await run.check('「音 オン」と出ている', async () => {
  assertIncludes(await run.text('.timer__soundrow'), '音 オン')
})

await run.check('「音を試す」で実際に音の再生が始まる', async () => {
  const before = await run.eval('window.__audio.calls')
  await run.click('音を試す')
  await sleep(1200)
  const state = await run.eval(`({
    calls: window.__audio.calls,
    started: window.__audio.started,
    rejected: window.__audio.rejected,
    duration: window.__audio.last ? window.__audio.last.duration : null,
    currentTime: window.__audio.last ? window.__audio.last.currentTime : null,
  })`)
  assert(state.calls > before, 'play() が呼ばれていない')
  assert(state.rejected.length === 0, `再生を拒否された: ${state.rejected.join(' / ')}`)
  assert(state.started > 0, '再生が始まらなかった')
  assert(state.duration > 0, `音の長さが ${state.duration}`)
  assert(state.currentTime > 0, '再生位置が進んでいない')
  return `${state.duration.toFixed(2)} 秒の音を ${state.currentTime.toFixed(2)} 秒まで再生`
})
await run.check('「聞こえないときは、本体の消音スイッチを…」の案内が出る', async () => {
  assertIncludes(await run.text('.timer__soundnote'), '消音スイッチ')
})
run.skip('本体の消音スイッチを消音側にしても鳴る', 'iOS の消音スイッチ（ADR-0016 の本題）')

await run.check('一時停止すると残り時間が止まる', async () => {
  await run.click('一時停止')
  const a = await run.remainingSeconds()
  await sleep(3200)
  const b = await run.remainingSeconds()
  assert(a === b, `${a} 秒 → ${b} 秒 に動いた`)
  return `${a} 秒のまま`
})
await run.check('再開すると続きから進む', async () => {
  const a = await run.remainingSeconds()
  await run.click('再開する')
  await sleep(2500)
  const b = await run.remainingSeconds()
  const moved = a - b
  assert(moved >= 2 && moved <= 4, `2 秒待って ${moved} 秒動いた`)
  return `${moved} 秒進んだ`
})
await run.check('一時停止のあいだの時間が経過に含まれていない', async () => {
  const left = await run.remainingSeconds()
  const wall = Math.round((Date.now() - startedRealMs) / 1000)
  assert(
    1500 - left < wall - 3,
    `残り ${left} 秒。実時間 ${wall} 秒ぶん経っているのに引かれすぎている`,
  )
  return `経過 ${1500 - left} 秒 < 実時間 ${wall} 秒`
})

await run.check('画面を離れているあいだも経過が正しく進む（ADR-0001 リスク 2）', async () => {
  const before = await run.remainingSeconds()
  let how = 'frozen'
  try {
    await run.cdp.send('Page.setWebLifecycleState', { state: 'frozen' })
  } catch (e) {
    how = `凍結できず素の待機（${e.message.slice(0, 40)}）`
  }
  const wallStart = Date.now()
  await sleep(15000)
  try {
    await run.cdp.send('Page.setWebLifecycleState', { state: 'active' })
  } catch {
    /* 凍結できていない */
  }
  // 復帰直後は再描画がまだ走っていない。画面が追いつくのを待ってから読む
  await sleep(2000)
  const after = await run.remainingSeconds()
  const wall = Math.round((Date.now() - wallStart) / 1000)
  const moved = before - after
  assert(Math.abs(moved - wall) <= 2, `実時間 ${wall} 秒に対し ${moved} 秒しか動いていない`)
  return `${how}／実時間 ${wall} 秒に対し ${moved} 秒進んだ`
})

await run.check('25 分たつと終了音が鳴り、完了画面に切り替わる', async () => {
  const before = await run.eval(
    '({ calls: window.__audio.calls, started: window.__audio.started })',
  )
  const left = await run.remainingSeconds()
  // 残り 3 秒の位置まで時計を進める。進み方は実時間のまま
  await run.eval(`window.__clock.offset += ${(left - 3) * 1000}`)
  await sleep(4500)
  await run.waitFor('.done')
  // 画面が切り替わった時点では play() の Promise がまだ成立していないことがある
  await sleep(700)
  const state = await run.eval(
    `({ calls: window.__audio.calls, started: window.__audio.started, rejected: window.__audio.rejected })`,
  )
  assert(state.calls > before.calls, '終了時に play() が呼ばれていない')
  // 背面から戻った直後は最初の再生が止まる。読み直して鳴らし直すため（#89）、
  // ここでの AbortError は想定内。実際に音が進んだかどうかで判定する
  const heard = await run.eval(`window.__audio.last ? window.__audio.last.currentTime : 0`)
  assert(heard > 0, `再生位置が進んでいない（拒否: ${state.rejected.join(' / ') || 'なし'}）`)
  const retried = state.rejected.length > 0 ? '（一度止まったが読み直して復帰）' : ''
  return `${heard.toFixed(2)} 秒ぶん進んだ${retried}`
})
run.skip('（Android）軽く振動する', '実機がない。iPhone では振動しないのが正しい')
run.skip(
  '画面をロックしたまま 25 分を迎えたときに音が鳴るか',
  'iOS のロック中の音声再生（ADR-0001 リスク 3）',
)
await run.shot('03-done-levelup-lv2')

// ───────────────────────────────────────────── 第 3 段階: 完了画面と記録
run.setStep('第 3 段階: 完了画面と記録')
await run.check('初回は Lv.2 へのレベルアップとして祝われる', async () => {
  assertIncludes(await run.text('.done__title'), 'Lv.2 になりました')
  assertIncludes(await run.text('.done__lead'), '芽がまっすぐ伸びました。')
})
await run.check('「今回 25分」「今日 25分」が出ている', async () => {
  const pills = await run.text('.pills')
  assertIncludes(pills, '今回 25分')
  assertIncludes(pills, '今日 25分')
  return pills
})
await run.check('ひとことメモを入れられる。空でも進める', async () => {
  await run.fill('.memo__input', '通し確認')
  await run.eval(
    `document.querySelector('.memo__input').dispatchEvent(new Event('blur', { bubbles: true }))`,
  )
  await sleep(300)
})
await run.check('ホームに戻ると今日 25分・連続 1日・直近の記録が反映されている', async () => {
  await run.click('ホームへ戻る')
  await run.waitFor('.home')
  const stats = await run.text('.stats')
  assertIncludes(stats, '25')
  assertIncludes(stats, '1')
  const recent = await run.text('.recent')
  assertIncludes(recent, '25分')
  assertIncludes(recent, '今日')
  return `${stats} ／ ${recent}`
})
await run.shot('04-home-after-session')

await run.check('途中終了ではしずくが付かず、責める文言も出ない', async () => {
  await run.click('25分、勉強を始める')
  await run.waitFor('.timer')
  await run.click('終了する')
  await run.waitFor('.done')
  const body = await run.bodyText()
  assertExcludes(body, 'モンステラに水が届きました')
  for (const word of ['未達成', 'サボ', '失われ', 'していません']) assertExcludes(body, word)
  return await run.text('.done__lead')
})
await run.check('途中終了ぶんでホームの「今日」が増えていない', async () => {
  await run.click('ホームへ戻る')
  await run.waitFor('.home')
  const stats = await run.text('.stats')
  assertIncludes(stats, '25')
  return stats
})

// ───────────────────────────────────────────── 第 4 段階: レベルアップと斑
run.setStep('第 4 段階: レベルアップと斑')
await run.check('600 分で「24 しずく たまります」と出る', async () => {
  await run.click('時間だけ記録する')
  await run.waitFor('.sheet__drops')
  await run.fill('.field__input input', '600')
  await sleep(200)
  assertIncludes(await run.text('.sheet__drops'), '24')
})
await run.check('601 分は記録できず、責めない文言で範囲を伝える', async () => {
  await run.fill('.field__input input', '601')
  await sleep(200)
  assert(await run.disabled('記録する', { within: '.sheet' }), '601 でも押せてしまう')
  const hint = await run.text('.field__hint')
  assertIncludes(hint, '1 から 600 までの分数を入れてください。')
  for (const word of ['エラー', '無効', 'ダメ']) assertExcludes(hint, word)
  return hint
})
await run.check('0 分・負の数も記録できない', async () => {
  await run.fill('.field__input input', '0')
  await sleep(150)
  assert(await run.disabled('記録する', { within: '.sheet' }), '0 でも押せてしまう')
  await run.fill('.field__input input', '-5')
  await sleep(150)
  assert(await run.disabled('記録する', { within: '.sheet' }), '-5 でも押せてしまう')
})
await run.check('600 分を記録するとレベルアップの演出が出る', async () => {
  await run.fill('.field__input input', '600')
  await sleep(200)
  await run.click('記録する', { within: '.sheet' })
  await run.waitFor('.done--levelup')
  const main = await run.text('.done__actions .btn--main')
  assertIncludes(main, 'モンステラを見る')
  return await run.text('.done__title')
})
await run.shot('05-levelup-lv7')
await run.check('もう一度 600 分で Lv.10「はじめての白い斑」に届く', async () => {
  await run.goHome()
  await run.click('時間だけ記録する')
  await run.waitFor('.sheet__drops')
  await run.fill('.field__input input', '600')
  await sleep(200)
  await run.click('記録する', { within: '.sheet' })
  await run.waitFor('.done--levelup')
  assertIncludes(await run.text('.done__title'), 'Lv.10 になりました')
  assertIncludes(
    await run.text('.done__lead'),
    'あなたのモンステラに、はじめての白い斑が現れました。',
  )
})
await run.check('モンステラに白い斑が描かれている', async () => {
  const varie = await run.count('.done [fill="var(--plant-varie)"]')
  assert(varie > 0, '斑の図形がない')
  return `${varie} 枚に斑`
})
await run.shot('06-levelup-lv10')

await run.check('植物ビューが「成長 Lv.10 ／ 斑入りモンステラ」になっている', async () => {
  await run.click('モンステラを見る', { within: '.done' })
  await run.waitFor('.plantview')
  assertIncludes(await run.text('.plantview__level'), 'Lv.10')
  assertIncludes(await run.text('.plantview__name'), '斑入りモンステラ')
})
await run.check('「育てた葉」の枚数と実際に描かれている葉の数が一致する', async () => {
  const shown = await run.text('.plantview__numbers')
  const m = /育てた葉 (\d+)枚/.exec(shown)
  assert(m !== null, `枚数の表示を読めない: ${shown}`)
  // 手描き風の輪郭は影の層を重ねて作る（ADR-0008）。影は同じ葉の複製なので数から外す
  const drawn = await run.eval(`[...document.querySelectorAll('.plantview .monstera__leaf')]
    .filter((el) => !el.closest('.monstera__ghost')).length`)
  assert(Number(m[1]) === drawn, `表示 ${m[1]} 枚 / 描画 ${drawn} 枚`)
  return `どちらも ${drawn} 枚`
})
await run.check('成長履歴に「Lv.10 達成」と「はじめての斑入りの葉」が並んでいる', async () => {
  const marks = await run.text('.marks')
  assertIncludes(marks, 'Lv.10 達成')
  assertIncludes(marks, 'はじめての斑入りの葉')
})
await run.check('成長履歴が新しい順に並んでいる', async () => {
  const labels = await run.eval(
    `[...document.querySelectorAll('.mark__label')].map((e) => e.textContent.trim())`,
  )
  assert(
    labels[0] === 'はじめての斑入りの葉' || labels[0].includes('Lv.10'),
    `先頭が ${labels[0]}`,
  )
  const levels = labels
    .filter((l) => l.includes('達成'))
    .map((l) => Number(/Lv\.(\d+)/.exec(l)[1]))
  for (let i = 1; i < levels.length; i++) {
    assert(levels[i] < levels[i - 1], `Lv.${levels[i - 1]} の次に Lv.${levels[i]} が来ている`)
  }
  return labels.join(' / ')
})
await run.check('葉をタップすると育った時期が出る', async () => {
  await run.eval(
    `document.querySelector('.plantview .monstera__leaf[role="button"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))`,
  )
  await sleep(300)
  const note = await run.text('.plantview__leafnote')
  assertIncludes(note, 'この葉は、累計')
  return note
})
await run.shot('07-plantview-lv10')

// ── 通常回（レベルアップしない回）の完了画面
run.setStep('第 3 段階（続き）: レベルアップしない回の完了画面')
await run.check('レベルが上がらない回は「おつかれさま！」になる', async () => {
  await run.goHome()
  await run.click('25分、勉強を始める')
  await run.waitFor('.timer')
  const left = await run.remainingSeconds()
  await run.eval(`window.__clock.offset += ${(left - 2) * 1000}`)
  await sleep(3500)
  await run.waitFor('.done')
  assertIncludes(await run.text('.done__title'), 'おつかれさま！')
  assertIncludes(await run.text('.done__lead'), '25分の学びで、 モンステラに水が届きました。')
})
await run.check('モンステラが反応し、水滴が落ちる', async () => {
  assert(await run.count('.monstera--react'), '反応の演出が付いていない')
  assert(await run.count('.monstera__drop'), '水滴がない')
})
await run.check('「次のレベルまで あと n しずく」が出ている', async () => {
  const next = await run.text('.done__next')
  assertIncludes(next, '次のレベルまで あと')
  return next
})
await run.shot('08-done-normal')

// ───────────────────────────────────────────── 第 5 段階: オフラインと保持
run.setStep('第 5 段階: オフラインと保持')
await run.goHome()

await run.check('Service Worker が有効になっている', async () => {
  const state = await run.eval(
    `(async () => {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return 'なし'
    await navigator.serviceWorker.ready
    return reg.active ? 'active' : 'まだ有効でない'
  })()`,
    { awaitPromise: true },
  )
  assert(state === 'active', `Service Worker が ${state}`)
  return state
})
await run.check('オフラインにして再読み込みしても開く', async () => {
  const beforeOffline = await run.text('.stats')
  await run.cdp.send('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  })
  await run.cdp.send('Page.reload')
  await run.waitFor('.home', { timeout: 20000 })
  const after = await run.text('.stats')
  assert(after === beforeOffline, `オフライン前「${beforeOffline}」→ 後「${after}」`)
  return after
})
await run.check('オフラインのままタイマーを始められる', async () => {
  await run.click('25分、勉強を始める')
  await run.waitFor('.timer')
  await run.click('終了する')
  await run.waitFor('.done')
  await run.click('ホームへ戻る')
  await run.waitFor('.home')
})
await run.check('オフラインのまま手動記録ができる', async () => {
  await run.click('時間だけ記録する')
  await run.waitFor('.sheet__drops')
  await run.fill('.field__input input', '30')
  await sleep(200)
  await run.click('記録する', { within: '.sheet' })
  await run.waitFor('.done')
  await run.click('ホームへ戻る')
  await run.waitFor('.home')
  return await run.text('.stats')
})
await run.cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1,
})

const before = await run.text('.stats')
await run.check('記録を書き出せる', async () => {
  await run.click('モンステラを見る')
  await run.waitFor('.plantview')
  await run.click('記録の持ち出し')
  await run.click('書き出す')
  await sleep(1200)
  const { readdirSync, readFileSync } = await import('node:fs')
  const files = readdirSync(`${OUT}/downloads`).filter((f) => f.endsWith('.json'))
  assert(files.length > 0, '書き出したファイルがない')
  const json = JSON.parse(readFileSync(`${OUT}/downloads/${files[0]}`, 'utf8'))
  assert(Array.isArray(json.sessions) && json.sessions.length > 0, '記録が入っていない')
  writeFileSync(`${OUT}/backup.json`, JSON.stringify(json))
  return `${files[0]} / ${json.sessions.length} 件`
})
await run.check('関係ないファイルは取り込まれず、いまの記録が守られる', async () => {
  writeFileSync(`${OUT}/not-a-backup.txt`, 'これはバックアップではありません')
  const node = await run.cdp.send('DOM.getDocument')
  const input = await run.cdp.send('DOM.querySelector', {
    nodeId: node.root.nodeId,
    selector: 'input[type=file]',
  })
  await run.cdp.send('DOM.setFileInputFiles', {
    nodeId: input.nodeId,
    files: [`${OUT}/not-a-backup.txt`],
  })
  await sleep(600)
  assertIncludes(await run.text('.backup__message'), 'いまの記録はそのままです。')
  await run.click('戻る')
  await run.waitFor('.home')
  assert((await run.text('.stats')) === before, '記録が変わってしまった')
})
await run.check('書き出したファイルを取り込むと元に戻る', async () => {
  await run.click('モンステラを見る')
  await run.waitFor('.plantview')
  await run.click('記録の持ち出し')
  const node = await run.cdp.send('DOM.getDocument')
  const input = await run.cdp.send('DOM.querySelector', {
    nodeId: node.root.nodeId,
    selector: 'input[type=file]',
  })
  await run.cdp.send('DOM.setFileInputFiles', {
    nodeId: input.nodeId,
    files: [`${OUT}/backup.json`],
  })
  await sleep(800)
  assertIncludes(await run.text('.backup__message'), '件の記録を取り込みました。')
  await run.click('戻る')
  await run.waitFor('.home')
  return await run.text('.stats')
})

const beforeQuit = await run.text('.stats')
const levelBeforeQuit = await run.text('.plantcard__level')
await run.shot('09-home-before-quit')

await run.check('ブラウザを完全に終了して開き直しても記録が残っている', async () => {
  await run.quit()
  await run.launch({ fresh: false })
  await run.open()
  const stats = await run.text('.stats')
  const level = await run.text('.plantcard__level')
  assert(stats === beforeQuit, `終了前「${beforeQuit}」→ 再起動後「${stats}」`)
  assert(level === levelBeforeQuit, `終了前「${levelBeforeQuit}」→ 再起動後「${level}」`)
  return `${stats} ／ ${level}`
})
await run.check('成長履歴も残っている', async () => {
  await run.click('モンステラを見る')
  await run.waitFor('.plantview')
  const marks = await run.text('.marks')
  assertIncludes(marks, 'Lv.10 達成')
  assertIncludes(marks, 'はじめての斑入りの葉')
})
await run.shot('10-plantview-after-restart')

run.skip(
  '7 日間触らなくても記録が残っている',
  'iOS のストレージ削除（ADR-0001 リスク 1）。日をまたぐ必要がある',
)
run.skip('翌日「今日」が 0 分に戻り、累計が減っていない', '日をまたぐ必要がある')
run.skip('機内モードでの起動', '実機の機内モード。オフライン相当はここで確認済み')

// ───────────────────────────────────────────── 結果
const ok = run.results.filter((r) => r.state === 'ok').length
const ng = run.results.filter((r) => r.state === 'ng').length
const device = run.results.filter((r) => r.state === 'device').length
console.log(`\n合計 ${run.results.length} 件 / 合格 ${ok} / 不合格 ${ng} / 実機のみ ${device}`)

writeFileSync(
  `${OUT}/results.json`,
  JSON.stringify(
    {
      at: new Date().toISOString(),
      app: APP,
      summary: { ok, ng, device },
      results: run.results,
    },
    null,
    2,
  ),
)

await run.quit()
process.exit(ng > 0 ? 1 : 0)
