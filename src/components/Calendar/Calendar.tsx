'use client'
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import { Link as MuiLink, List, ListItem, ListItemText, ListSubheader, Typography, Box, CircularProgress } from "@mui/material";
import { useCalendarEvents, formatEventTime } from "./api";
import { CalendarEvent } from "./types";
import Link from "next/link";

export function Calendar(): JSX.Element {
  const { data, isFetching } = useCalendarEvents();
  return (
    <Card>
      <CardHeader title="Calendar" component={Link} href="/calendar"/>
      <CardContent component={List} dense>
        {isFetching && <ListItem sx={{textAlign: 'center'}}>
          <CircularProgress/>
        </ListItem>}
          {!isFetching &&Object.entries(data).map(([group, events]) =>
            <CalendarSection key={group} title={group} data={events}/>
          )}
      </CardContent>
    </Card>
  );
}

function CalendarSection({ title, data}: {title: string, data: CalendarEvent[]}) {
  return <>
    <ListSubheader>{title}</ListSubheader>
    {data.length < 1 && 
      <ListItem><ListItemText secondary={`No upcoming ${title.toLowerCase()}`}/></ListItem>
    }
    {data.map((item) => (
      <ListItem key={`${item.htmlLink}-${item.start}`}>
        <ListItemText
          sx={{ whiteSpace: "normal" }}
          slotProps={{
            primary: { noWrap: false },
            secondary: {noWrap: false }
          }}
          secondary={item.location}
        >
          <MuiLink href={item.htmlLink} target="_blank" rel="noopener noreferrer">
            {formatEventTime(item.start, item.end)} · {item.summary}
          </MuiLink>
        </ListItemText>
      </ListItem>
    ))}
  </>
}