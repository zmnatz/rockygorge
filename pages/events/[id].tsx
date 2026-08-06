import { Typography, Container, Box, Card, CardHeader, CardContent, List, ListItem } from "@mui/material";
import Head from "next/head";
import Link from "next/link";
import { CalendarEventDetail } from "@/components/CalendarCard/CalendarEventDetail";
import events from "@content/events.yml";
import store from "@content/store.yml";
import forms from "@content/forms.yml";
import { Event, Product, Form } from "@/types/data";
import { getLinkText } from "@/utils/links";
import { markdownToHtml } from "@/utils/markdown";

export async function getStaticPaths() {
  return {
    paths: events.map((event) => ({
      params: { id: event.slug },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const event = events.find((event) => event?.slug === params?.id);
  if (!event) return { notFound: true };

  const storeItem = store.find((item) => item.slug === event.slug) ?? null;
  const form = forms.find((f) => f.slug === event.slug) ?? null;

  const props = {
    ...event,
    storeItem,
    form,
  };

  if (props.details) {
    props.details = await markdownToHtml(props.details);
  }
  return { props };
}

export default function EventPage({
  title,
  description,
  details,
  organizers,
  summary,
  storeItem,
  form
}: Event & { storeItem?: Product; form?: Form }) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Head>
        <title>{title} | Rocky Gorge Rugby</title>
        <meta name="description" content={description} />
      </Head>
      <Box>
        <Typography variant="h3" gutterBottom>{title}</Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>{description}</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>{summary}</Typography>
        
        <CalendarEventDetail title={title} />

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

        {details && <Box sx={{ my: 3 }} dangerouslySetInnerHTML={{__html: details}}/>}
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
