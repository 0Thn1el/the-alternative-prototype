import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

interface AppThemeProps {
  children: React.ReactNode;
  disableCustomTheme?: boolean;
}

export default function AppTheme(props: AppThemeProps) {
  const { children, disableCustomTheme } = props;
  
  const theme = React.useMemo(() => {
    return createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: '#7c6a5c',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#e8e3db',
          contrastText: '#3d362f',
        },
        background: {
          default: '#f9f7f4',
          paper: '#ffffff',
        },
        text: {
          primary: '#2c2923',
          secondary: '#8a7e71',
        },
        divider: '#ebe7df',
        error: {
          main: '#d97757',
        },
      },
      shape: {
        borderRadius: 14,
      },
      typography: {
        fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      },
    });
  }, []);

  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}
