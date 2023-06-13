import { Layout } from "antd";
import Link from 'next/link'

import "antd/dist/antd.css";
import "./index.css";
import "./app.css"

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Head from "next/head";

const PAYPAL_SETTINGS = {
  "client-id":
    "ASmTD9KvSepF8Mr7dKvFYJFlbQHBEld1lMSMyHFRouAAuBfx4tY1x9fMBuBP7buCTZa_Jou7xn7iiBbt",
  "enable-funding": "venmo",
  currency: "USD"
}
export default function App({ Component, pageProps }) {
  return (
    <div className="App">
      <Head>
        <title>Rocky Gorge Rugby</title>
        <meta name="description" content="General information for Rocky Gorge Rugby Football Club"/>
      </Head>
      <Layout.Header>
        <Link href="/">
          <h1>Rocky Gorge Rugby</h1>
        </Link>
      </Layout.Header>
      <Layout.Content>
        <PayPalScriptProvider options={PAYPAL_SETTINGS}>
          <Component {...pageProps} />
        </PayPalScriptProvider>
      </Layout.Content>
    </div>
  );
}
