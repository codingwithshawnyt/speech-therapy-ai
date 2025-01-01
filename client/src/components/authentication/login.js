import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useLazyQuery, gql } from '@apollo/client';
import { GoogleLogin } from '@react-oauth/google';

import { login, selectLoginError, selectLoginLoading } from '../../features/user/userSlice';
import { googleLogin } from '../../utils/auth';
import useAuthPersistence from '../../hooks/useAuthPersistence';

const LOGIN_QUERY = gql`
  query Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

const schema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const loginError = useSelector(selectLoginError);
  const loginLoading = useSelector(selectLoginLoading);
  const [showPassword, setShowPassword] = useState(false);
  const { persistAuth, unpersistAuth } = useAuthPersistence(); // Custom hook for auth persistence

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [loginQuery, { loading: queryLoading, error: queryError }] =
    useLazyQuery(LOGIN_QUERY, {
      fetchPolicy: 'network-only', // Force fetching data from the network
      onCompleted: (data) => {
        // Dispatch the login action with the token and user data
        dispatch(login({ token: data.login.token, user: data.login.user }));

        // Persist authentication if "Remember me" is checked
        if (rememberMe) {
          persistAuth(data.login.token);
        }

        // Redirect to the intended location or the dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      },
      onError: (error) => {
        console.error('Login error:', error);
        // Handle login errors (e.g., display error messages)
      },
    });

  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (queryError) {
      // Handle GraphQL query errors
      console.error('GraphQL error:', queryError);
    }
  }, [queryError]);

  const onSubmit = async (data) => {
    try {
      await loginQuery({
        variables: {
          email: data.email,
          password: data.password,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleGoogleLoginError = (error) => {
    console.error('Google login error:', error);
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleLogout = () => {
    dispatch(logout()); // Dispatch logout action
    unpersistAuth(); // Clear persisted authentication data
    navigate('/login');
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography component="h1" variant="h5">
        Sign in
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ mt: 1 }}
      >
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {/* "Remember me" checkbox */}
        <div>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={handleRememberMeChange}
          />
          <label htmlFor="rememberMe"> Remember me</label>
        </div>
        {loginError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {loginError}
          </Alert>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loginLoading || queryLoading}
        >
          {loginLoading || queryLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Sign In'
          )}
        </Button>
        <Grid container>
          <Grid item xs>
            <Link href="#" variant="body2">
              Forgot password?
            </Link>
          </Grid>
          <Grid item>
            <Link component={RouterLink} to="/signup" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;