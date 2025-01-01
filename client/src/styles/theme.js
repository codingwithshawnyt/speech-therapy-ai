import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Define the base theme
let theme = createTheme({
  palette: {
    mode: 'light', // Default to light mode
    primary: {
      main: '#007bff', // Blue
      light: '#66a4ff',
      dark: '#0056b3',
      contrastText: '#fff',
    },
    secondary: {
      main: '#6c757d', // Gray
      light: '#99a3a9',
      dark: '#495057',
      contrastText: '#fff',
    },
    error: {
      main: '#dc3545', // Red
    },
    warning: {
      main: '#ffc107', // Amber
    },
    info: {
      main: '#17a2b8', // Cyan
    },
    success: {
      main: '#28a745', // Green
    },
    background: {
      default: '#f8f9fa', // Light gray
      paper: '#fff',
    },
    text: {
      primary: '#212529', // Dark gray
      secondary: '#6c757d', // Gray
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily: [
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 500,
      fontSize: '3rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 500,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 500,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.75rem',
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.2,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none', // Disable uppercase transformation
    },
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 8, // Default spacing unit
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    // Customize specific components
    MuiButton: {
      styleOverrides: {
        root: {
          // Apply custom styles to all buttons
          borderRadius: '8px', // Example: Rounded corners
          transition: 'background-color 0.3s ease', // Smooth transitions
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)', // Subtle hover effect
          },
        },
        containedPrimary: {
          // Apply custom styles to primary contained buttons
          backgroundColor: '#0069d9', // Slightly darker blue
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Apply custom styles to the app bar
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)', // Subtle shadow
        },
      },
    },
    // ... more component customizations
  },
  // Add transitions for smoother animations
  transitions: {
    create: () => 'all 0.3s ease-in-out',
  },
});

// Make the theme responsive
theme = responsiveFontSizes(theme);

export default theme;