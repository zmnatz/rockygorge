import { NextLinkComposed } from "@/utils/nextLink";
import { AppBar, Container, Button, Box, Toolbar as MuiToolbar, IconButton, Menu, MenuItem } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useState } from "react";
import { Link } from "@/types/data";

export function Toolbar ({links}: {links: Link[]}) {
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
        {links.map(({ id, title, description }) => (
          <Button
            key={id}
            component={NextLinkComposed}
            href={id}
            color="inherit"
            sx={{ textTransform: "none", display: { xs: 'none', sm: 'inline-flex' } }}
            title={description}
          >
            {title}
          </Button>
        ))}
        <IconButton
          color="inherit"
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
          {links.map(({ id, title, description }) => (
            <MenuItem
              key={id}
              component="a"
              href={id}
              onClick={handleCloseMenu}
              title={description}
            >
              {title}
            </MenuItem>
          ))}
        </Menu>
      </MuiToolbar>
    </Container>
  </AppBar>
}