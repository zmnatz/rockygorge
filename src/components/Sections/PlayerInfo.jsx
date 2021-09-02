import React from "react";
import { Row, Col } from "antd";
import Product from "../Product";

export default (_) => (
  <Row type="flex">
    <Col>
      <Product title="Fall Dues" link="/dues">
        <div>$175 Fall Season</div>
        <div>$25 off for new players</div>
      </Product>
    </Col>
    <Col>
      <Product title="Active Roster" link="/roster">
        <div>Register with USA Rugby</div>
      </Product>
    </Col>
  </Row>
);
