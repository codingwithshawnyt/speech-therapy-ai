import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

import {
  selectUser,
  selectProgress,
  fetchProgress,
  selectProgressLoading,
  selectProgressError,
  resetProgress,
  selectLastSession,
} from '../../features/user/userSlice';
import { selectSettings } from '../../features/settings/settingsSlice';
import { useSubscription, gql } from '@apollo/client';

const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StatCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  borderRadius: theme.shape.borderRadius,
}));

const AvatarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const PROGRESS_SUBSCRIPTION = gql`
  subscription OnProgressUpdated($userId: ID!) {
    progressUpdated(userId: $userId) {
      date
      fluencyScore
    }
  }
`;

const DashboardPage = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const user = useSelector(selectUser);
  const progress = useSelector(selectProgress);
  const progressLoading = useSelector(selectProgressLoading);
  const progressError = useSelector(selectProgressError);
  const settings = useSelector(selectSettings);
  const lastSession = useSelector(selectLastSession);
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  const { data: subscriptionData, loading: subscriptionLoading } = useSubscription(
    PROGRESS_SUBSCRIPTION,
    { variables: { userId: user.id } }
  );

  useEffect(() => {
    dispatch(fetchProgress());
    return () => dispatch(resetProgress()); // Clean up on unmount
  }, [dispatch, user.id]);

  useEffect(() => {
    if (subscriptionData) {
      // Update progress data in Redux store when new data arrives from subscription
      dispatch(updateProgress(subscriptionData.progressUpdated));
    }
  }, [subscriptionData, dispatch]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleStartSession = () => {
    // Logic to start a new therapy session
    navigate('/therapy');
  };

  // Format progress data for the chart
  const chartData = progress.map((item) => ({
    date: format(new Date(item.date), 'yyyy-MM-dd'),
    Fluency: item.fluencyScore,
  }));

  return (
    <DashboardContainer>
      <Grid container spacing={3}>
        {/* User Info Card */}
        <Grid item xs={12} md={4}>
          <StatCard>
            <CardContent>
              <AvatarContainer>
                <Avatar
                  alt={`${user.firstName} ${user.lastName}`}
                  src="/static/images/avatar/1.jpg"
                  sx={{ width: 80, height: 80 }}
                />
              </AvatarContainer>
              <Typography variant="h6" component="div" align="center">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                {user.email}
              </Typography>
              {lastSession && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Last Session: {format(new Date(lastSession.date), 'yyyy-MM-dd HH:mm')}
                  </Typography>
                  <Typography variant="body2">
                    Fluency Score: {lastSession.fluencyScore}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </StatCard>
        </Grid>

        {/* Progress Card */}
        <Grid item xs={12} md={8}>
          <StatCard>
            <CardContent>
              <Typography variant="h6" component="div">
                Progress
              </Typography>
              {progressLoading && <LinearProgress />}
              {progressError && (
                <Typography variant="body2" color="error">
                  {progressError}
                </Typography>
              )}
              {!progressLoading && !progressError && progress.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Fluency" stroke={theme.palette.primary.main} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No progress data available.
                </Typography>
              )}
            </CardContent>
          </StatCard>
        </Grid>

        {/* Goals and Settings */}
        <Grid item xs={12}>
          <Tabs value={currentTab} onChange={handleTabChange} centered>
            <Tab label="Goals" />
            <Tab label="Settings" />
          </Tabs>
          {currentTab === 0 && (
            <Box sx={{ p: 3 }}>
              {/* Display user's goals here */}
              <Typography variant="h6" gutterBottom>
                My Goals
              </Typography>
              {/* ... goal setting and tracking components ... */}
            </Box>
          )}
          {currentTab === 1 && (
            <Box sx={{ p: 3 }}>
              {/* Display user's settings here */}
              <Typography variant="h6" gutterBottom>
                My Settings
              </Typography>
              {/* ... settings modification components ... */}
            </Box>
          )}
        </Grid>

        {/* Start Session Button */}
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" color="primary" onClick={handleStartSession}>
            Start Session
          </Button>
        </Grid>
      </Grid>

      {/* Session Feedback Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Session Feedback</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {/* ... display session feedback and analysis ... */}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
};

export default DashboardPage;
