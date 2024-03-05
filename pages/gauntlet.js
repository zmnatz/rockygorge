import data from '../data/gauntlet.yml'

const columns = [{title: 'Name', dataIndex: 'name', key: 'name'}, {title: 'Time', dataIndex: 'time', key: 'time'}]

export function getStaticProps() {
    console.log(data)
    data.sort((a, b) => a.time - b.time)
    const dataSource = data.map(d => ({
          ...d,
          key: d.name,
          time: `${Math.trunc(d.time/60)}:${(d.time%60).toFixed(1)}`
        }))
    return { props: {dataSource, columns} };
}

export {Table as default} from 'antd'