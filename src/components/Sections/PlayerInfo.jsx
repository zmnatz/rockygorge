import React from "react";
import { Row, Col, Typography } from "antd";
import Product from "../Product";

export default (_) => (
  <>
    <Row type="flex">
      <Col>
        <Product title="Savannah Tourney" link="/savannah">
          <Typography>$200</Typography>
          <Typography>
            Covers transporation, lodging, and tournament fee.
          </Typography>
        </Product>
      </Col>
      <Col>
        <Product title="Player Dues" link="/dues">
          <Typography>$175 Spring Season</Typography>
          <Typography>$25 off for new players</Typography>
          <Typography>Dues are discounted $25 until March 1</Typography>
        </Product>
      </Col>
    </Row>
    <Row>
      <Col>
        <Product title="Team Gear" link="/gear">
          <Typography>Shorts: $30</Typography>
          <Typography>Shirts: $15</Typography>
        </Product>
      </Col>
      <Col>
        <Product title="Active Roster" link="/roster">
          <Typography>Register with USA Rugby</Typography>
        </Product>
      </Col>
    </Row>
  </>
);
