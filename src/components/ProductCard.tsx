import React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
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
}: ProductProps): JSX.Element {
  return (
    <Grid size={{xs: 12, sm: 6, md: 6}}>
      <Link href={href}>
        <Card>
          <CardActionArea>
            <CardHeader title={title} />
            <CardContent>{children}</CardContent>
          </CardActionArea>
        </Card>
      </Link>
    </Grid>
  );
}
