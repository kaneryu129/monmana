#!/usr/bin/env python3
"""design/screens/mockups.html を生成する。

仕様書 3〜9 章の 6 画面を iPhone の寸法で組む。
モンステラは design/plant/src/build.py の図形をそのまま使う（ADR-0008）。

HTML を直接編集せず、ここを直して再生成すること。
描いたら必ず画像に書き出して目視すること（ADR-0008）。
"""
import importlib.util
import pathlib

# プラント側も build.py という名前のため、パス指定で明示的に読み込む
_PLANT = pathlib.Path(__file__).resolve().parents[2] / "plant" / "src" / "build.py"
_spec = importlib.util.spec_from_file_location("plant_build", _PLANT)
_plant = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_plant)

MATURE = _plant.MATURE
STAGE1, STAGE5, STAGE10 = _plant.STAGE1, _plant.STAGE5, _plant.STAGE10
STYLE_VARS = _plant.STYLE_VARS

W, H = 375, 812          # iPhone の論理解像度（ADR-0007 により iPhone が主環境）

TOKENS = """
  --paper:#FBF9F3; --paper-2:#F4F0E6; --edge:#E7E0D0;
  --ink:#2A312C; --ink-2:#6B746D; --ink-3:#9AA298;
  --green:#2C5340; --green-2:#3F7355; --green-pale:#E4EDE5;
  --white:#FFFFFF;
  --r:14px;
  --fd:"Hiragino Mincho ProN","Yu Mincho",serif;
  --fb:"Hiragino Kaku Gothic ProN","Yu Gothic",system-ui,sans-serif;
"""


def plant(stage, size, opacity=1.0):
    """モンステラを埋め込む。ghost 層で手描き風のにじみを出す（ADR-0008）。"""
    return (f'<svg class="hand" viewBox="0 0 240 268" width="{size}" '
            f'style="opacity:{opacity}" aria-hidden="true">'
            f'<use href="#{stage}" class="ghost"/><use href="#{stage}"/></svg>')


def stat(value, unit, label):
    return (f'<div class="stat"><div class="stat__v">{value}'
            f'<span class="stat__u">{unit}</span></div>'
            f'<div class="stat__l">{label}</div></div>')


# ─────────────────────────── 各画面 ───────────────────────────

HOME = f'''
<div class="scr">
  <div class="bar"><span>9:41</span><span class="bar__r">▮▮▮</span></div>
  <div class="pad">
    <div class="brand">モンまな</div>
    <div class="date">8月15日（金）</div>
    <p class="greet">おかえり。<br>今日も一枚、葉を育てよう。</p>

    <button class="plantcard" type="button">
      {plant("stage-5", 132)}
      <div class="plantcard__lv">成長 Lv.4 ／ 若葉のモンステラ</div>
      <div class="plantcard__go">モンステラを見る →</div>
    </button>

    <div class="stats">
      {stat("50", "分", "今日")}
      {stat("7", "日", "連続")}
      {stat("12", "時間30分", "累計")}
    </div>

    <button class="btn btn--main" type="button">25分、勉強を始める</button>
    <button class="btn btn--sub" type="button">時間だけ記録する</button>

    <div class="recent">
      <div class="recent__h">直近の記録</div>
      <div class="rec"><span class="rec__t">25分</span><span class="rec__c">英語</span><span class="rec__d">今日 14:20</span></div>
      <div class="rec"><span class="rec__t">25分</span><span class="rec__c">資格</span><span class="rec__d">今日 10:05</span></div>
      <div class="rec"><span class="rec__t">50分</span><span class="rec__c">英語</span><span class="rec__d">昨日</span></div>
    </div>
  </div>
</div>'''

TIMER = f'''
<div class="scr scr--quiet">
  <div class="bar"><span>9:41</span><span class="bar__r">▮▮▮</span></div>
  <div class="pad pad--center">
    <div class="cats">
      <span class="cat">英語</span><span class="cat cat--on">資格</span><span class="cat">その他</span>
    </div>
    <div class="clock">24:13</div>
    <p class="cheer">今日の一歩が、<br>葉を育てています。</p>
    <div class="timerbtns">
      <button class="btn btn--ghost" type="button">一時停止</button>
      <button class="btn btn--ghost" type="button">終了する</button>
    </div>
    <div class="soundlink">音の設定</div>
  </div>
</div>'''

DONE = f'''
<div class="scr">
  <div class="bar"><span>9:41</span><span class="bar__r">▮▮▮</span></div>
  <div class="pad pad--center">
    <h2 class="done__h">おつかれさま！</h2>
    <p class="done__s">25分の学びで、<br>モンステラに水が届きました。</p>
    {plant("stage-5", 168)}
    <div class="pills">
      <span class="pill">今回 <b>25分</b></span>
      <span class="pill">今日 <b>75分</b></span>
    </div>
    <div class="next">次のレベルまで あと <b>2</b> しずく</div>
    <div class="memo">ひとこと（任意）</div>
    <button class="btn btn--main" type="button">もう25分続ける</button>
    <button class="btn btn--sub" type="button">ホームへ戻る</button>
  </div>
</div>'''

LEVELUP = f'''
<div class="scr scr--celebrate">
  <div class="bar"><span>9:41</span><span class="bar__r">▮▮▮</span></div>
  <div class="pad pad--center">
    <div class="spark">✳</div>
    <h2 class="lv__h">Lv.10 になりました！</h2>
    <p class="lv__s">あなたのモンステラに、<br>はじめての白い斑が現れました。</p>
    {plant("stage-10", 196)}
    <p class="lv__t">25分ずつ積み重ねた学びが、<br>特別な一枚になりました。</p>
    <button class="btn btn--main" type="button">モンステラを見る</button>
    <button class="btn btn--sub" type="button">続けて勉強する</button>
    <div class="textlink">ホームへ戻る</div>
  </div>
</div>'''

PLANTVIEW = f'''
<div class="scr scr--view">
  <div class="bar bar--light"><span>9:41</span><span class="bar__r">▮▮▮</span></div>
  <div class="back">← 戻る</div>
  <div class="stage">{plant("stage-10", 300)}</div>
  <div class="viewinfo">
    <div class="viewinfo__lv">成長 Lv.10</div>
    <div class="viewinfo__nm">斑入りモンステラ</div>
    <div class="viewinfo__row">
      <span>累計 <b>18時間45分</b></span><span>育てた葉 <b>6枚</b></span>
    </div>
    <div class="marks">
      <div class="mark"><span class="mark__d">2026.08.15</span>はじめての斑入りの葉</div>
      <div class="mark"><span class="mark__d">2026.08.15</span>Lv.10 達成</div>
      <div class="mark"><span class="mark__d">2026.08.09</span>7日つづけて葉を育てた</div>
    </div>
  </div>
</div>'''

MANUAL = f'''
<div class="scr scr--modal">
  <div class="bar"><span>9:41</span><span class="bar__r">▮▮▮</span></div>
  <div class="dim"></div>
  <div class="sheet">
    <div class="sheet__grip"></div>
    <h2 class="sheet__h">時間だけ記録する</h2>
    <label class="field"><span class="field__l">学習時間</span>
      <span class="field__i">60<span class="field__u">分</span></span></label>
    <div class="field__l">カテゴリ（任意）</div>
    <div class="cats cats--left">
      <span class="cat cat--on">英語</span><span class="cat">資格</span><span class="cat">その他</span>
    </div>
    <div class="field__l">ひとこと（任意）</div>
    <div class="memo memo--sheet">英単語を50個復習した</div>
    <div class="drops">この記録で <b>2</b> しずく たまります</div>
    <button class="btn btn--main" type="button">記録する</button>
    <div class="textlink">とじる</div>
  </div>
</div>'''

SCREENS = [
    ("ホーム", "仕様書 5 章", "迷わず勉強を始められること。", HOME),
    ("タイマー", "仕様書 6 章", "勉強中を邪魔しないこと。要素を最小限にした。", TIMER),
    ("完了・成長演出", "仕様書 7 章", "通常回。控えめに、短く。", DONE),
    ("レベルアップ時", "仕様書 7 章 / 10 章", "ここだけ明確に演出する。", LEVELUP),
    ("植物ビュー", "仕様書 8 章", "積み重ねを眺めて実感する。", PLANTVIEW),
    ("手動記録モーダル", "仕様書 9 章", "タイマーを使えない時の記録。", MANUAL),
]
