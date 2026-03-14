import React from 'react';
import { Card } from 'antd';
import Link from 'next/link';

interface ProductProps {
  title: string;
  link: string;
  children: React.ReactNode;
}

export default function Product({ title, link, children }: ProductProps): JSX.Element {
  return (
    <Link href={link}>
      <Card title={title} className="store-card">
        {children}
      </Card>
    </Link>
  );
}