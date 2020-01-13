import React from "react";
import { Row, Col } from "antd";
import Product from "./Product";

export default () => (
  <React.Fragment>
    <h3>Events</h3>
    <Row type="flex" gutter={20}>
      <Col>
        <Product title="Gorge Cup" link="/store/gorgeCup">
          <div>Details coming Spring, 2020</div>
        </Product>
      </Col>

      <Col>
        <Product title="Slug 7s" link="/store/slug7s">
          <div>Columbia, MD</div>
          <div>Details coming summer 2020</div>
        </Product>
      </Col>
    </Row>
  </React.Fragment>
);
