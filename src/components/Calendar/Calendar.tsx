import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import { Link as MuiLink, List, ListItem, ListItemText, ListSubheader, Typography } from "@mui/material";
import { useMatchEvents, usePracticeEvents, CalendarEvent, formatEventTime } from "@/components/Calendar/calendar";
import Link from "next/link";

export default function Calendar(): JSX.Element {
  const { data: practices, isFetching } = usePracticeEvents();
  const { data: matches, isFetching: loadingMatches } = useMatchEvents();
  if (practices.length < 1 && matches.length < 1) {
    return null;
  }

  return (
    <Card>
      <CardHeader title="Calendar" component={Link} href="/calendar"/>
      <CardContent>
        <List>
          <ListSubheader><Typography variant="h4">Events</Typography></ListSubheader>
          {loadingMatches &&  (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {!loadingMatches && matches.length < 1 && <ListItem><ListItemText secondary="No upcoming events"/></ListItem>}
          {matches.map((item) => (
            <CalendarItem key={item.start + item.summary} item={item}/>
          ))}
          <ListSubheader><Typography variant="h4">Practices</Typography></ListSubheader>
          {isFetching && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {practices.map((item) => (
            <CalendarItem key={item.start + item.summary} item={item}/>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}


function CalendarItem ({item}: {item: CalendarEvent}) {
  return <ListItem
    key={`${item.htmlLink}-${item.start}`}
    component={MuiLink}
    href={item.htmlLink}
    target="_blank"
    rel="noopener noreferrer"
  >
    <ListItemText
      sx={{ whiteSpace: "normal" }}
      slotProps={{
        primary: { noWrap: false },
        secondary: {noWrap: false }
      }}
      primary={`${formatEventTime(item.start, item.end)} · ${item.summary}`}
      secondary={item.location}
    />
  </ListItem>
}