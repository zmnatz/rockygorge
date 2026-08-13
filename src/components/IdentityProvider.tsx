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
  /** Returns a fresh access token for authenticated API calls, or null when signed out. */
  getAccessToken: () => Promise<string | null>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

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

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NetlifyIdentity.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    loadWidget().then((widget) => {
      if (disposed) return;

      const handleInit = (nextUser: NetlifyIdentity.User | null) => {
        if (disposed) return;
        setUser(nextUser);
        setIsLoading(false);
      };

      widget.on('init', handleInit);
      widget.on('login', handleInit);
      widget.on('logout', () => handleInit(null));
      handleInit(widget.currentUser());
    });

    return () => {
      disposed = true;
    };
  }, []);

  const login = useCallback(() => {
    void loadWidget().then((widget) => widget.open('login'));
  }, []);

  const logout = useCallback(() => {
    void loadWidget().then((widget) => widget.logout());
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const widget = await loadWidget();
    try {
      const token = await widget.refresh();
      if (token) return token;
    } catch {
      // Fall through to the last known access token.
    }
    return widget.currentUser()?.token?.access_token ?? null;
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
