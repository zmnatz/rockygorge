import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type * as NetlifyIdentity from 'netlify-identity-widget';

type Identity = typeof NetlifyIdentity;

interface IdentityContextValue {
  /** The signed-in user, or null when logged out. */
  user: NetlifyIdentity.User | null;
  /** True until the widget has finished initialising. */
  isLoading: boolean;
  /** Opens the Netlify Identity login modal. */
  login: () => void;
  /** Logs the current user out. */
  logout: () => void;
  /** Returns a fresh access token for authenticated API calls, or null when no valid token is available. */
  getAccessToken: () => Promise<string | null>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

const IDENTITY_INIT_TIMEOUT_MS = 5000;

let widgetPromise: Promise<Identity> | null = null;

function loadWidget(): Promise<Identity> {
  widgetPromise ??= import('netlify-identity-widget').then((mod) => {
    const globalWidget = (globalThis as { netlifyIdentity?: Identity }).netlifyIdentity;
    const widget =
      (mod as { default?: Identity }).default ?? globalWidget ?? (mod as unknown as Identity);
    if (typeof window !== 'undefined') {
      widget.init();
    }
    return widget;
  });
  return widgetPromise;
}

function isTokenValid(token: NetlifyIdentity.Token | undefined): boolean {
  if (!token?.access_token) return false;
  if (token.expires_at == null) return true;
  const expiresAt = Number(token.expires_at);
  if (!Number.isFinite(expiresAt)) return true;
  return expiresAt > Date.now();
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NetlifyIdentity.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    loadWidget()
      .then((widget) => {
        if (disposed) return;

        const handleUserChange = (nextUser: NetlifyIdentity.User | null) => {
          if (disposed) return;
          setUser(nextUser);
          setIsLoading(false);
        };

        widget.on('init', handleUserChange);
        widget.on('login', handleUserChange);
        widget.on('logout', () => handleUserChange(null));
        handleUserChange(widget.currentUser());
      })
      .catch(() => {
        if (disposed) return;
        setIsLoading(false);
      });

    const timeout = setTimeout(() => {
      if (disposed) return;
      setIsLoading(false);
    }, IDENTITY_INIT_TIMEOUT_MS);

    return () => {
      disposed = true;
      clearTimeout(timeout);
    };
  }, []);

  const login = useCallback(() => {
    void loadWidget()
      .then((widget) => widget.open('login'))
      .catch(() => {});
  }, []);

  const logout = useCallback(() => {
    void loadWidget()
      .then((widget) => widget.logout())
      .catch(() => {});
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const widget = await loadWidget();
    try {
      const token = await widget.refresh();
      if (token) return token;
    } catch {
      // Refresh failed — fall back to the cached token only if it is still valid.
    }
    const cachedToken = widget.currentUser()?.token;
    return cachedToken && isTokenValid(cachedToken) ? cachedToken.access_token : null;
  }, []);

  return (
    <IdentityContext.Provider
      value={{ user, isLoading, login, logout, getAccessToken }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return ctx;
}
