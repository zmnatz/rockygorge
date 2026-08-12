import { 
  Box, 
  Container, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Paper,
  Button
} from '@mui/material';
import Link from 'next/link';
import { useIdentity } from '@/components/IdentityProvider';
import { RequireAuth } from '@/components/RequireAuth';
import adminYaml from '@config/admin.yml';

export default function AdminIndex({ adminPages }) {
  const { logout } = useIdentity();

  return (
    <RequireAuth>
      <Container sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4">
            Admin Dashboard
          </Typography>
          <Button
            onClick={() => logout()}
          >
            Log out
          </Button>
        </Box>
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

  return {
    props: {
      adminPages,
    },
  };
}
