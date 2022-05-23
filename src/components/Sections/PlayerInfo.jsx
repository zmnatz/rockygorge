import React from "react";
import { Row, Col, Typography } from "antd";
import Product from "../Product";

export default (_) => (
  <>
    <Row type="flex">
      <Col>
        <Product title="Spring Banquet" link="/banquet">
          <Typography>June 4: $65 Tickets</Typography>
          <Typography>
            Celebrating the 10th anniversary of our National Championship.
          </Typography>
        </Product>
      </Col>
      <Col>
        <Product title="Slugfest 10s" link="/slugfest">
          <Typography>June 25: $300 per team</Typography>
          <Typography>
            Men's, Women's and U19 divisions.
          </Typography>
        </Product>
      </Col>
      <Col>
        <Product title="Player Dues" link="/dues">
          <Typography>Fall Season: $200</Typography>
          <Typography>$25 off for new players</Typography>
        </Product>
      </Col>
      <Col>
        <Product title="Advertise with Us" link="/newSponsors">
          <Typography>Become a jersey sponsor.</Typography>
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
