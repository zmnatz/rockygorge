import type React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { Link as MuiLink } from "@mui/material";
import Link from "next/link";
import { Grid } from "@mui/material";

interface ProductProps {
  title: string;
  children: React.ReactNode;
  href: string;
}

// Semantic card: real <article>, heading title link, and content rendered
// as-is (home passes interpreted markdown). The title — not the whole
// card — is the link, so summaries can contain their own links and reader
// views still see headings, paragraphs, and links.
export function ProductCard({
  title,
  children,
  href,
}: ProductProps) {
  return (
    <Grid size={{xs: 12, sm: 6, md: 6}}>
      <Card component="article" sx={{ height: '100%' }}>
        <CardContent>
          <Typography component="h3" variant="h6" gutterBottom>
            <MuiLink component={Link} href={href} underline="hover" color="inherit">
              {title}
            </MuiLink>
          </Typography>
          {children}
        </CardContent>
      </Card>
    </Grid>
  );
}
