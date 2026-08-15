/**
 * 学習記録データの型定義（仕様書 12 章）。
 *
 * ここは純粋な TypeScript として書く。React にも IndexedDB にも依存しない
 * （ADR-0001, ADR-0002）。
 */

/**
 * 記録方法。仕様書 12 章。
 *
 * しずくの付与規則が異なるため区別する（仕様書 10 章）。
 * - timer      : 25 分のタイマーを完走した。1 しずく
 * - partial    : 途中で終了した。学習時間は記録するが、しずくは付与しない
 * - manual     : 手動記録。25 分ごとに 1 しずく
 */
export type RecordMethod = 'timer' | 'partial' | 'manual'

/**
 * 勉強カテゴリ。仕様書 6 章では「英語、資格、その他程度」とされている。
 *
 * 複雑な科目管理は MVP 対象外（仕様書 2 章）のため、増やさない。
 * カテゴリの選択は必須ではないため、未選択は undefined で表す。
 */
export type Category = 'english' | 'certification' | 'other'

/** 日付を「その日」として扱うための表現。YYYY-MM-DD 形式（ローカル時刻基準） */
export type DateKey = string

/**
 * 学習セッション 1 件。仕様書 12 章。
 *
 * 一度記録したら書き換えない。積み重ねの記録であり、
 * 後から改変すると「積み上げた」という体験の根拠が失われる。
 */
export interface StudySession {
  /** 記録を識別する ID */
  id: string
  /** 開始日時（エポックミリ秒） */
  startedAt: number
  /** 終了日時（エポックミリ秒） */
  endedAt: number
  /** 実際に記録した学習時間（分） */
  minutes: number
  /** 記録方法 */
  method: RecordMethod
  /** カテゴリ。任意 */
  category?: Category
  /** ひとことメモ。任意 */
  memo?: string
  /** この記録によって増えた成長ポイント */
  drops: number
  /** 記録の作成日時（エポックミリ秒） */
  createdAt: number
  /**
   * この記録が属する日。
   *
   * startedAt から導出できるが、保存時に確定させて持つ。
   * 端末のタイムゾーンが変わっても、記録した当時の「その日」が動かないようにするため。
   */
  dateKey: DateKey
}

/** 成長履歴に残る節目の種類。仕様書 7 章、11 章 */
export type MilestoneKind =
  /** レベルアップ */
  | 'levelup'
  /** はじめての斑入りの葉（Lv.10） */
  | 'first-variegation'
  /** 連続学習日数の節目（3 日 / 7 日 / 30 日） */
  | 'streak'

/** 成長履歴の 1 件。仕様書 8 章の植物ビューに表示する */
export interface Milestone {
  id: string
  kind: MilestoneKind
  /** 表示する文言。例: 「はじめての斑入りの葉」 */
  label: string
  /** 到達日 */
  dateKey: DateKey
  /** レベルアップなら到達レベル、連続日数なら日数 */
  value: number
  createdAt: number
}

/**
 * ユーザーの成長状態。仕様書 12 章。
 *
 * 「今日の学習時間」はここに持たない。日付が変われば意味が変わる値であり、
 * 保存しておくと日をまたいだときに古い値が残る。セッションから都度算出する。
 */
export interface GrowthState {
  /** 累計しずく。レベルはこの値から算出する（仕様書 10 章） */
  totalDrops: number
  /** 全期間の学習時間（分） */
  totalMinutes: number
  /** 最後に学習した日。連続日数の算出に使う */
  lastStudiedOn?: DateKey
  /** 連続学習日数。仕様書 11 章 */
  streakDays: number
  /** 成長履歴 */
  milestones: Milestone[]
}

/** 何も記録していない状態。初回起動時に使う */
export const INITIAL_GROWTH_STATE: GrowthState = {
  totalDrops: 0,
  totalMinutes: 0,
  streakDays: 0,
  milestones: [],
}
