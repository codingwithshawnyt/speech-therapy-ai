import React, { useEffect, Suspense, lazy } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { initializeAuth } from './utils/auth';
import theme from './theme';
import { fetchUserData, selectUser, selectIsAuthenticated } from './features/user/userSlice';
import { fetchSettings } from './features/settings/settingsSlice';
import ProtectedRoute from './components/common/ProtectedRoute';
import GuestRoute from './components/common/GuestRoute';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useTranslation } from 'react-i18next';
import './i18n'; // Import i18n configuration

// Lazy loading for performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const TherapyPage = lazy(() => import('./pages/therapy/TherapyPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

function App() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // Fetch user data and settings if authenticated
    if (isAuthenticated) {
      dispatch(fetchUserData());
      dispatch(fetchSettings());
    }

    // Initialize Firebase Authentication
    initializeAuth();
  }, [dispatch, isAuthenticated]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <HelmetProvider>
      <Helmet>
        <html lang={i18n.language} />
        <title>Speak with Confidence</title>
        <meta name="description" content="An AI-powered speech therapy platform." />
      </Helmet>

      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer /> 

        <Router>
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Guest Routes */}
                <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/therapy" element={<ProtectedRoute><TherapyPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                {/* Static Pages */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />

                {/* Catch-all Route */}
                <Route path="*" element={<NotFoundPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} /> 
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;