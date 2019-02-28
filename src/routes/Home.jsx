import React from 'react';
import {Col} from 'antd';
import Listings from '../components/Listings'

export default () => (
  <React.Fragment>
    <Col md={22} lg={11} style={{ textAlign: 'center' }}>
      <h2>Event Registration</h2>
      <img
        src="images/banquet.png"
        alt="Banquet Banner"
        width="300px"
      />
      <h2>2012 and 2014 Division II National Champions</h2>
      <p className="description">
        This is our storefront for signing up for upcoming events.
        Register for upcoming tournaments, social events, and fundraisers.
      </p>
    </Col>
    <Col md={22} lg={11}>
      <Listings />
    </Col>
  </React.Fragment>
)