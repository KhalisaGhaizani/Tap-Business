import { Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { EditorPage } from './pages/EditorPage'
import { PublicProfilePage } from './pages/PublicProfilePage'
import { TapSimulationPage } from './pages/TapSimulationPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/edit" element={<EditorPage />} />
      <Route path="/u/:username" element={<PublicProfilePage />} />
      <Route path="/tap" element={<TapSimulationPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}
