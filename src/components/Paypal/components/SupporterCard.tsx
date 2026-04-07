import { Card, CardHeader, CardContent, List, ListItem } from "@mui/material";

export  function SupporterCard({ supporters }: { supporters: any[] }) {
  return <Card sx={{ mt: 4 }}>
    <CardHeader title="Thanks to all our supporters!" />
    <CardContent>
      <List sx={{ maxHeight: 400, overflowY: "auto" }}>
        {supporters.map((s: any) => (
          <ListItem key={s.id || s}>{s}</ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
}