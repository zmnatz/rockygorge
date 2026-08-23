import { Link } from "@mui/material";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import React from "react";

// A helper component for using Next.js navigation with MUI components.
// It ensures the rendered element is an <a> and forwards refs correctly.
export type NextLinkComposedProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> &
  Pick<
    NextLinkProps,
    | "href"
    | "locale"
    | "prefetch"
    | "replace"
    | "scroll"
    | "shallow"
    | "passHref"
  >;

export const NextLinkComposed = React.forwardRef<
  HTMLAnchorElement,
  NextLinkComposedProps
>(function NextLinkComposed(props, ref) {
  const { href, ...other } = props;

  return <Link component={NextLink} href={href} ref={ref} {...other}></Link>;
});

NextLinkComposed.displayName = "NextLinkComposed";
