import { ConfigProvider, Layout } from "antd";
import { HomeOutlined } from '@ant-design/icons'
import Link from 'next/link'

import "./app.css"
import links from '../data/links.yml'

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Head from "next/head";

const PAYPAL_SETTINGS = {
  "client-id":
    "ASmTD9KvSepF8Mr7dKvFYJFlbQHBEld1lMSMyHFRouAAuBfx4tY1x9fMBuBP7buCTZa_Jou7xn7iiBbt",
  currency: "USD"
}
export default function App({ Component, pageProps }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          // Seed Token
          colorPrimary: '#1d71be',
          borderRadius: 2,

          // Alias Token
          // colorTextHeading: '#fff',
        },
        components: {
          Card: {
            // headerBg: '#001529',
          },
          Table: {
            headerBg: '#001529',
          }
        }
      }}
    >
      <div className="App">
        <Head>
          <title>Rocky Gorge Rugby</title>
          <meta name="description" content="General information for Rocky Gorge Rugby Football Club" />
        </Head>
        <Layout.Header>
          <Link href="/">
            <h1>Rocky Gorge Rugby</h1>
            <h3 className="home-icon"><HomeOutlined /></h3>
          </Link>
          {links.filter(({ header }) => header)
            .map(({ link, title, description }) => (
              <Link key={link} href={link} title={description}>
                <h3>{title}</h3>
              </Link>
            ))
          }
        </Layout.Header>
        <Layout.Content>
          <PayPalScriptProvider options={PAYPAL_SETTINGS}>
            <Component {...pageProps} />
          </PayPalScriptProvider>
        </Layout.Content>
      </div>
    </ConfigProvider>
  );
}
