/**
 * 画面遷移。仕様書 4 章。
 *
 * 未定義のパスはホームへ寄せる。ADR-0010 で 404.html を index.html と
 * 同じ内容にしているため、存在しないパスでもこのアプリが起動する。
 * その場合に「見つかりません」と突き放さず、静かにホームへ戻す。
 */
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AppStateProvider, useAppState } from './ui/AppState'
import { basename, paths } from './ui/paths'
import DoneScreen from './ui/screens/DoneScreen'
import HomeScreen from './ui/screens/HomeScreen'
import PlantViewScreen from './ui/screens/PlantViewScreen'
import TimerScreen from './ui/screens/TimerScreen'

function Shell() {
  const { ready } = useAppState()
  // 読み込み中は数値を出さない。0 が一瞬見えて「記録が消えた」と誤解させないため
  if (!ready) return <div className="loading" aria-busy="true" />

  return (
    <Routes>
      <Route path={paths.home} element={<HomeScreen />} />
      <Route path={paths.timer} element={<TimerScreen />} />
      <Route path={paths.done} element={<DoneScreen />} />
      <Route path={paths.plant} element={<PlantViewScreen />} />
      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router basename={basename}>
      <AppStateProvider>
        <Shell />
      </AppStateProvider>
    </Router>
  )
}
