import PaypalProduct from "../PaypalProduct";

export default function Savannah() {
  return <PaypalProduct defaultAmount={275} description="Savannah Tournament">
    <p>
      Rocky Gorge is headed to Savannah to play rugby. $275 covers
      the bus, tournament fee and hotels. If making your own
      arrangements, contact Joel Henry and pay your part of the tournaent
      fee ($20).
    </p>
  </PaypalProduct>
}
