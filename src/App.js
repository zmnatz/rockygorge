import React, { Component } from "react";
import { Layout } from "antd";
import { Router, Link } from "@reach/router";
import Home from "./routes/Home";
import Store from "./routes/Store";
import Dues from "./components/Products/Dues";
import Calendar from "./routes/Calendar";
import "antd/dist/antd.css";
import "./App.css";
import Subscriptions from "./components/Products/Subscriptions";
import Roster from "./routes/Roster";

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
            <Store path="/store/*" />
            <Dues path="/dues" />
            <Calendar path="/calendar" />
            <Subscriptions path="/subscriptions" />
            <Roster path="/roster" />
          </Router>
        </Layout.Content>
      </div>
    );
  }
}

export default App;
