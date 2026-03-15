import data from '@/data/gauntlet-2023-2024.yml'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

const columns = [
    {title: 'Rank', dataIndex: 'rank', key: 'rank'}, 
    { title: 'Player', dataIndex: 'name', key: 'name' }, 
    { title: 'Time', dataIndex: 'time', key: 'time' }
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

export default function Gauntlet2024({ columns, dataSource }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Typography variant="h4" component="h1" sx={{ p: 2 }}>
        Gauntlet 2023–2024 Results
      </Typography>
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
