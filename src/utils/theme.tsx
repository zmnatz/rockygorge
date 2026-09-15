import { createTheme } from "@mui/material";
import { visuallyHidden } from "@mui/utils";

declare module "@mui/material/Paper" {
  interface PaperPropsVariantOverrides {
    clickable: true;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    skipLink: true;
  }
}

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
          marginLeft: theme.spacing(3),
          marginRight: theme.spacing(3),
        },
      },
    },
    variants: [
      {
        // Whole-card navigation (see ProductCard): the header title link
        // stretches over the card while content links stay clickable above it.
        props: { variant: "clickable" },
        style: ({ theme }) => ({
          height: "100%",
          position: "relative",
          cursor: "pointer",
          "&:hover": {
            boxShadow: theme.shadows[4],
          },
          // Focus lands on the white-on-blue title link, where the theme's
          // primary outline would be invisible — ring the card instead.
          "&:focus-within": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: "2px",
          },
          "& .MuiCardHeader-root a:focus-visible": {
            outline: "none",
          },
          "& .MuiCardHeader-root a::after": {
            content: '""',
            position: "absolute",
            inset: 0,
          },
          "& .MuiCardContent-root a": {
            position: "relative",
          },
        }),
      },
    ],
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        whiteSpace: 'wrap'
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: {
        textDecoration: 'none',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      },
    },
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
    variants: [
      {
        // Keyboard-only skip link: hidden until focused, then pinned visible.
        props: { variant: "skipLink" },
        style: ({ theme }) => ({
          ...visuallyHidden,
          "&:focus-visible": {
            clip: "auto",
            clipPath: "none",
            height: "auto",
            width: "auto",
            margin: 0,
            overflow: "visible",
            position: "fixed",
            top: theme.spacing(2),
            left: theme.spacing(2),
            zIndex: theme.zIndex.modal,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            padding: theme.spacing(1),
            borderRadius: theme.shape.borderRadius,
          },
        }),
      },
    ],
  },
  MuiListSubheader: {
    styleOverrides: {
      root: {
        fontSize: '1.2rem',
        lineHeight: 1.2
      }
    }
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        paddingTop: theme.spacing(.25),
        paddingBottom: theme.spacing(.25),
      }
    }
  },
  MuiListItemText: {
    defaultProps: {
      sx: { whiteSpace: "normal" },
      slotProps: {
        primary: { noWrap: false },
        secondary: {noWrap: false }
      }
    },
    styleOverrides: {
      dense: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
        '& .MuiListItemText-primary': {
          flexGrow: 1,
          minWidth: 0,
        },
        '& .MuiListItemText-secondary': {
          width: theme.spacing(20),
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
      main: {
        maxWidth: 1800,
        marginLeft: "auto",
        marginRight: "auto",
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        "&:focus": {
          outline: "none",
        },
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
