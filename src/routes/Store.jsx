import React from "react";
import { Col } from "antd";

import Events from "../components/Sections/Events";
import Store from "../components/Store";

export default () => {
  return (
    <React.Fragment>
      <Col sm={22} md={11}>
        <h3>Events</h3>
        <Events />
      </Col>
      <Col sm={22} md={11}>
        <Store />
      </Col>
    </React.Fragment>
  );
};
