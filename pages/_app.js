import { MDXProvider } from "@mdx-js/react";


import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Head from "next/head";

import {
  Container,
  CssBaseline,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { mdxComponents } from '@/utils/mdx'
import { PAYPAL_SETTINGS } from "@/utils/paypal";
import { theme } from "@/utils/theme";
import { Toolbar } from '@/components/Toolbar'


export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>Rocky Gorge Rugby</title>
        <meta name="description" content="General information for Rocky Gorge Rugby Football Club" />
      </Head>

      <Toolbar />

      <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
        <PayPalScriptProvider options={PAYPAL_SETTINGS}>
          <MDXProvider components={mdxComponents}>
            <Component {...pageProps} />
          </MDXProvider>
        </PayPalScriptProvider>
      </Container>
    </ThemeProvider>
  );
}
