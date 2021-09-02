import React, { Component } from "react";
import { Layout } from "antd";
import { Router, Link } from "@reach/router";
import Home from "./routes/Home";
import Dues from "./routes/Dues";
import Calendar from "./routes/Calendar";
import Roster from "./routes/Roster";

import "antd/dist/antd.css";
import "./App.css";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Layout.Header>
          <Link to="/">
            <h1>Rocky Gorge Rugby</h1>
          </Link>
        </Layout.Header>
        <Layout.Content>
          <Router className="ant-row-flex ant-row-flex-center">
            <Home default />
            <Dues path="/dues" />
            <Calendar path="/calendar" />
            <Roster path="/roster" />
          </Router>
        </Layout.Content>
      </div>
    );
  }
}

export default App;
