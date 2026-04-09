import { MDXProvider } from "@mdx-js/react";
import Head from "next/head";

import { Container, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { mdxComponents } from '@/utils/mdx'
import { theme } from "@/utils/theme";
import { Toolbar } from "@/components/Toolbar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/utils/queryClient";

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Head>
          <title>Rocky Gorge Rugby</title>
          <meta
            name="description"
            content="General information for Rocky Gorge Rugby Football Club"
          />
        </Head>
        <Toolbar />
        <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
          <MDXProvider components={mdxComponents}>
            <Component {...pageProps} />
          </MDXProvider>
        </Container>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
