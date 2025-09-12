import React from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownTrigger,
  Pagination,
  Spinner,
} from '@heroui/react'
import { ChevronDownIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'

export type CustomColumn = { name: string; uid: string; sortable?: boolean }

export type CustomTableProps<T> = {
  columns: CustomColumn[]
  items: T[]
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void

  searchValue: string
  onSearchChange: (value: string) => void
  onSearchClear?: () => void

  onCreate?: () => void
  createLabel?: string
  rightAction?: React.ReactNode

  renderCell: (item: T, columnKey: string) => React.ReactNode
  showIndex?: boolean
  isLoading?: boolean
}

export default function CustomTable<T>({
  columns,
  items,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  searchValue,
  onSearchChange,
  onSearchClear,
  onCreate,
  createLabel = 'Create',
  rightAction,
  renderCell,
  showIndex = false,
  isLoading = false,
}: CustomTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(
    () => new Set(columns.map((c) => c.uid))
  )

  const headerColumns = React.useMemo(() => {
    const base = showIndex ? ([{ name: '#', uid: '__i' } as CustomColumn, ...columns]) : columns
    if (visibleColumns === ('all' as unknown as Set<string>)) return base
    const set = new Set(visibleColumns)
    if (showIndex) set.add('__i')
    return base.filter((c) => set.has(c.uid))
  }, [visibleColumns, columns, showIndex])

  const computedItems = React.useMemo(() => {
    if (!showIndex) return items as any[]
    return (items as any[]).map((it, idx) => ({ ...it, __i: (page - 1) * Math.max(1, limit) + idx + 1 }))
  }, [items, page, limit, showIndex])

  const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)))
  const shouldShowBottom = total > limit && total > 0 && pages > 1

  const topContent = React.useMemo(() => (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-3 items-end">
        <Input
          isClearable
          value={searchValue}
          onValueChange={onSearchChange}
          onClear={onSearchClear}
          className="w-full sm:max-w-[44%]"
          classNames={{ inputWrapper: 'h-11 bg-background ring-1 ring-foreground/40 focus-within:ring-foreground/50 rounded-lg', input: 'text-foreground' }}
          placeholder="Search..."
          startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/60" />}
          size="md"
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button endContent={<ChevronDownIcon className="h-4 w-4" />} variant="bordered" size="md">
                Columns
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Table Columns"
              disallowEmptySelection
              closeOnSelect={false}
              selectionMode="multiple"
              selectedKeys={visibleColumns}
              onSelectionChange={(keys) => setVisibleColumns(keys as Set<string>)}
              itemClasses={{ base: 'data-[hover=true]:bg-background/40' }}
            >
              {columns.map((c) => (
                <DropdownItem key={c.uid} className="capitalize">
                  {c.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          {rightAction ?? (onCreate ? (
            <Button color="primary" startContent={<PlusIcon className="h-5 w-5" />} onPress={onCreate} size="md">
              {createLabel}
            </Button>
          ) : null)}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-foreground/60 text-sm">Total {total}</span>
        <label className="flex items-center gap-2 text-foreground/60 text-sm">
          Rows per page:
          <select
            className="h-10 bg-transparent outline-solid outline-transparent text-foreground/80 text-sm"
            value={String(limit)}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
          </select>
        </label>
      </div>
    </div>
  ), [searchValue, onSearchChange, onSearchClear, visibleColumns, columns, onCreate, createLabel, rightAction, total, limit, onLimitChange])

  const bottomContent = React.useMemo(() => (
    <div className="py-3 px-2 flex justify-between items-center">
      <span className="w-[30%] text-sm text-foreground/60">Page {page} of {pages}</span>
      <Pagination
        showControls
        color="primary"
        showShadow
        page={page}
        total={pages}
        onChange={onPageChange}
      />
      <div className="hidden sm:flex w-[30%] justify-end gap-2">
        <Button isDisabled={pages === 1 || page <= 1} size="md" variant="flat" onPress={() => onPageChange(Math.max(1, page - 1))}>
          Previous
        </Button>
        <Button isDisabled={pages === 1 || page >= pages} size="md" variant="flat" onPress={() => onPageChange(Math.min(pages, page + 1))}>
          Next
        </Button>
      </div>
    </div>
  ), [page, pages, onPageChange])

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MagnifyingGlassIcon className="h-10 w-10 text-foreground/40" />
      <p className="mt-3 text-base font-medium text-foreground">No results found</p>
      <p className="mt-1 text-sm text-foreground/60">Try adjusting your search or filters. If this is a new area, you can create your first record.</p>
      {onCreate ? (
        <Button className="mt-4" color="primary" variant="flat" startContent={<PlusIcon className="h-5 w-5" />} onPress={onCreate}>
          {createLabel}
        </Button>
      ) : null}
    </div>
  )

  return (
    <div className="p-0 relative">
      {topContent}
      <Table
        aria-label="Data table"
        isHeaderSticky
        classNames={{
          td: 'align-middle text-[length:var(--heroui-font-size-small)] [--heroui-font-size-small:.875rem] text-foreground bg-background border-b border-foreground/10 dark:border-white/10',
        }}
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              allowsSorting={column.sortable}
              align={column.uid === 'actions' ? 'end' : 'start'}
              className={column.uid === 'actions' ? 'text-right w-[220px] min-w-[220px]' : undefined}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={computedItems.length ? undefined : emptyState} items={computedItems as any[]}>
          {(item: any) => (
            <TableRow key={String((item as any).id ?? (item as any)._id ?? (item as any).__i ?? JSON.stringify(item))} className="hover:bg-foreground/5 dark:hover:bg-background/40">
              {(columnKey) => <TableCell className="py-3">{columnKey === '__i' ? (item as any).__i : renderCell(item as any, String(columnKey))}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {shouldShowBottom ? bottomContent : null}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Spinner color="primary" label="Loading..."/>
        </div>
      ) : null}
    </div>
  )
} 