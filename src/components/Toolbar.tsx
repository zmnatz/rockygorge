import { NextLinkComposed } from "@/utils/nextLink";
import { AppBar, Container, Button, Box, Toolbar as MuiToolbar, IconButton, Menu, MenuItem, Divider } from "@mui/material";
import links from "@content/links.yml";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useIdentity } from "@/components/IdentityProvider";
import type { Link } from "@/types/data";
import { useState } from "react";

const headerLinks = links.filter(({ header, menuOnly }) => header && !menuOnly);
const menuOnlyLinks = links.filter(({ menuOnly }) => menuOnly);

/** Slugs that must always appear in the dropdown menu (e.g. Gauntlet). */
const alwaysInMenuSlugs = ['/gauntlet'];

export function Toolbar () {
  const { user, isLoading, login, logout } = useIdentity();
  const isAuthenticated = user !== null;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const visibleLinks = headerLinks.filter(({ authRequired }) => !authRequired || isAuthenticated);

  const menuLinks = ((): Link[] => {
    const pinned = alwaysInMenuSlugs
      .map((slug) => links.find((link) => link.slug === slug))
      .filter((link): link is Link => Boolean(link) && (!link.authRequired || isAuthenticated));
    const inMenu = [...visibleLinks, ...pinned, ...menuOnlyLinks.filter(({ authRequired }) => !authRequired || isAuthenticated)];
    const seen = new Set<string>();
    return inMenu.filter((link) => {
      if (seen.has(link.slug)) return false;
      seen.add(link.slug);
      return true;
    });
  })();

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
        {visibleLinks.map(({ slug, href, title, summary }) => (
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
        {!isLoading && (
          <Button
            color="inherit"
            sx={{ textTransform: "none", ml: 1 }}
            onClick={() =>
              isAuthenticated
                ? logout()
                : login()
            }
          >
            {isAuthenticated ? "Log out" : "Log in"}
          </Button>
        )}
        <IconButton
          color="inherit"
          aria-label="app menu"
          title="Application Menu"
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
          {menuLinks.map(({ slug, href, title, summary }) => (
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
          {!isLoading && menuLinks.length > 0 && <Divider />}
          {!isLoading && (
            <MenuItem
              onClick={() => {
                handleCloseMenu();
                isAuthenticated
                  ? logout()
                  : login();
              }}
            >
              {isAuthenticated ? "Log out" : "Log in"}
            </MenuItem>
          )}
        </Menu>
      </MuiToolbar>
    </Container>
  </AppBar>
}