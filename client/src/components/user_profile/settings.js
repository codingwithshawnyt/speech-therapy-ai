import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  TextField,
  Button,
} from '@mui/material';

import {
  selectSettings,
  updateSettings,
} from '../../features/settings/settingsSlice';

const Settings = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);

  const handleChange = (event) => {
    dispatch(
      updateSettings({
        ...settings,
        [event.target.name]: event.target.checked,
      })
    );
  };

  const handleSave = () => {
    // Logic to save settings to the server
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Speech Settings
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={settings.enableRealTimeFeedback}
            onChange={handleChange}
            name="enableRealTimeFeedback"
          />
        }
        label="Enable Real-time Feedback"
      />
      <FormControlLabel
        control={
          <Switch
            checked={settings.enableVisualizations}
            onChange={handleChange}
            name="enableVisualizations"
          />
        }
        label="Enable Visualizations"
      />
      <TextField
        label="Fluency Goal (%)"
        type="number"
        value={settings.fluencyGoal}
        onChange={(event) =>
          dispatch(
            updateSettings({
              ...settings,
              fluencyGoal: parseFloat(event.target.value),
            })
          )
        }
        fullWidth
        margin="normal"
      />
      <Button variant="contained" onClick={handleSave}>
        Save Settings
      </Button>
    </Box>
  );
};

export default Settings;
