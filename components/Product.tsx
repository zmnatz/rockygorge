import React from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

interface ProductProps {
  title: string;
  children: React.ReactNode;
}

export default function Product({ title, children }: ProductProps): JSX.Element {
  return (
    <Card>
      <CardActionArea>
        <CardHeader title={title} />
        <CardContent>{children}</CardContent>
      </CardActionArea>
    </Card>
  );
}