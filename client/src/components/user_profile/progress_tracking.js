import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import { format } from 'date-fns';

import {
  selectProgress,
  fetchProgress,
  selectProgressLoading,
  selectProgressError,
} from '../../features/user/userSlice';

const ProgressTracking = () => {
  const dispatch = useDispatch();
  const progress = useSelector(selectProgress);
  const progressLoading = useSelector(selectProgressLoading);
  const progressError = useSelector(selectProgressError);

  useEffect(() => {
    dispatch(fetchProgress());
  }, [dispatch]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Progress History
      </Typography>
      {progressLoading && <LinearProgress />}
      {progressError && (
        <Typography variant="body2" color="error">
          {progressError}
        </Typography>
      )}
      {!progressLoading && !progressError && (
        <List>
          {progress.map((item) => (
            <ListItem key={item.date}>
              <ListItemText
                primary={format(new Date(item.date), 'yyyy-MM-dd HH:mm')}
                secondary={`Fluency Score: ${item.fluencyScore}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ProgressTracking;
