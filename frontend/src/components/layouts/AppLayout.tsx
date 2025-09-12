import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="h-screen grid grid-cols-[auto_1fr]">
      <aside className="h-full border-r">
        <Sidebar />
      </aside>
      <div className="h-full flex flex-col">
        <header className="border-b">
          <Topbar />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
