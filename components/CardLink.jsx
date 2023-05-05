import {Col} from 'antd'
import Product from './Product'

export default function CardLink ({title, link, children}) {
  return <Col>
    <Product title={title} link={link}>
      {children}
    </Product>
  </Col>
}