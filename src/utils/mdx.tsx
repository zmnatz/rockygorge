import Link from "next/link";
import { Grid, Link as MuiLink, Typography } from "@mui/material";
import { ProductCard } from "@/components/ProductCard";
import { CalendarCard } from "@/components/CalendarCard";

export const mdxComponents = {
  h1: (props) => <Typography component="h1" variant="h4" gutterBottom {...props} />,
  h2: (props) => <Typography component="h2" variant="h5" gutterBottom {...props} />,
  h3: (props) => <Typography component="h3" variant="h6" gutterBottom {...props} />,
  h4: (props) => <Typography component="h4" variant="subtitle1" gutterBottom {...props} />,
  h5: (props) => <Typography component="h5" variant="subtitle2" gutterBottom {...props} />,
  h6: (props) => <Typography component="h6" variant="body1" gutterBottom {...props} />,
  p: (props) => <Typography
    component="p"
    variant="body1"
    {...props}
    sx={{
      marginBottom: "16px"
    }} />,
  a: ({ href, children, ...props }) => {
    const isExternal =
      typeof href === "string" &&
      (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("//"));

    if (isExternal) {
      return (
        <MuiLink href={href} {...props} target={props.target || "_blank"} rel="noopener noreferrer">
          {children}
        </MuiLink>
      );
    }

    return (
      <MuiLink href={href} component={Link} {...props}>{children}</MuiLink>
    );
  },
  ProductCard,
  CalendarCard,
  Grid
};