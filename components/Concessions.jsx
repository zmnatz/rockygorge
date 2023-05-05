import { useState } from "react"
import PaypalProduct from './PaypalProduct'
import { Input } from "antd"

export default function Concessions() {
    const [amount, setAmount] = useState(5)
    return <PaypalProduct amount={5} description="Concessions">
        <form>
            <label>Concession Charge</label>
            <Input type="number" value={amount} onChange={({ target }) => setAmount(target.value)} />
        </form>
    </PaypalProduct>
}