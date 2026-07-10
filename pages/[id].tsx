import { remark } from "remark";
import remarkHtml from "remark-html";
import { Typography, Box } from "@mui/material";
import Head from "next/head";
import Link from "next/link";
import { CalendarEventDetail } from "@/components/CalendarCard/CalendarEventDetail";

import {PaypalProduct} from "@/components/Paypal";
import items from "@/data/store.yml";
import forms from "@/data/forms.yml";
import linkMappings from "@/data/link_mappings.yml";
import { Product, Form } from "@/types/data";

function getFormLinkText(form: Form) {
  const mapping = linkMappings.forms;
  const text = (form.description + " " + form.title).toLowerCase();
  
  for (const [label, pattern] of Object.entries(mapping.mappings)) {
    if (new RegExp(pattern, 'i').test(text)) {
      return label;
    }
  }
  return mapping.default;
}

export async function getStaticPaths() {
  return {
    paths: items.map((item) => ({
      params: { id: item.name },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const item = items.find((item) => item?.name === params?.id);
  if (!item) return { notFound: true };

  const form = forms.find((f) => f.id === item.name);

  const props = {
    ...item,
    form,
  };

  if (props.details) {
    props.details = (await remark().use(remarkHtml).process(props.details)).toString();
  }
  return { props };
}

export default function StoreItem({
  defaultAmount,
  description,
  options,
  title,
  details,
  donation,
  subscriptions,
  supporters,
  form
}: Product & { form?: Form }) {
  return (
    <>
      <Head>
        <title>{title} | Rocky Gorge Rugby</title>
        <meta name="description" content={description || `Get ${title} from the Rocky Gorge Rugby store.`} />
      </Head>
      <PaypalProduct
        defaultAmount={defaultAmount}
        options={options}
        description={description}
        subscriptions={subscriptions}
        donation={donation}
        supporters={supporters}
        flexiblePayment
      >
        <Typography variant="h3">{title}</Typography>
        {details && <div dangerouslySetInnerHTML={{__html: details}}/>}
        
      </PaypalProduct>
      {form && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Link href={`/forms/${form.id}`} style={{ color: '#002366', fontWeight: 'bold', textDecoration: 'underline' }}>
            {getFormLinkText(form)}
          </Link>
        </Box>
      )}

      <CalendarEventDetail title={title} />
    </>
  );
}
