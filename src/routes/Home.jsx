import React from "react";
import { Col } from "antd";
import Listings from "../components/Listings";
import Product from "../components/Product";

export default () => (
  <React.Fragment>
    <Col md={22} lg={11} style={{ textAlign: "center" }}>
      <h2>Event Registration</h2>
      <img src="images/banquet.png" alt="Banquet Banner" width="300px" />
      <h2>2012 and 2014 Division II National Champions</h2>
      <p className="description">
        This is our storefront for signing up for upcoming events. Register for
        upcoming tournaments, social events, and fundraisers.
      </p>
      <p className="description">
        <a
          href="https://groups.google.com/forum/#!forum/rocky-gorge"
          target="_blank"
          rel="noopener noreferrer"
        >
          New Players: Join Our Mailing List
        </a>{" "}
        for team announcements, practice times, and player information.
      </p>
      <p className="description">
        <a
          href="https://groups.google.com/forum/#!forum/rocky-gorge-alumni"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join our alumni list
        </a>{" "}
        for social announcements, fan information, and old boy happy hours.
      </p>
    </Col>
    <Col md={22} lg={11}>
      <Listings />
      <h3>Team Dues</h3>
      {/* <Product title="Spring Dues" link="/dues">
        Spring 2020 Mens Club Dues
      </Product> */}
    </Col>
  </React.Fragment>
);
