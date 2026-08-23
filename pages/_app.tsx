import { MDXProvider } from "@mdx-js/react";
import { Container, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import Head from "next/head";
import { Toolbar } from "@/components/Toolbar";
import GoogleAnalytics from "@/utils/analytics.mdx";
import { mdxComponents } from "@/utils/mdx";
import { queryClient } from "@/utils/queryClient";
import { theme } from "@/utils/theme";

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Head>
          <title>
            Rocky Gorge Rugby | Premier Rugby Club in Central Maryland
          </title>
          <meta
            name="description"
            content="Join Rocky Gorge Rugby, the premier rugby club in Central Maryland and Howard County. Division I and III men's rugby in Columbia, MD and surrounding areas."
          />
        </Head>
        <GoogleAnalytics />
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
