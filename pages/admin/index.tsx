import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Paper 
} from '@mui/material';
import Link from 'next/link';

const ADMIN_PAGES = [
  { name: 'Store Admin', href: '/admin/store' },
  { name: 'Forms Admin', href: '/admin/forms' },
  { name: 'Links Admin', href: '/admin/links' },
  { name: 'Calendar Admin', href: '/admin/calendar' },
];

export default function AdminIndex() {
  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage the site content through the following administration pages.
        </Typography>
      </Box>

      <Paper elevation={2}>
        <List>
          {ADMIN_PAGES.map((page) => (
            <ListItem key={page.href} disablePadding>
              <ListItemButton 
                component={Link} 
                href={page.href}
                sx={{ 
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemText primary={page.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}
