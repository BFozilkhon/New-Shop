import { ReactNode } from 'react'
import { Button } from '@heroui/react'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

export type CreateSection = { key: string; label: string }

export default function CustomCreateLayout({
  title,
  backTo,
  sections,
  activeKey,
  onSelect,
  actions,
  children,
}: {
  title: string
  backTo: string
  sections: CreateSection[]
  activeKey: string
  onSelect: (key: string) => void
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={backTo} className="inline-flex">
            <Button size="sm" variant="light" startContent={<ChevronLeftIcon className="w-4 h-4" />}>Back</Button>
          </Link>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="grid grid-cols-[220px_1fr] gap-6">
        <nav className="sticky top-6 self-start rounded-lg border border-default-200 p-2">
          <ul className="space-y-1 max-h-[calc(100vh-6rem)] overflow-y-auto">
            {sections.map(s => (
              <li key={s.key}>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-default-100 ${activeKey === s.key ? 'bg-default-100 font-medium' : ''}`}
                  onClick={() => onSelect(s.key)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-h-[400px] rounded-lg border border-default-200 p-4">
          {children}
        </div>
      </div>
    </div>
  )
} 