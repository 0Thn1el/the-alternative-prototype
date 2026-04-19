import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import ForgotPassword from './components/ForgotPassword';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  position: 'relative',
  borderRadius: 24,
  border: '1px solid rgba(124, 106, 92, 0.16)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(249,247,244,0.98) 100%)',
  boxShadow: '0 24px 70px rgba(90, 80, 71, 0.14)',
  ...theme.applyStyles('dark', {
    border: '1px solid rgba(212, 206, 195, 0.14)',
    background: 'linear-gradient(180deg, rgba(42,36,32,0.98) 0%, rgba(26,23,20,0.98) 100%)',
    boxShadow: '0 26px 80px rgba(0, 0, 0, 0.35)',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  position: 'relative',
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(circle at top, rgba(232,227,219,0.95) 0%, rgba(249,247,244,1) 38%, rgba(245,241,236,1) 100%)',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(circle at top, rgba(58,52,45,0.9) 0%, rgba(42,36,32,1) 42%, rgba(26,23,20,1) 100%)',
    }),
  },
}));

interface SignInProps {
  disableCustomTheme?: boolean;
  onSwitchToSignUp?: () => void;
}


export default function SignIn(props: SignInProps) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [firebaseError, setFirebaseError] = React.useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    try {
      setLoading(true);
      setFirebaseError('');
      
      // Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // Authentication successful - useAuth hook will handle state update
    } catch (error: any) {
      setFirebaseError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem', bgcolor: 'background.paper', borderRadius: 3, minWidth: 120 }} />
        <Card variant="outlined">
          <Stack spacing={1}>
            <Typography
              component="h1"
              sx={{
                color: 'text.primary',
                fontSize: '1.25rem',
                fontWeight: 400,
                fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
                lineHeight: 1.2,
              }}
            >
              The Alternative
            </Typography>
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', color: 'text.primary', fontWeight: 700 }}
          >
            Sign in
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Welcome back to your sustainable fashion space.
          </Typography>
          </Stack>
          {firebaseError && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>{firebaseError}</Alert>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailError ? 'error' : 'primary'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                  },
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                  },
                }}
              />
            </FormControl>
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <ForgotPassword open={open} handleClose={handleClose} />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.4,
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              variant="body2"
              sx={{ alignSelf: 'center', color: 'primary.main' }}
            >
              Forgot your password?
            </Link>
          </Box>
          <Divider sx={{ color: 'text.secondary' }}>or</Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* <Button
              fullWidth
              variant="outlined"
              onClick={() => alert('Sign in with Google')}
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert('Sign in with Facebook')}
              startIcon={<FacebookIcon />}
            >
              Sign in with Facebook
            </Button> */}
            <Typography sx={{ textAlign: 'center' }}>
              Don&apos;t have an account?{' '}
              <Link
                component="button"
                variant="body2"
                sx={{ alignSelf: 'center', color: 'primary.main', fontWeight: 600 }}
                onClick={() => props.onSwitchToSignUp && props.onSwitchToSignUp()}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}
