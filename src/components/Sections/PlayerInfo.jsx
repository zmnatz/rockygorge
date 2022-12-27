import React from "react";
import { Row, Col, Typography } from "antd";
import { amount } from '../Products/Savannah'
import Product from "../Product";

export default (_) => (
  <>
    <Row type="flex">
      <Col>
        <Product title="Player Dues" link="/dues">
          <Typography>Fall Season: $200</Typography>
          <Typography>$25 off for new players</Typography>
        </Product>
      </Col>
      <Col>
        <Product title="Savannah Trip" link="/savannah">
          <Typography>St Patricks Day Tournament</Typography>
          <Typography>${amount}: Bus, hotels, tournament fees</Typography>
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
      {/* <Col>
        <Product title="Standings" link="/standings">
          <Typography>Standings for the 2022/2023 season</Typography>
        </Product>
      </Col> */}
    </Row>
  </>
);
