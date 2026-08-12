import { useEffect, type ReactNode } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useIdentity } from '@/components/IdentityProvider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, login } = useIdentity();
  const isAuthenticated = user !== null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login();
    }
  }, [isLoading, isAuthenticated, login]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
        <CircularProgress size={24} />
        <Typography>Checking session...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Sign in required
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Sign in to manage the site content. If the login window did not open,
          use the button below.
        </Typography>
        <Button variant="contained" onClick={login}>
          Sign in
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}
