#!/usr/bin/env python3
"""mockups.html を書き出す。"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from screens import (MATURE, STAGE1, STAGE5, STAGE10, STYLE_VARS,  # noqa: E402
                     SCREENS, TOKENS, W, H)

SCREEN_CSS = f"""
  .scr{{
    position:relative; width:{W}px; height:{H}px; overflow:hidden;
    background:var(--paper); color:var(--ink); font-family:var(--fb);
    border-radius:32px; border:1px solid var(--edge); flex:none;
    display:flex; flex-direction:column;
  }}
  .bar{{display:flex;justify-content:space-between;padding:14px 26px 2px;
        font-size:12px;color:var(--ink-3);letter-spacing:.04em;flex:none}}
  .bar__r{{letter-spacing:-2px}}
  .pad{{padding:18px 26px 26px;display:flex;flex-direction:column;gap:14px;flex:1;min-height:0}}
  .pad--center{{align-items:center;text-align:center;justify-content:center;gap:16px}}

  .brand{{font-family:var(--fd);font-size:19px;letter-spacing:.14em;color:var(--green)}}
  .date{{font-size:12px;color:var(--ink-3);letter-spacing:.08em;margin-top:-10px}}
  .greet{{font-family:var(--fd);font-size:17px;line-height:1.85;margin:2px 0 0;color:var(--ink)}}

  .plantcard{{background:var(--paper-2);border:1px solid var(--edge);border-radius:var(--r);
    padding:14px 12px 12px;display:flex;flex-direction:column;align-items:center;gap:4px;
    font:inherit;color:inherit;cursor:pointer;text-align:center;width:100%}}
  .plantcard__lv{{font-size:12px;color:var(--green);letter-spacing:.06em}}
  .plantcard__go{{font-size:11px;color:var(--ink-3)}}

  .stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}}
  .stat{{background:var(--white);border:1px solid var(--edge);border-radius:10px;
    padding:9px 4px;text-align:center}}
  .stat__v{{font-size:19px;color:var(--green);font-variant-numeric:tabular-nums;line-height:1.3}}
  .stat__u{{font-size:10px;margin-left:1px;color:var(--ink-2)}}
  .stat__l{{font-size:10px;color:var(--ink-3);letter-spacing:.1em;margin-top:1px}}

  .btn{{width:100%;border-radius:999px;padding:15px;font:inherit;font-size:15px;
    cursor:pointer;border:1px solid transparent;letter-spacing:.04em}}
  .btn--main{{background:var(--green);color:var(--paper);border-color:var(--green)}}
  .btn--sub{{background:transparent;color:var(--green);border-color:var(--edge)}}
  .btn--ghost{{background:transparent;color:var(--ink-2);border-color:var(--edge);padding:13px}}
  .btn:focus-visible{{outline:2px solid var(--green);outline-offset:2px}}

  .recent{{margin-top:2px;display:flex;flex-direction:column;gap:7px}}
  .recent__h{{font-size:11px;color:var(--ink-3);letter-spacing:.14em}}
  .rec{{display:flex;gap:10px;align-items:baseline;font-size:12px;
    border-bottom:1px solid var(--edge);padding-bottom:6px}}
  .rec__t{{color:var(--green);font-variant-numeric:tabular-nums}}
  .rec__c{{color:var(--ink-2)}}
  .rec__d{{margin-left:auto;color:var(--ink-3);font-size:11px}}

  .scr--quiet{{background:var(--paper)}}
  .cats{{display:flex;gap:7px;justify-content:center}}
  .cats--left{{justify-content:flex-start}}
  .cat{{font-size:12px;padding:5px 13px;border-radius:999px;border:1px solid var(--edge);color:var(--ink-3)}}
  .cat--on{{background:var(--green-pale);border-color:var(--green-pale);color:var(--green)}}
  .clock{{font-family:var(--fd);font-size:76px;letter-spacing:.03em;color:var(--green);
    font-variant-numeric:tabular-nums;line-height:1.2;margin:14px 0 4px}}
  .cheer{{font-family:var(--fd);font-size:14px;line-height:1.9;color:var(--ink-2);margin:0}}
  .timerbtns{{display:flex;gap:10px;width:100%;margin-top:26px}}
  .soundlink{{font-size:11px;color:var(--ink-3);letter-spacing:.08em;margin-top:6px}}

  .done__h{{font-family:var(--fd);font-size:23px;font-weight:500;margin:0;color:var(--green)}}
  .done__s{{font-family:var(--fd);font-size:14px;line-height:1.9;color:var(--ink-2);margin:0}}
  .pills{{display:flex;gap:8px}}
  .pill{{font-size:12px;color:var(--ink-2);background:var(--white);border:1px solid var(--edge);
    border-radius:999px;padding:6px 14px}}
  .pill b{{color:var(--green);font-weight:600}}
  .next{{font-size:12px;color:var(--ink-2)}}
  .next b{{color:var(--green);font-size:15px}}
  .memo{{width:100%;border:1px dashed var(--edge);border-radius:10px;padding:12px;
    font-size:12px;color:var(--ink-3);text-align:left;background:var(--white)}}
  .memo--sheet{{color:var(--ink);border-style:solid}}

  .scr--celebrate{{background:linear-gradient(180deg,#FFFDF7 0%,var(--paper) 46%)}}
  .spark{{font-size:17px;color:#C7B27A;letter-spacing:.5em}}
  .lv__h{{font-family:var(--fd);font-size:25px;font-weight:500;margin:0;color:var(--green)}}
  .lv__s{{font-family:var(--fd);font-size:14px;line-height:1.9;margin:0;color:var(--ink)}}
  .lv__t{{font-size:12px;line-height:1.9;color:var(--ink-2);margin:0}}
  .textlink{{font-size:12px;color:var(--ink-3);letter-spacing:.06em;padding:4px}}

  .scr--view{{background:radial-gradient(120% 62% at 50% 34%,#FFFEFA 0%,var(--paper) 58%,var(--paper-2) 100%)}}
  .bar--light{{color:var(--ink-3)}}
  .back{{padding:2px 26px 0;font-size:12px;color:var(--ink-2);letter-spacing:.06em;flex:none}}
  .stage{{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;padding:4px 0}}
  .viewinfo{{padding:0 26px 30px;display:flex;flex-direction:column;gap:5px;align-items:center;text-align:center;flex:none}}
  .viewinfo__lv{{font-size:12px;color:var(--green);letter-spacing:.14em}}
  .viewinfo__nm{{font-family:var(--fd);font-size:19px;color:var(--ink)}}
  .viewinfo__row{{display:flex;gap:18px;font-size:12px;color:var(--ink-2);margin-top:2px}}
  .viewinfo__row b{{color:var(--green)}}
  .marks{{margin-top:12px;display:flex;flex-direction:column;gap:6px;width:100%}}
  .mark{{display:flex;gap:11px;font-size:11px;color:var(--ink-2);
    border-top:1px solid var(--edge);padding-top:6px;text-align:left}}
  .mark__d{{color:var(--ink-3);font-variant-numeric:tabular-nums;flex:none}}

  .scr--modal{{background:var(--paper)}}
  .dim{{position:absolute;inset:0;background:rgba(42,49,44,.30)}}
  .sheet{{position:absolute;left:0;right:0;bottom:0;background:var(--paper);
    border-radius:22px 22px 0 0;padding:12px 26px 26px;display:flex;flex-direction:column;
    gap:10px;align-items:center;text-align:center}}
  .sheet__grip{{width:36px;height:4px;border-radius:2px;background:var(--edge);margin-bottom:4px}}
  .sheet__h{{font-family:var(--fd);font-size:18px;font-weight:500;margin:0 0 2px;color:var(--ink)}}
  .field{{display:flex;justify-content:space-between;align-items:baseline;width:100%;
    background:var(--white);border:1px solid var(--edge);border-radius:10px;padding:13px 15px}}
  .field__l{{font-size:11px;color:var(--ink-3);letter-spacing:.1em;width:100%;text-align:left}}
  .field__i{{font-size:23px;color:var(--green);font-variant-numeric:tabular-nums;flex:none}}
  .field__u{{font-size:12px;color:var(--ink-2);margin-left:3px}}
  .drops{{font-size:12px;color:var(--ink-2);margin-top:2px}}
  .drops b{{color:var(--green);font-size:15px}}
"""

PAGE_CSS = f"""
  :root{{{TOKENS}
    --bg:#EFEDE5; --tx:#262F29; --tx2:#66706A; --tx3:#97A099; --rule:#DCD7C9; --ac:#2C5340;}}
  @media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{
    --bg:#151815; --tx:#E7EAE3; --tx2:#A0A89E; --tx3:#737B72; --rule:#2E332C; --ac:#93BC9E;}}}}
  :root[data-theme="dark"]{{
    --bg:#151815; --tx:#E7EAE3; --tx2:#A0A89E; --tx3:#737B72; --rule:#2E332C; --ac:#93BC9E;}}
  *{{box-sizing:border-box}}
  body{{margin:0;background:var(--bg);color:var(--tx);font-family:var(--fb);
    font-size:15px;line-height:1.85;-webkit-font-smoothing:antialiased}}
  .wrap{{max-width:82rem;margin:0 auto;padding:clamp(2.5rem,6vw,4.5rem) clamp(1.25rem,4vw,3rem) 6rem;
    display:flex;flex-direction:column;gap:clamp(2.5rem,5vw,4rem)}}
  .eyebrow{{font-size:13px;letter-spacing:.22em;color:var(--tx3);margin:0}}
  h1{{font-family:var(--fd);font-size:clamp(1.9rem,4vw,2.2rem);font-weight:500;
    line-height:1.4;letter-spacing:.02em;margin:.5rem 0 0;text-wrap:balance}}
  .lead{{max-width:38em;margin:1rem 0 0;color:var(--tx2)}}
  .flowbox{{border-top:1px solid var(--rule);padding-top:2rem;display:flex;flex-direction:column;gap:1rem}}
  h2{{font-family:var(--fd);font-size:1.3rem;font-weight:500;letter-spacing:.03em;margin:0}}
  .grid{{display:flex;flex-wrap:wrap;gap:clamp(1.5rem,3vw,2.5rem);justify-content:center}}
  .cell{{display:flex;flex-direction:column;gap:.85rem;max-width:{W}px}}
  .cap__h{{display:flex;align-items:baseline;gap:.7rem;flex-wrap:wrap}}
  .cap__n{{font-family:var(--fd);font-size:1.15rem;letter-spacing:.03em}}
  .cap__s{{font-size:12px;color:var(--ac);letter-spacing:.08em}}
  .cap__d{{font-size:13px;color:var(--tx2);margin:0}}
  pre.mermaid{{background:transparent;text-align:center;overflow-x:auto}}
  .note{{border-left:2px solid var(--ac);padding-left:1.1rem;max-width:42em;
    display:flex;flex-direction:column;gap:.4rem}}
  .note p{{margin:0;font-size:13px;color:var(--tx2)}}
  .closing{{border-top:1px solid var(--rule);padding-top:2rem;display:flex;
    flex-direction:column;gap:.9rem;max-width:44em}}
  .closing p{{margin:0;color:var(--tx2)}}
  .closing ul{{margin:0;padding-left:1.2em;color:var(--tx2);display:flex;flex-direction:column;gap:.35rem}}
"""

MERMAID = """flowchart TD
  H["ホーム"] -->|"25分、勉強を始める"| T["タイマー"]
  T -->|"25分完了 / 途中で終了"| C["完了・成長演出"]
  C -->|"もう25分続ける"| T
  C -->|"ホームへ戻る"| H
  H -->|"時間だけ記録する"| R["手動記録モーダル"]
  R -->|"保存"| C
  H -->|"モンステラを見る"| P["植物ビュー"]
  C -->|"モンステラを見る"| P
  P -->|"戻る"| H"""


def main():
    out = ['<!-- @dsCard group="Screens" -->', '<title>モンまな 画面モックアップ</title>',
           f'<style>{PAGE_CSS}{SCREEN_CSS}']
    for k, v in STYLE_VARS.items():
        out.append(f'.{k}{{{v}}}')
    out.append('.ghost{opacity:.38;transform:translate(2px,2.4px)}')
    out.append('svg.hand{height:auto;display:block}</style>')

    out.append('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
               f'<clipPath id="cp" clipPathUnits="userSpaceOnUse" clip-rule="evenodd">'
               f'<path d="{MATURE}"/></clipPath>')
    for sid, body in [("stage-1", STAGE1), ("stage-5", STAGE5), ("stage-10", STAGE10)]:
        out.append(f'<symbol id="{sid}" viewBox="0 0 240 268">{body}</symbol>')
    out.append('</defs></svg>')

    out.append(f'''<div class="wrap">
<header>
  <p class="eyebrow">モンまな ／ 画面設計</p>
  <h1>6 画面のモックアップ</h1>
  <p class="lead">仕様書 3〜9 章の画面を iPhone の寸法（{W}×{H}）で組みました。
  モンステラは ADR-0008 で決めた手描き風です。実装はこの見た目を参照します。</p>
  <div class="note">
    <p><b>寸法を iPhone に合わせた理由。</b>ADR-0007 で iPhone を実利用の主環境と定めたため、
    最も制約の厳しい画面幅で成立することを先に確かめています。</p>
    <p><b>文言は仕様書 13 章に従いました。</b>ユーザーを責める表現は使っていません。
    休んだ後でも「おかえり」で迎えます。</p>
  </div>
</header>

<section class="flowbox">
  <h2>画面遷移</h2>
  <pre class="mermaid">{MERMAID}</pre>
</section>

<section class="flowbox"><h2>各画面</h2><div class="grid">''')

    for name, src, desc, markup in SCREENS:
        out.append(f'''<div class="cell">
  <div class="cap__h"><span class="cap__n">{name}</span><span class="cap__s">{src}</span></div>
  <p class="cap__d">{desc}</p>
  {markup}
</div>''')

    out.append('''</div></section>

<section class="closing">
  <h2>設計上の判断</h2>
  <ul>
    <li><b>タイマー画面だけ要素を削りました。</b>仕様書 6 章の「集中を妨げない」に従い、
    履歴も統計も出しません。残り時間・応援・停止・終了だけです。</li>
    <li><b>演出の強さに差をつけました。</b>通常の完了は控えめ、レベルアップ時だけ
    背景に光を入れ、モンステラを大きく出します（仕様書 7 章）。</li>
    <li><b>植物ビューは余白を最大にしました。</b>統計を下部にまとめ、
    上半分はモンステラと光だけにしています（仕様書 8 章）。</li>
    <li><b>手動記録は、たまるしずくを保存前に見せます。</b>
    「この記録で 2 しずく たまります」と示すことで、25 分単位の仕組みが自然に伝わります。</li>
  </ul>
  <p>ここで決まった配色・余白・文字サイズは、そのまま Issue #7（デザイントークン）の入力になります。</p>
  <p>直したいところがあれば指摘してください。生成スクリプトは <code>design/screens/src/</code> にあります。</p>
</section>
</div>''')

    dest = pathlib.Path(__file__).resolve().parents[1] / "mockups.html"
    dest.write_text("\n".join(out), encoding="utf-8")
    print(f"written {dest} ({len(chr(10).join(out))} chars)")


if __name__ == "__main__":
    main()
