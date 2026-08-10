import { 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TableSortLabel
} from '@mui/material'
import { useState, useMemo, type ReactNode } from 'react'
import { getSortableName } from '@/utils/stats'

export interface SortableColumn {
  key: string;
  title: string;
  minWidth?: number;
  dataIndex?: string;
}

export interface SortableTableProps {
  columns: SortableColumn[];
  data: Record<string, unknown>[];
  categories: Record<string, string[]>;
  baseColumnFilter?: (col: SortableColumn) => boolean;
  renderCell?: (col: SortableColumn, row: Record<string, unknown>) => ReactNode;
  rowKey?: (row: Record<string, unknown>) => string;
}

export function SortableTable({ 
  columns, 
  data, 
  categories, 
  baseColumnFilter = (c) => c.key === 'game' || c.key === 'name',
  renderCell,
  rowKey = (row) => String(row.key)
}: SortableTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: columns[0]?.key || '',
    direction: 'asc',
  })

  const handleRequestSort = (property: string) => {
    const isAsc = sortConfig.key === property && sortConfig.direction === 'asc'
    setSortConfig({ key: property, direction: isAsc ? 'desc' : 'asc' })
  }

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      if (sortConfig.key === 'name') {
        aValue = getSortableName(String(aValue))
        bValue = getSortableName(String(bValue))
      }

      if (aValue === bValue) return 0
      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const columnGroups = useMemo(() => {
    const groups: { title: string; colSpan: number }[] = []
    
    const baseCols = columns.filter(baseColumnFilter)
    if (baseCols.length > 0) {
      groups.push({ title: '', colSpan: baseCols.length })
    }

    Object.entries(categories).forEach(([category, fields]) => {
      const count = columns.filter(c => fields.includes(c.key)).length
      if (count > 0) {
        groups.push({ title: category, colSpan: count })
      }
    })

    return groups
  }, [columns, categories, baseColumnFilter])

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          {columnGroups.length > 0 && (
            <TableRow>
              {columnGroups.map((group) => (
                <TableCell 
                  key={group.title === '' ? 'base' : group.title} 
                  align="center" 
                  colSpan={group.colSpan}
                  sx={{ borderBottom: group.title ? '1px solid rgba(224, 224, 224, 1)' : 'none', fontWeight: 'bold' }}
                >
                  {group.title}
                </TableCell>
              ))}
            </TableRow>
          )}
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ minWidth: col.minWidth }}>
                <TableSortLabel
                  active={sortConfig.key === col.key}
                  direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
                  onClick={() => handleRequestSort(col.key)}
                >
                  {col.title}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {renderCell ? renderCell(col, row) : row[col.dataIndex ?? col.key] as ReactNode}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}