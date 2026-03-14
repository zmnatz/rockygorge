import React from 'react';
import { Col } from 'antd';
import Product from './Product';

interface CardLinkProps {
  title: string;
  link: string;
  children: React.ReactNode;
}

export default function CardLink({ title, link, children }: CardLinkProps): JSX.Element {
  return (
    <Col>
      <Product title={title} link={link}>
        {children}
      </Product>
    </Col>
  );
}