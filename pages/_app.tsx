import { MDXProvider } from "@mdx-js/react";
import Head from "next/head";
import type { AppProps } from "next/app";

import { Container, CssBaseline, Link as MuiLink } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";

import { mdxComponents } from '@/utils/mdx'
import { theme } from "@/utils/theme";
import { Toolbar } from "@/components/Toolbar";
import { Footer } from "@/components/Footer";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/utils/queryClient";
import { IdentityProvider } from "@/components/IdentityProvider";
import GoogleAnalytics from "@/utils/analytics.mdx";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider>
    <IdentityProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
         <Head>
           <title>Rocky Gorge Rugby | Premier Rugby Club in Central Maryland</title>
           <meta
             name="description"
             content="Join Rocky Gorge Rugby, the premier rugby club in Central Maryland and Howard County. Division I and III men's rugby in Columbia, MD and surrounding areas."
           />
         </Head>
        <GoogleAnalytics />
        <MuiLink href="#main-content" variant="skipLink">
          Skip to main content
        </MuiLink>
        <Toolbar />
        <Container component="main" id="main-content" tabIndex={-1} maxWidth={false}>
          <MDXProvider components={mdxComponents}>
            <Component {...pageProps} />
          </MDXProvider>
        </Container>
        <Footer />
      </ThemeProvider>
    </QueryClientProvider>
    </IdentityProvider>
    </AppCacheProvider>
  );
}
