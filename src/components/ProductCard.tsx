import type React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import { Link as MuiLink } from "@mui/material";
import Link from "next/link";
import { Grid } from "@mui/material";

interface ProductProps {
  title: string;
  children: React.ReactNode;
  href: string;
}

export function ProductCard({
  title,
  children,
  href,
}: ProductProps) {
  return (
    <Grid size={{xs: 12, sm: 6, md: 6}}>
      <Card component="article" variant="clickable">
        <CardHeader
          disableTypography
          title={
            <Typography component="h3" variant="h6">
              <MuiLink component={Link} href={href} underline="hover" color="inherit">
                {title}
              </MuiLink>
            </Typography>
          }
        />
        <CardContent>{children}</CardContent>
      </Card>
    </Grid>
  );
}
