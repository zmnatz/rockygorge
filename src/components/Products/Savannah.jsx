import PaypalProduct from "../PaypalProduct";

export default function Savannah() {
  return <PaypalProduct defaultAmount={200} description="Savannah Tournament">
    <p>
      Rocky Gorge is headed to Savannah to play rugby. $200 covers
      transporation, tournament fee and hotels. If making your own
      arrangements, contact Joel Henry and pay your part of the tournaent
      fee ($20).
    </p>
  </PaypalProduct>
}
