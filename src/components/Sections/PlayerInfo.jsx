import React from "react";
import { Row, Col } from "antd";
import Product from "../Product";

export default (_) => (
  <Row type="flex" gutter={20}>
    <Col>
      <Product title="Calendar" link="/calendar">
        Practice times, locations and game information
      </Product>
    </Col>
    <Col>
      <Product title="Spring Dues" link="/dues">
        Spring 2021 Mens Club Dues
      </Product>
    </Col>
    <Col>
      <Product title="Active Roster" link="/roster">
        Currently registered players
      </Product>
    </Col>
  </Row>
);
