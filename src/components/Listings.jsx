import React from "react";
import { Row, Col } from "antd";
import Product from "./Product";

export default () => (
  <React.Fragment>
    <h3>Events</h3>
    <Row type="flex" gutter={20}>
      <Col>
        <Product title="HOF Banquet" link="/store/banquet">
          <div>Saturday, April 18</div>
          <div>7:00 PM to 11:00 PM</div>
          <div>Columbia, MD</div>
        </Product>
      </Col>

      <Col>
        <Product title="Gorge Cup" link="/store/gorgeCup">
          <div>April 25, 2020</div>
          <div>Alpha Ridge Park</div>
          <div>11685 Old Frederick Rd, Marriottsville, MD 21104</div>
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
