import React, { Component } from "react";
import { Layout } from "antd";
import { Router, Link } from "@reach/router";
import Home from "./routes/Home";
import Calendar from "./routes/Calendar";
import Roster from "./routes/Roster";
import { Dues, Gear, Savannah, Banquet } from "./components/Products";
import NewSponsors from "./components/Products/NewSponsors";

import "antd/dist/antd.css";
import "./App.css";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

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
          <PayPalScriptProvider
            options={{
              "client-id":
                "ASmTD9KvSepF8Mr7dKvFYJFlbQHBEld1lMSMyHFRouAAuBfx4tY1x9fMBuBP7buCTZa_Jou7xn7iiBbt",
              "enable-funding": "venmo",
              currency: "USD"
            }}
          >
            <Router className="ant-row-flex ant-row-flex-center">
              <Home default />
              <Dues path="/dues" />
              <Gear path="/gear" />
              <Banquet path="/banquet" />
              <Savannah path="/savannah" />
              <Calendar path="/calendar" />
              <Roster path="/roster" />
              <NewSponsors path="/newSponsors" />
            </Router>
          </PayPalScriptProvider>
        </Layout.Content>
      </div>
    );
  }
}

export default App;
