import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LocaleProvider } from '@/lib/i18n'
import { CreateRoomPage } from '@/pages/create-room-page'
import { HomePage } from '@/pages/home-page'
import { JoinRoomPage } from '@/pages/join-room-page'
import { RoomPage } from '@/pages/room-page'
import { SettingsPage } from '@/pages/settings-page'

export default function App() {
  return (
    <LocaleProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/rooms/create" element={<CreateRoomPage />} />
          <Route path="/rooms/join" element={<JoinRoomPage />} />
          <Route path="/rooms/:code" element={<RoomPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LocaleProvider>
  )
}
