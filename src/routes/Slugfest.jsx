import { Button, Input, Layout } from "antd";
import { useState } from 'react'
import PaypalPayment from '../components/PaypalPayment'
import PaypalProduct from "../components/PaypalProduct";

export const OPTIONS = [
  { name: `One Side - $300`, value: 300 },
  { name: `Two Sides - $500`, value: 500 },
  { name: "U19 Side - $200", value: 200 }
];

export const MAIL_TO = "mailto:slugfest@rockygorgerugby.com"

export default function Slugfest() {
  const [amount, setAmount] = useState(5)
  return <Layout.Content>
    <h1>Slugfest 10s</h1>
    <h3><a href="https://slugfest.netlify.app" target="_blank">Scores and Schedule</a></h3>
    <h3>Concessions</h3>
    <ul>
      <li>BBQ Chicken Sandwich: $5</li>
      <li>Pulled Pork Sandwich: $5</li>
      <li>Bottled Water: $1</li>
    </ul>
    <PaypalPayment amount={5} description="Concessions">
      <form>
        <label>Concession Charge</label>
        <Input type="number" value={amount} onChange={({ target }) => setAmount(target.value)} />
      </form>

    </PaypalPayment>
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
