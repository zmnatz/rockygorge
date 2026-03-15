import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

export default function Calendar(): JSX.Element {
  return (
    <Card>
      <CardHeader title="Calendar" />
      <CardContent>
        <iframe
          title="Calendar"
          src="https://calendar.google.com/calendar/embed?height=300&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&src=dDFzMGwydWNtMWZsMDg0b2xobWo2OXBtZThAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ&color=%233F51B5&mode=AGENDA&title=Schedule&showTz=0&showCalendars=0&showTabs=0&showPrint=0&showNav=0&showTitle=0&showDate=0"
          style={{ borderWidth: 0 }}
          width="100%"
          height="500"
          frameBorder="0"
          scrolling="no"
        ></iframe>
      </CardContent>
    </Card>
  );
}