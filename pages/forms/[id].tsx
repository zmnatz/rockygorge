import forms from "@content/forms.yml";
import { Box } from "@mui/material";
import Head from "next/head";

export async function getStaticPaths() {
  return {
    paths: forms.map((item) => ({
      params: { id: item.slug },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  return { props: forms.find((item) => item?.slug === params?.id) };
}

export default function Form({
  title,
  formId,
  width,
  height
}) {
  return (
    <>
      <Head>
        <title>{title} | Rocky Gorge Rugby</title>
        <meta name="description" content={title} />
      </Head>
      <Box sx={{textAlign: 'center'}}>
        <iframe src={`https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`} 
          height={height} 
          width={width}
          className="embed"
        >
          Loading...
        </iframe>
      </Box>
    </>
  );
}
