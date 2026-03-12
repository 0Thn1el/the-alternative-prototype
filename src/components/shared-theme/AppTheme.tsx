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
        mode: 'dark',
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
