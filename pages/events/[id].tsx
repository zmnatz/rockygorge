import { remark } from "remark";
import remarkHtml from "remark-html";
import { Typography, Container, Box, Card, CardHeader, CardContent, List, ListItem } from "@mui/material";
import Head from "next/head";
import events from "@/data/events.yml";
import { Event } from "@/types/data";

export async function getStaticPaths() {
  return {
    paths: events.map((event) => ({
      params: { id: event.name },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const props = events.find((event) => event?.name === params?.id);
  if (props?.details) {
    props.details = (await remark().use(remarkHtml).process(props.details)).toString();
  }
  return { props };
}

export default function EventPage({
  title,
  description,
  details,
  organizers,
  info
}: Event) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Head>
        <title>{title} | Rocky Gorge Rugby</title>
        <meta name="description" content={description} />
      </Head>
      <Box>
        <Typography variant="h3" gutterBottom>{title}</Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>{description}</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>{info}</Typography>
        {details && <Box sx={{ my: 3 }} dangerouslySetInnerHTML={{__html: details}}/>}
        {organizers && organizers.length > 0 && (
          <Card sx={{ mt: 4 }}>
            <CardHeader title="Contact Organizers for more detail" />
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
