import { NextLinkComposed } from "@/src/utils/nextLink";
import { MDXProvider } from "@mdx-js/react";

import links from "@/data/links.yml";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Head from "next/head";

import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Toolbar,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { mdxComponents } from '@/src/utils/mdx'
import { PAYPAL_SETTINGS } from "@/src/utils/paypal";
import { theme } from "@/src/utils/theme";

const headerLinks = links.filter(({ header }) => header);

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>Rocky Gorge Rugby</title>
        <meta name="description" content="General information for Rocky Gorge Rugby Football Club" />
      </Head>

      <AppBar position="static">
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Button
              component={NextLinkComposed}
              href="/"
              color="inherit"
              sx={{ textTransform: "none", fontSize: 20 }}
            >
              Rocky Gorge Rugby
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            {headerLinks.map(({ id, title, description }) => (
              <Button
                key={id}
                component={NextLinkComposed}
                href={id}
                color="inherit"
                sx={{ textTransform: "none" }}
                title={description}
              >
                {title}
              </Button>
            ))}
          </Toolbar>
        </Container>
      </AppBar>

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
