import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useIdentity } from '@/components/IdentityProvider';

interface RequireAuthContextValue {
  getAccessToken: () => Promise<string | null>;
}

const RequireAuthContext = createContext<RequireAuthContextValue | null>(null);

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, login, getAccessToken } = useIdentity();
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

  return (
    <RequireAuthContext.Provider value={{ getAccessToken }}>
      {children}
    </RequireAuthContext.Provider>
  );
}

export function useRequireAuth(): RequireAuthContextValue {
  const ctx = useContext(RequireAuthContext);
  if (!ctx) {
    throw new Error('useRequireAuth must be used within a RequireAuth');
  }
  return ctx;
}
