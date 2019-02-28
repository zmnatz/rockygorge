import React from 'react';
import {Row, Col} from 'antd';
import Product from './Product'

export default () => (
  <React.Fragment>
    <h3>Upcoming Events</h3>
    <Row type="flex" gutter={20}>
      <Col>
        <Product title="Gorge Cup" link="/store/gorgeCup">
          <div>East Columbia Library</div>
          <div>April 27, 2019</div>
          <div>$150 Per Team</div>
        </Product>
      </Col>
      <Col>
        <Product title="Slug 7s" link="/store/slug7s">
          <div>Date: TBD</div>
        </Product>
      </Col>
    </Row>
  </React.Fragment >
)