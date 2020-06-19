import React from 'react';
import {Link} from '@reach/router'
import {Card} from 'antd'

const linkProps = ({isCurrent}) => ({className: isCurrent ? 'isCurrent' : ''})

export default ({title, link, children}) => (
  <Link to={link} getProps={linkProps}>
    <Card title={title} className="store-card">
      {children}
    </Card>
  </Link>
)