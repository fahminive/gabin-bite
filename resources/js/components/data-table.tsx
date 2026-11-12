"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
}

/** "created_at" -> "Created At", untuk label kartu mobile. */
function humanizeColumnLabel(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const ACTION_COLUMN_PATTERN = /^(aksi|actions?|tindakan)$/i

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Cari data...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full space-y-3">
      {searchKey && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-9 h-10 w-full rounded-xl bg-card text-sm"
            />
          </div>
        </div>
      )}

      {/* ============ MOBILE: stacked cards ============ */}
      <div className="md:hidden flex flex-col gap-2.5">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const cells = row.getVisibleCells()
            const actionCell =
              cells.find((cell) =>
                ACTION_COLUMN_PATTERN.test(cell.column.id),
              ) ?? null
            const infoCells = cells.filter((cell) => cell !== actionCell)
            const firstCell = infoCells[0]
            const restCells = infoCells.slice(1)

            return (
              <div
                key={row.id}
                className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs active:bg-muted/20 transition-colors touch-manipulation"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {firstCell && (
                      <div className="text-sm font-bold truncate">
                        {flexRender(
                          firstCell.column.columnDef.cell,
                          firstCell.getContext(),
                        )}
                      </div>
                    )}
                  </div>
                  {actionCell && (
                    <div className="flex shrink-0 items-center gap-1">
                      {flexRender(
                        actionCell.column.columnDef.cell,
                        actionCell.getContext(),
                      )}
                    </div>
                  )}
                </div>
                {restCells.length > 0 && (
                  <dl className="mt-2 flex flex-col gap-1">
                    {restCells.map((cell) => (
                      <div
                        key={cell.id}
                        className="flex items-baseline justify-between gap-3 text-[13px]"
                      >
                        <dt className="shrink-0 text-[11px] font-medium text-muted-foreground">
                          {typeof cell.column.columnDef.header === 'string'
                            ? cell.column.columnDef.header
                            : humanizeColumnLabel(cell.column.id)}
                        </dt>
                        <dd className="min-w-0 text-right font-medium">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )
          })
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
            Belum ada data yang ditemukan.
          </div>
        )}
      </div>

      {/* ============ DESKTOP: table (tidak berubah) ============ */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="overflow-x-auto custom-scrollbar touch-scroll">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                  {headerGroup.headers.map((header) => {
                    const metaClass = (header.column.columnDef.meta as { className?: string } | undefined)?.className
                    return (
                      <TableHead key={header.id} className={`font-extrabold text-xs uppercase tracking-wider ${metaClass ?? ''}`}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const metaClass = (cell.column.columnDef.meta as { className?: string } | undefined)?.className
                      return (
                        <TableCell key={cell.id} className={`py-3 px-3 text-sm ${metaClass ?? ''}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                    Belum ada data yang ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {data.length > 10 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-1">
          <div className="text-xs text-muted-foreground">
            Halaman <span className="font-bold text-foreground">{table.getState().pagination.pageIndex + 1}</span> dari{' '}
            <span className="font-bold text-foreground">{table.getPageCount() || 1}</span> ({data.length} total baris)
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-10 px-4 rounded-xl flex-1 sm:flex-initial sm:h-9"
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-10 px-4 rounded-xl flex-1 sm:flex-initial sm:h-9"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
