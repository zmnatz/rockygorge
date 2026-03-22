import type { Preview } from "@storybook/react";
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

import { PAYPAL_SETTINGS } from '../src/utils/paypal';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';

/* TODO: update import for your custom Material UI themes */
import { theme } from '../src/utils/theme';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  decorators: [(Story) => (
    <PayPalScriptProvider options={PAYPAL_SETTINGS}>
      <Story />
    </PayPalScriptProvider>
  ), withThemeFromJSXProvider({
    GlobalStyles: CssBaseline,
    Provider: ThemeProvider,
    themes: {
      theme
    },
    defaultTheme: 'theme',
  })]
};

export default preview;