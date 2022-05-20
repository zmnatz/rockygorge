import { Col, Row } from "antd";
import { Link } from "@reach/router";
import PlayerInfo from "../components/Sections/PlayerInfo";
import Calendar from "../components/Calendar";
const Home = () => (
  <>
    <Row>
      <Col md={22} lg={22} style={{ textAlign: "center" }}>
        <h2>One of the premiere rugby clubs in the Mid Atlantic. Competing in Division I and Division III men's rugby</h2>
        <h2>2012 and 2014 Division II National Champions</h2>
        <p className="description">
          <a
            href="https://discord.gg/B563CpDdgn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join our discord
          </a>{" "}
          to stay engaged and get immediate notifications on your phone for important announcements.
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
      </Col>
    </Row>
    <Row gutter={20} type="flex">
      <Col md={22} lg={11}>
        <PlayerInfo />
      </Col>
      <Col md={22} lg={11}>
        <Link to="/calendar">
          <Calendar />
        </Link>
      </Col>
    </Row>
  </>
);
export default Home;
