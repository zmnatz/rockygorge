import { 
  Container, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Paper
} from '@mui/material';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import adminYaml from '@config/admin.yml';

export default function AdminIndex({ adminPages }) {
  return (
    <RequireAuth>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage the site content through the following administration pages.
        </Typography>

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
    </RequireAuth>
  );
}

export async function getStaticProps() {
  const adminPages = Object.entries(adminYaml).map(([type, config]: [string, Record<string, unknown>]) => ({
    name: config.title,
    href: `/admin/${type}`,
  }));

  adminPages.push({
    name: 'Dues',
    href: '/admin/dues',
  });

  adminPages.push({
    name: 'Transactions',
    href: '/admin/transactions',
  });

  return {
    props: {
      adminPages,
    },
  };
}
