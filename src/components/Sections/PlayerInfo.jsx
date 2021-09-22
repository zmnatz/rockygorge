import React from "react";
import { Row, Col, Typography } from "antd";
import Product from "../Product";
import PRICES from "../../utils/prices";

export default (_) => (
  <Row type="flex">
    <Col>
      <Product title="Player Dues" link="/dues">
        <Typography>${PRICES.DUES.amount.value} Fall Season</Typography>
        <Typography>
          ${PRICES.DUES.amount.value - PRICES.NEW_DUES.amount.value} off for new
          players
        </Typography>
      </Product>
    </Col>
    <Col>
      <Product title="Active Roster" link="/roster">
        <Typography>Register with USA Rugby</Typography>
      </Product>
    </Col>
  </Row>
);
