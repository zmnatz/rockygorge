import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import { Link as MuiLink, List, ListItem, ListItemText, ListSubheader, CircularProgress, Alert } from "@mui/material";
import { useCalendarEvents, formatEventTime } from "./api";
import { CalendarEvent } from "./types";
import Link from "next/link";

interface CalendarCardProps {
  calendars: string[]
}

export function CalendarCard({calendars}: CalendarCardProps): JSX.Element {
  const { data, isFetching, error } = useCalendarEvents();
  return (
    <Card>
      <CardHeader title={calendars.length > 1 ? "Calendar" : calendars[0]} component={Link} href="/calendar"/>
      <CardContent component={List} dense>
      {isFetching && <ListItem sx={{textAlign: 'center'}}>
        <CircularProgress/>
      </ListItem>}
      {error && <MuiLink component={Link} href="/calendar">Check out upcoming events</MuiLink>}
      {!isFetching && !error && calendars.filter(calendar => data[calendar])
        .map(calendar =>
          <CalendarSection key={calendar} 
            title={calendars.length > 1 ? calendar : undefined} 
            data={data[calendar]}
          />
        )
      }
    </CardContent>
    </Card>
  );
}

function CalendarSection({ title, data}: {title?: string, data: CalendarEvent[]}) {
  return <>
    {title && <ListSubheader>{title}</ListSubheader>}
    {data.length < 1 && 
      <ListItem><ListItemText secondary={`No upcoming ${title.toLowerCase()}`}/></ListItem>
    }
    {data.map((item) => (
      <ListItem key={`${item.htmlLink}-${item.start}`}>
        <ListItemText secondary={item.location}>
          <MuiLink href={item.htmlLink} target="_blank" rel="noopener noreferrer">
            {item.summary.length > 0 && <div>{item.summary}</div>}
            {formatEventTime(item.start, item.end)}
          </MuiLink>
        </ListItemText>
      </ListItem>
    ))}
  </>
}