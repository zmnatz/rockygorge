import { MDXProvider } from "@mdx-js/react";
import Head from "next/head";

import { Container, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { mdxComponents } from '@/utils/mdx'
import { theme } from "@/utils/theme";
import { Toolbar } from "@/components/Toolbar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/utils/queryClient";
import { Auth0Provider } from "@auth0/auth0-react";
import GoogleAnalytics from "@/utils/analytics.mdx";

const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN!;
const auth0ClientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!;
const auth0RedirectUri = process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI!;

export default function App({ Component, pageProps }) {
  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{ redirect_uri: auth0RedirectUri }}
      cacheLocation="localstorage"
      onRedirectCallback={(appState) => {
        window.location.replace(appState?.returnTo || '/admin');
      }}
    >
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
        <Toolbar />
        <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
          <MDXProvider components={mdxComponents}>
            <Component {...pageProps} />
          </MDXProvider>
        </Container>
      </ThemeProvider>
    </QueryClientProvider>
    </Auth0Provider>
  );
}
