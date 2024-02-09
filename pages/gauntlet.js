import data from '../data/gauntlet'

const columns = [{title: 'Name', dataIndex: 'name', key: 'name'}, {title: 'Time', dataIndex: 'time', key: 'time'}]

export function getStaticProps() {
    data.sort((a, b) => a.time.localeCompare(b.time))
    const dataSource = data.slice(0,10)
    return { props: {dataSource, columns} };
}

export {Table as default} from 'antd'