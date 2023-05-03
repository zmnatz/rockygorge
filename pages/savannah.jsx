import PaypalProduct from "../components/PaypalProduct";
export const amount = 300
export const smallFee = 20

export default function Savannah() {
  return <PaypalProduct defaultAmount={amount} description="Savannah Tournament" flexiblePayment>
    <p>
      Rocky Gorge is headed to Savannah to play rugby. ${amount} covers
      the bus, tournament fee and hotels. If making your own
      arrangements, contact Joel Henry and pay your part of the tournaent
      fee (${smallFee}).
    </p>
  </PaypalProduct>
}
