import { Col, Row, Typography } from "antd";
import Link from 'next/link'
import Calendar from "../components/Calendar";
import Product from "../components/Product";
import {amount} from './savannah'

const Home = () => (
  <>
    <Row>
      <Col md={22} lg={22} style={{ textAlign: "center" }}>
        <h2>
          One of the premiere rugby clubs in the Mid Atlantic. Competing in
          Division I and Division III men's rugby
        </h2>
        <h2>2012 and 2014 Division II National Champions</h2>
        <p className="description">
          <a
            href="https://discord.gg/B563CpDdgn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join our discord
          </a>{" "}
          to stay engaged and get immediate notifications on your phone for
          important announcements.
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
    </Row>
    <Row gutter={20} type="flex">
      <Col md={22} lg={11}>
        <Row type="flex">
          <Col>
            <Product title="Player Dues" link="/dues">
              <Typography>Spring Season: $200</Typography>
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
            <Product title="Advertise with Us" link="/sponsors">
              <Typography>Become a jersey sponsor.</Typography>
            </Product>
          </Col>
        </Row>n
        <Row>
          <Col>
            <Product title="Team Gear" link="/gear">
              <Typography>Shorts: $30</Typography>
              <Typography>Shirts: $15</Typography>
            </Product>
          </Col>
        </Row>
      </Col>
      <Col md={22} lg={11}>
        <Link href="/calendar">
          <Calendar />
        </Link>
      </Col>
    </Row>
  </>
);
export default Home;
