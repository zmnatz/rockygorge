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
      <Product title="Fall Dues" link="/dues">
        <div>$175 Club Dues</div>
        <div>$25 off for new players</div>
      </Product>
    </Col>
    <Col>
      <Product title="Active Roster" link="/roster">
        Currently registered players
      </Product>
    </Col>
  </Row>
);
