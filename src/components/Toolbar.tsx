import { NextLinkComposed } from "@/utils/nextLink";
import { AppBar, Container, Button, Box, Toolbar as MuiToolbar, IconButton, Menu, MenuItem } from "@mui/material";
import links from "@content/links.yml";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useState } from "react";

const headerLinks = links.filter(({ header }) => header);

export function Toolbar () {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return <AppBar position="static">
    <Container maxWidth="lg">
      <MuiToolbar disableGutters>
        <Button
          component={NextLinkComposed}
          href="/"
          color="inherit"
          sx={{ textTransform: "none", fontSize: 20 }}
        >
          Rocky Gorge Rugby
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {headerLinks.map(({ slug, href, title, summary }) => (
          <Button
            key={slug}
            component={NextLinkComposed}
            href={href}
            color="inherit"
            sx={{ textTransform: "none", display: { xs: 'none', sm: 'inline-flex' } }}
            title={summary}
          >
            {title}
          </Button>
        ))}
        <IconButton
          color="inherit"
          aria-label="app menu"
          title="Application Menu"
          sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
          onClick={handleOpenMenu}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleCloseMenu}
          keepMounted
        >
          {headerLinks.map(({ slug, href, title, summary }) => (
            <MenuItem
              key={slug}
              component="a"
              href={href}
              onClick={handleCloseMenu}
              title={summary}
            >
              {title}
            </MenuItem>
          ))}
        </Menu>
      </MuiToolbar>
    </Container>
  </AppBar>
}