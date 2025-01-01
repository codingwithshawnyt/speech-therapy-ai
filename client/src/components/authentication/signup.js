import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { useMutation, gql } from '@apollo/client';

import { signup, selectSignupError, selectSignupLoading } from '../../features/user/userSlice';
import { GoogleLogin } from '@react-oauth/google';
import { googleSignup } from '../../utils/auth';

const SIGNUP_MUTATION = gql`
  mutation Signup($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
    signup(email: $email, password: $password, firstName: $firstName, lastName: $lastName) {
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
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const signupError = useSelector(selectSignupError);
  const signupLoading = useSelector(selectSignupLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [signupMutation, { loading: mutationLoading, error: mutationError }] =
    useMutation(SIGNUP_MUTATION);

  const onSubmit = async (data) => {
    try {
      const { data: signupData } = await signupMutation({
        variables: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      // Dispatch the signup action with the token and user data
      dispatch(signup({ token: signupData.signup.token, user: signupData.signup.user }));

      // Redirect to the dashboard after successful signup
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      // Handle signup errors (e.g., display error messages)
    }
  };

  useEffect(() => {
    if (mutationError) {
      // Handle GraphQL mutation errors
      console.error('GraphQL error:', mutationError);
    }
  }, [mutationError]);

  const handleGoogleSignupSuccess = async (credentialResponse) => {
    try {
      await googleSignup(credentialResponse.credential);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google signup error:', error);
    }
  };

  const handleGoogleSignupError = (error) => {
    console.error('Google signup error:', error);
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography component="h1" variant="h5">
        Sign up
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ mt: 3 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              autoComplete="given-name"
              name="firstName"
              required
              fullWidth
              id="firstName"
              label="First Name"
              autoFocus
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
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
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
        {signupError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {signupError}
          </Alert>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={signupLoading || mutationLoading}
        >
          {signupLoading || mutationLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Sign Up'
          )}
        </Button>
        <Grid container justifyContent="flex-end">
          <Grid item>
            <Link href="/login" variant="body2">
              Already have an account? Sign in
            </Link>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <GoogleLogin
            onSuccess={handleGoogleSignupSuccess}
            onError={handleGoogleSignupError}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default SignupPage;