import data from '@/data/gauntlet.yml'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

const columns = [
    {title: 'Rank', dataIndex: 'rank', key: 'rank'}, 
    { title: 'Player', dataIndex: 'name', key: 'name' }, 
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Stroke Rate', dataIndex: 'stroke', key: 'stroke' },
]

export function getStaticProps() {
    data.sort((a, b) => a.time - b.time)
    const dataSource = data.map((d, index) => ({
        ...d,
        rank: index + 1,
        key: d.name,
        time: `${Math.trunc(d.time / 60)}:${(d.time % 60).toFixed(1)}`
    }))
    return { props: { dataSource, columns } };
}

export default function Gauntlet({ columns, dataSource }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.title}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {dataSource.map((row) => (
            <TableRow key={row.key}>
              {columns.map((col) => (
                <TableCell key={col.key}>{row[col.dataIndex]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
