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
import adminYaml from '@config/admin.yml';

export default function AdminIndex({ adminPages }) {
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
          {adminPages.map((page) => (
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

export async function getStaticProps() {
  const adminPages = Object.entries(adminYaml).map(([type, config]: [string, any]) => ({
    name: config.title,
    href: `/admin/${type}`,
  }));

  return {
    props: {
      adminPages,
    },
  };
}
