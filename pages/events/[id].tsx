import { Typography, Container, Box, Card, CardHeader, CardContent, List, ListItem } from "@mui/material";
import type { GetServerSidePropsContext } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { CalendarEventDetail } from "@/components/CalendarCard/CalendarEventDetail";
import events from "@content/events.yml";
import store from "@content/store.yml";
import forms from "@content/forms.yml";
import type { Event, Product, Form } from "@/types/data";
import type { CalendarEvent } from "@/components/CalendarCard/types";
import calendarInfo from "@content/calendar.yml";
import { groupCalendarEvents } from "@/utils/calendar";
import { fetchCalendarItems, setCalendarCacheHeader } from "@/utils/calendarServer";
import { getLinkText } from "@/utils/links";
import { markdownToReact } from "@/utils/markdown";

// Rendered on request so the event's date and place come from the calendar on the server;
// the CDN keeps the page for 15 minutes with no stale copy served (src/utils/calendarServer.ts).
export async function getServerSideProps({ params, res }: GetServerSidePropsContext) {
  const event = events.find((event) => event?.slug === params?.id);
  if (!event) return { notFound: true };

  const calendar = await fetchCalendarItems();
  setCalendarCacheHeader(res, calendar);

  const storeItem = store.find((item) => item.slug === event.slug) ?? null;
  const form = forms.find((f) => f.slug === event.slug) ?? null;

  let qrCode = null;
  if (event.qrCode) {
    qrCode = await QRCode.toDataURL(event.qrCode, { margin: 2, width: 300 });
  }

  return {
    props: {
      ...event,
      storeItem,
      form,
      qrCode,
      calendarEvents: calendar ? groupCalendarEvents(calendar, calendarInfo.filters) : null,
    },
  };
}

export default function EventPage({
  title,
  description,
  details,
  organizers,
  summary,
  storeItem,
  form,
  qrCode,
  calendarEvents,
}: Event & {
  storeItem?: Product;
  form?: Form;
  qrCode?: string;
  calendarEvents: Record<string, CalendarEvent[]> | null;
}) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Head>
        <title>{`${title} | Rocky Gorge Rugby`}</title>
        <meta name="description" content={description} />
      </Head>
      <Box>
        <Typography variant="h3" gutterBottom>{title}</Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>{description}</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>{summary}</Typography>
        
        <CalendarEventDetail title={title} events={calendarEvents} />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {storeItem && (
            <Link href={`/${storeItem.slug}`} style={{ color: '#002366', fontWeight: 'bold', textDecoration: 'underline' }}>
              {getLinkText('store', storeItem)}
            </Link>
          )}
          {form && (
            <Link href={`/forms/${form.slug}`} style={{ color: '#002366', fontWeight: 'bold', textDecoration: 'underline' }}>
              {getLinkText('forms', form)}
            </Link>
          )}
        </Box>

        {details && (
          <Box sx={{ my: 3 }}>
            {markdownToReact(details)}
            {qrCode && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Image src={qrCode} alt="QR code" width={300} height={300} unoptimized />
              </Box>
            )}
          </Box>
        )}
        {organizers && organizers.length > 0 && (
          <Card sx={{ mt: 4 }}>
            <CardHeader title="Contact organizers for more detail" />
            <CardContent>
              <List sx={{ maxHeight: 400, overflowY: "auto" }}>
                {organizers.map((o) => (
                  <ListItem key={o}>{o}</ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
}
