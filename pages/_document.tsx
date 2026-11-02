import { Html, Head, Main, NextScript } from 'next/document';
import {
  DocumentHeadTags,
  documentGetInitialProps,
  type DocumentHeadTagsProps,
} from '@mui/material-nextjs/v16-pagesRouter';

export default function MyDocument(props: DocumentHeadTagsProps) {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <DocumentHeadTags {...props} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: Parameters<typeof documentGetInitialProps>[0]) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};
