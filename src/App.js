import React, { Component } from "react";
import { Row, Col, Card, Layout } from "antd";
import { Router, Link } from '@reach/router'
import classnames from 'classnames'
import RegisterProduct from './components/Store'
import 'antd/dist/antd.css';
import './index.css'

const {
  Header, Content
} = Layout;

const Main = () => (
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
)

const linkProps = ({isCurrent}) =>
  ({className: classnames({isCurrent})})

const NavLink = (props) => (
  <Link {...props} getProps={linkProps}>
    {props.children}
  </Link>
)

const Products = () => (
  <React.Fragment>
    <h3>Upcoming Events</h3>
    <Row type="flex" gutter={20}>
      <Col>
        <NavLink to="/store/gorgeCup">
          <Card title="Gorge Cup" className="store-card">
            <div>East Columbia Library</div>
            <div>April 27, 2019</div>
            <div>$150 Per Team</div>
          </Card>
        </NavLink>
      </Col>
      <Col>
        <NavLink to="/store/slug7s">
          <Card title="Slug 7s" className="store-card">
            <div>Date: TBD</div>
          </Card>
        </NavLink>
      </Col>
    </Row>
  </React.Fragment >
)

const Home = () => (
  <React.Fragment>
    <Main />
    <Col md={22} lg={11}>
      <Products />
    </Col>
  </React.Fragment>
)

const Store = ({ product }) => {
  return <React.Fragment>
    <Col sm={22} md={11}>
      <Products active={product} />
    </Col>
    <Col sm={22} md={11}>
      <RegisterProduct product={product} />
    </Col>
  </React.Fragment>
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <Header>
          <Link to="/"><h1>Rocky Gorge Rugby</h1></Link>
        </Header>
        <Content>
          <Router className="ant-row-flex ant-row-flex-center">
            <Home path='/' />
            <Store path='/store/:product' />
          </Router>
        </Content>
      </div >
    );
  }
}

export default App;
