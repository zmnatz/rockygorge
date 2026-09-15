import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import { Link as MuiLink, List, ListItem, ListItemText, ListSubheader, CircularProgress } from "@mui/material";
import { useCalendarEvents } from "@/api/calendar";
import { formatEventTime } from "@/utils/calendar";
import type { CalendarEvent } from "./types";
import Link from "next/link";

interface CalendarCardProps {
  calendars: string[]
}

export function CalendarCard({calendars}: CalendarCardProps) {
  const { data, isFetching, error } = useCalendarEvents();
  return (
    <Card component="section">
      <CardHeader
        disableTypography
        title={
          <Typography component="h3" variant="h6">
            <MuiLink component={Link} href="/calendar" underline="hover" color="inherit">
              {calendars.length > 1 ? "Calendar" : calendars[0]}
            </MuiLink>
          </Typography>
        }
      />
      <CardContent>
      <List sx={{ p: 0 }}>
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
      </List>
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