import Image from "next/image";
import { Box, Container, Link, Typography } from "@mui/material";

const GITHUB_URL = "https://github.com/zmnatz/rockygorge";

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: "divider",
        mt: 6,
        py: 3,
        backgroundColor: "background.paper",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Rocky Gorge Rugby Football Club.{" "}
            <Link href={`${GITHUB_URL}/blob/master/LICENSE`} color="inherit" underline="hover">
              MIT License
            </Link>{" "}
            ·{" "}
            <Link href={`${GITHUB_URL}/blob/master/CODE_OF_CONDUCT.md`} color="inherit" underline="hover">
              Code of Conduct
            </Link>
          </Typography>
          <Link
            href="https://www.netlify.com"
            title="This site is powered by Netlify"
            aria-label="This site is powered by Netlify"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://www.netlify.com/img/global/badges/netlify-color-accent.svg"
              alt="Deploys by Netlify"
              width={110}
              height={24}
              style={{ height: 24, width: "auto" }}
            />
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
