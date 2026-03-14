import { Layout} from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { MDXProvider } from "@mdx-js/react";

import "antd/dist/antd.css";
import "./index.css";
import "./app.css";
import links from "@/data/links.yml";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Head from "next/head";

const PAYPAL_SETTINGS = {
  "client-id":
    "ASmTD9KvSepF8Mr7dKvFYJFlbQHBEld1lMSMyHFRouAAuBfx4tY1x9fMBuBP7buCTZa_Jou7xn7iiBbt",
  currency: "USD",
};

const headerLinks = links.filter(({ header }) => header);

const mdxComponents = {
  a: ({ href, children, ...props }) => {
    // Internal links use Next.js client-side navigation.
    // External links (mailto, http(s)) fall back to a normal <a>.
    const isExternal =
      typeof href === "string" &&
      (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("//"));

    if (isExternal) {
      return (
        <a href={href} {...props} target={props.target || "_blank"} rel="noopener noreferrer">
          {children}
        </a>
      );
    }

    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  },
};

export default function App({ Component, pageProps }) {
  return (
    <div className="App">
      <Head>
        <title>Rocky Gorge Rugby</title>
        <meta name="description" content="General information for Rocky Gorge Rugby Football Club" />
      </Head>
      <Layout.Header>
        <Link href="/">
          <h1>Rocky Gorge Rugby</h1>
          <h3 className="home-icon">
            <HomeOutlined />
          </h3>
        </Link>
        {headerLinks.map(({ id, title, description }) => (
          <Link key={id} href={id} title={description}>
            <h3>{title}</h3>
          </Link>
        ))}
      </Layout.Header>
      <Layout.Content>
        <PayPalScriptProvider options={PAYPAL_SETTINGS}>
          <MDXProvider components={mdxComponents}>
            <Component {...pageProps} />
          </MDXProvider>
        </PayPalScriptProvider>
      </Layout.Content>
    </div>
  );
}
