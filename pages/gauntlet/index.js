import data from '../../data/gauntlet.yml'

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
    return { props: { dataSource, columns, pagination: false } };
}

export { Table as default } from 'antd'