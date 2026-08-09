declare module '*.mdx' {
  import React from 'react';
  // biome-ignore lint/suspicious/noExplicitAny: MDX components receive arbitrary props at the type boundary
  const Component: React.ComponentType<any>;
  export default Component;
}
