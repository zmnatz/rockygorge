import React from 'react';
import { Row, Col } from 'antd';
import Product from '../Product';

export default _ => (
  <Row type="flex" gutter={20}>
    <Col>
      <Product title="Calendar" link="/calendar">
        Practice times, locations and game information
      </Product>
    </Col>
    <Col>
      <Product title="Fall Dues" link="/dues">
        Fall 2020 Mens Club Dues
        </Product>
    </Col>
  </Row>
)