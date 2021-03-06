import React from "react";
import { Router } from "@reach/router";

import SlugSevens from "./Products/SlugSevens";
import GorgeCup from "./Products/GorgeCup";
import Register from "./Products/Register";
import SlugSevensHS from "./Products/SlugSevensHS";

export default () => {
  return (
    <React.Fragment>
      <h2>Registration Information</h2>
      <Router>
        <GorgeCup path="gorgeCup" />
        <SlugSevens path="slug7s" />
        <SlugSevensHS path="u19slug7s" />
        <Register path="register" />
        <div default>Product not found</div>
      </Router>
    </React.Fragment>
  );
};
