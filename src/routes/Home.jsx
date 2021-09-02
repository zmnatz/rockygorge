import { Col, Row } from "antd";
import { Link } from "@reach/router";
import PlayerInfo from "../components/Sections/PlayerInfo";
import Calendar from "../components/Calendar";
const Home = () => (
  <>
    <Row>
      <Col md={22} lg={22} style={{ textAlign: "center" }}>
        <h2>Event Registration</h2>
        <h2>2012 and 2014 Division II National Champions</h2>
        <p className="description">
          This is our storefront for signing up for upcoming events. Register
          for upcoming tournaments, social events, and fundraisers.
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
