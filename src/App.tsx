/*
 * 各画面は Issue #17（ルーティングと画面骨格）以降で実装する。
 * ここは土台が動いていることを確認するための暫定表示。
 */
export default function App() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
            fontWeight: 500,
            fontSize: '1.6rem',
            letterSpacing: '0.14em',
            color: '#2c5340',
            margin: 0,
          }}
        >
          モンまな
        </h1>
        <p style={{ color: '#66706a', fontSize: '0.875rem', marginTop: '0.75rem' }}>
          勉強するたび、モンステラが育つ。
        </p>
      </div>
    </main>
  )
}
