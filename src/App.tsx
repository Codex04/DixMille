import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import AddScore from './routes/AddScore'
import GameBoard from './routes/GameBoard'
import GameDetail from './routes/GameDetail'
import History from './routes/History'
import Home from './routes/Home'
import ImportLink from './routes/ImportLink'
import NewGame from './routes/NewGame'
import Settings from './routes/Settings'
import { useGameStore } from './store/useGameStore'

export default function App() {
  const init = useGameStore((state) => state.init)
  const ready = useGameStore((state) => state.ready)

  // La migration depuis l'ancienne app a lieu ici, une seule fois.
  useEffect(() => {
    init()
  }, [init])

  if (!ready) return null

  return (
    // `basename` reprend le `base` de Vite : l'app vit sous /DixMille/.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nouvelle-partie" element={<NewGame />} />
        <Route path="/partie/:gameId" element={<GameBoard />} />
        <Route path="/partie/:gameId/score/:playerId" element={<AddScore />} />
        <Route path="/historique" element={<History />} />
        <Route path="/historique/:gameId" element={<GameDetail />} />
        <Route path="/reglages" element={<Settings />} />
        <Route path="/importer" element={<ImportLink />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
