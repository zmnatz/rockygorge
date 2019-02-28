import React from 'react'
import { Router } from '@reach/router'

import SlugSevens from './Products/SlugSevens'
import GorgeCup from './Products/GorgeCup'

export default () => {
  return <React.Fragment>
    <h2>Registration Information</h2>
    <Router>
      <GorgeCup path="gorgeCup" />
      <SlugSevens path="slug7s" />
      <div default>
        Product not found
      </div>
    </Router>
  </React.Fragment>
}