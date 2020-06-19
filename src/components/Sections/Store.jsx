import React from "react";
import { Router } from "@reach/router";

import SlugSevens from "../Products/SlugSevens";
import GorgeCup from "../Products/GorgeCup";
import Register from "../Products/Register";
import SlugSevensHS from "../Products/SlugSevensHS";
import Banquet from "../Products/Banquet";

export default () => {
  return (
    <React.Fragment>
      <Router>
        <GorgeCup path="gorgeCup" />
        <SlugSevens path="slug7s" />
        <SlugSevensHS path="u19slug7s" />
        <Banquet path="banquet" />
        <Register path="register" />
        <div default>Product not found</div>
      </Router>
    </React.Fragment>
  );
};
