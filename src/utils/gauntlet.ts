import { GauntletEntry } from '@/types/data'

export interface GauntletDataSource extends GauntletEntry {
    rank: number;
    key: string;
}

export interface Column {
    title: string;
    dataIndex: keyof GauntletDataSource;
    key: string;
}

export const columns: Column[] = [
    { title: 'Rank', dataIndex: 'rank', key: 'rank' },
    { title: 'Player', dataIndex: 'name', key: 'name' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Stroke Rate', dataIndex: 'stroke', key: 'stroke' },
]
