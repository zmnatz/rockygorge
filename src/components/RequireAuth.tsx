import { useEffect, type ReactNode } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: window.location.pathname + window.location.search,
        },
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading || !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
        <CircularProgress size={24} />
        <Typography>
          {isLoading ? 'Checking session...' : 'Redirecting to sign in...'}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
