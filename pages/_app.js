import { ConfigProvider, Layout, Menu } from "antd";
import Link from 'next/link'

import "./app.css"
import links from '../data/links.yml'

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Head from "next/head";
import { theme } from "../utils/theme";
import { Header } from "antd/es/layout/layout";
import { PAYPAL_SETTINGS } from "../utils/paypal";

export const navLinks = [
  {
    key: '/',
    label: <Link href="/">
      Rocky Gorge Rugby
    </Link> 
  },
  ...links.filter(({ header }) => header).map(({ link, title }) => ({
    key: link,
    label: <Link href={link}>{title}</Link>
  }))
]



export default function App({ Component, pageProps }) {
  return (
    <ConfigProvider theme={theme}>
      <Layout>
        <Head>
          <title>Rocky Gorge Rugby</title>
          <meta name="description" content="General information for Rocky Gorge Rugby Football Club" />
        </Head>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <Menu theme="dark"
            mode="horizontal"
            style={{ flex: 1, minWidth: 0 }}
            items={navLinks} />
        </Header>
        <Layout.Content>
          <PayPalScriptProvider options={PAYPAL_SETTINGS}>
            <Component {...pageProps} />
          </PayPalScriptProvider>
        </Layout.Content>
      </Layout>
    </ConfigProvider>
  );
}
