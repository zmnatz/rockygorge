import React from 'react';
import {Card} from 'antd'
import Link from 'next/link'

export default function Product ({title, link, children}) {
  return <Link href={link}>
    <Card title={title} className="store-card">
      {children}
    </Card>
  </Link>
}