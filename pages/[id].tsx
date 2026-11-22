import { Typography, Box } from "@mui/material";
import type { GetServerSidePropsContext } from "next";
import Head from "next/head";
import Link from "next/link";
import { CalendarEventDetail } from "@/components/CalendarCard/CalendarEventDetail";

import {PaypalProduct} from "@/components/Paypal";
import items from "@content/store.yml";
import forms from "@content/forms.yml";
import type { Product, Form } from "@/types/data";
import type { CalendarEvent } from "@/components/CalendarCard/types";
import calendarInfo from "@content/calendar.yml";
import { groupCalendarEvents } from "@/utils/calendar";
import { fetchCalendarItems, setCalendarCacheHeader } from "@/utils/calendarServer";
import { getLinkText } from "@/utils/links";
import { markdownToReact } from "@/utils/markdown";

// Rendered on request so the event details come from the calendar on the server; the CDN
// keeps the page for 15 minutes with no stale copy served (src/utils/calendarServer.ts).
export async function getServerSideProps({ params, res }: GetServerSidePropsContext) {
  const item = items.find((item) => item?.slug === params?.id);
  if (!item) return { notFound: true };

  const calendar = await fetchCalendarItems();
  setCalendarCacheHeader(res, calendar);

  const form = forms.find((f) => f.slug === item.slug) ?? null;

  return {
    props: {
      ...item,
      form,
      calendarEvents: calendar ? groupCalendarEvents(calendar, calendarInfo.filters) : null,
    },
  };
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
  slug,
  form,
  calendarEvents,
}: Product & { form?: Form; calendarEvents: Record<string, CalendarEvent[]> | null }) {
  return (
    <>
      <Head>
        <title>{`${title} | Rocky Gorge Rugby`}</title>
        <meta name="description" content={description || `Get ${title} from the Rocky Gorge Rugby store.`} />
      </Head>
      <PaypalProduct
        defaultAmount={defaultAmount}
        options={options}
        description={description}
        subscriptions={subscriptions}
        donation={donation}
        supporters={supporters}
        slug={slug}
        flexiblePayment
      >
        <Typography variant="h3">{title}</Typography>
        {details && markdownToReact(details)}
      </PaypalProduct>
      {form && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Link href={`/forms/${form.slug}`} style={{ color: '#002366', fontWeight: 'bold', textDecoration: 'underline' }}>
            {getLinkText('forms', form)}
          </Link>
        </Box>
      )}

      <CalendarEventDetail title={title} events={calendarEvents} />
    </>
  );
}
