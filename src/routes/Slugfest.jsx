import { Layout } from "antd";
import PaypalProduct from "../components/PaypalProduct";

export const OPTIONS = [
  { name: `One Side - $300`, value: 300 },
  { name: `Two Sides - $500`, value: 500 },
  { name: "U19 Side - $200", value: 200 }
];

export const MAIL_TO = "mailto:slugfest@rockygorgerugby.com&subject=Register my Team&body=Register my team for Slugfest 10s: <Team Name>"

export default function Slugfest() {
  return <Layout.Content>
    <h1>Slugfest 10s</h1>
    <h3>Divisions</h3>
    <p>
      The tournament will consist of Men's open, Women's open, and a U19 7s division.
    </p>
    <h3>Where</h3>
    <p>
      East Columbia Library Park<br />
      6600 Cradlerock Way, Columbia, MD 21045
    </p>
    <h3>When</h3>
    <p>
      June 25 - 9:00AM-3:00PM<br />
      Social to follow at Oliver's Old Town Tavern
    </p>
    <h3>Cost</h3>
    <p>
      $300 for senior sides; $500 for two sides.
      $200 for U19 sides.
    </p>
    <h3>Register your team</h3>
    <p>
      Contact <a href={MAIL_TO}>slugfest@rockygorgerugby.com</a> to register your team.
    </p>
    <PaypalProduct options={OPTIONS} defaultAmount={300}>
    </PaypalProduct>
  </Layout.Content>
}