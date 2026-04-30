import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { GetStaticProps, GetStaticPaths, NextPage } from 'next'
import fs from 'fs'
import path from 'path'
import { columns, Column, GauntletDataSource } from './utils'
import { GauntletEntry } from '@/types/data'

const DATA_DIR = path.join(process.cwd(), 'src/data/gauntlet')

export const getStaticPaths: GetStaticPaths = async () => {
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.yml'))
    
    const paths = files.map(file => {
        const season = file === 'index.yml' ? 'current' : file.replace('.yml', '')
        return { params: { season } }
    })
    
    return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const season = params?.season as string
    const filename = season === 'current' ? 'index.yml' : `${season}.yml`
    const filePath = path.join(DATA_DIR, filename)

    if (!fs.existsSync(filePath)) {
        return { props: { dataSource: [], columns, season } }
    }

    // Using require to load the yaml file since next-plugin-yaml handles it
    const data: GauntletEntry[] = require(filePath)

    if (!data || (Array.isArray(data) && data.length === 0)) {
        return { props: { dataSource: [], columns, season } }
    }

    const dataArray = [...data]
    
    dataArray.sort((a, b) => {
        const timeA = typeof a.time === 'number' ? a.time : 999999
        const timeB = typeof b.time === 'number' ? b.time : 999999
        return timeA - timeB
    })

    const dataSource: GauntletDataSource[] = dataArray.map((d, index) => ({
        ...d,
        rank: index + 1,
        key: d.name,
        time: typeof d.time === 'number' 
            ? `${Math.trunc(d.time / 60)}:${(d.time % 60).toFixed(1)}` 
            : d.time
    }))

    return { props: { dataSource, columns, season } }
}

interface GauntletSeasonProps {
    columns: Column[];
    dataSource: GauntletDataSource[];
    season: string;
}

const GauntletSeason: NextPage<GauntletSeasonProps> = ({ columns, dataSource, season }) => {
    const title = season === 'current' ? 'Gauntlet Results' : `Gauntlet ${season} Results`

    return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Typography variant="h4" component="h1" sx={{ p: 2 }}>
                {title}
            </Typography>
            {dataSource.length === 0 ? (
                <Typography sx={{ p: 2 }}>No entries are present</Typography>
            ) : (
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
            )}
            <Box sx={{ p: 2, mt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    About the Gorge Gauntlet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    The Gorge Gauntlet is the ultimate test of rowing endurance and explosive power. Athletes battle through four grueling 500M intervals, with only a fleeting 60-second reprieve between sets to recover. To claim your place on the leaderboard, submit a photo of your time splits as proof of your grit. Do you have what it takes to conquer the Gauntlet?
                </Typography>
            </Box>
        </TableContainer>
    )
}

export default GauntletSeason
