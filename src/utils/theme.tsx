import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#002366", // royal blue
      light: "#4b6cb7",
      dark: "#001753",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#00a550", // green accent
      light: "#4caf50",
      dark: "#00701a",
      contrastText: "#ffffff",
    },
    text: {
      primary: "#0a0a0a",
      secondary: "#333333",
    },
    background: {
      default: "#f2f4f8", // silver-like
      paper: "#ffffff",
    },
    divider: "rgba(0, 0, 0, 0.12)",
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      "\"Segoe UI\"",
      "Roboto",
      "\"Helvetica Neue\"",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "4rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
    h3: {
      fontSize: "2rem",
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

theme.components = {
  MuiCard: {
    defaultProps: {
      raised: true,
    },
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
        marginBottom: theme.spacing(2),
        [theme.breakpoints.down("sm")]: {
          marginLeft: theme.spacing(2),
          marginRight: theme.spacing(2),
        },
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      },
    },
  },
  MuiTypography: {
    variants: [
      {
        props: { variant: "h1" },
        style: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
      {
        props: { variant: "h2" },
        style: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
      {
        props: { variant: "h3" },
        style: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
      {
        props: { variant: "h4" },
        style: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
      {
        props: { variant: "h5" },
        style: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
      {
        props: { variant: "h6" },
        style: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
    ],
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        textTransform: "none",
        borderRadius: theme.shape.borderRadius,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        textDecoration: "none",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        "&:hover": {
          textDecoration: "underline",
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: "2px",
        },
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        "&:nth-of-type(odd)": {
          backgroundColor: theme.palette.action.hover,
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
        fontWeight: 700,
      },
    },
  },
  MuiCssBaseline: {
    styleOverrides: {
      html: {
        scrollBehavior: "smooth",
      },
      "*": {
        boxSizing: "border-box",
      },
      "*::before, *::after": {
        boxSizing: "border-box",
      },
      body: {
        margin: 0,
        fontFeatureSettings: "\"rlig\" 1",
      },
      "a, a:visited": {
        textDecoration: "none",
      },
      "*:focus-visible": {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: "2px",
      },
    },
  },
};
