import React from 'react';
import {Col} from 'antd'

import Listings from '../components/Listings'
import RegisterProduct from '../components/Store'

export default () => {
  return <React.Fragment>
    <Col sm={22} md={11}>
      <Listings />
    </Col>
    <Col sm={22} md={11}>
      <RegisterProduct />
    </Col>
  </React.Fragment>
}
