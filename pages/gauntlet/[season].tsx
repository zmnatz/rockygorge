import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button } from '@mui/material'
import { GetStaticProps, GetStaticPaths, NextPage } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { columns, Column, GauntletDataSource } from '@/utils/gauntlet'
import { GauntletEntry } from '@/types/data'

const DATA_DIR = path.join(process.cwd(), 'src/data/gauntlet')

const parseTime = (time: string | number): number => {
    if (typeof time === 'number') return time;
    const [minutes, seconds] = time.split(':');
    if (minutes === undefined || seconds === undefined) return 999999;
    return parseInt(minutes, 10) * 60 + parseFloat(seconds);
};

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

    const fileContents = fs.readFileSync(filePath, 'utf8')
    const data = yaml.load(fileContents) as GauntletEntry[]

    if (!Array.isArray(data) || data.length === 0) {
        return { props: { dataSource: [], columns, season } }
    }

    const dataArray = [...data]
    
    dataArray.sort((a, b) => parseTime(a.time) - parseTime(b.time))
    
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
                    The Gorge Gauntlet consists of four 500m intervals with 60 seconds of rest between sets. Please submit your time via the form below and send a photo of your time splits to the team WhatsApp.
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Link href="/gauntlet/submit" passHref>
                        <Button variant="outlined" size="small">
                            Submit Your Time
                        </Button>
                    </Link>
                </Box>
            </Box>
        </TableContainer>
    )
}

export default GauntletSeason
