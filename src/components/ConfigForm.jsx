import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';

const ConfigForm = () => {
  const [credentials, setCredentials] = useState({
    facebook: {
      appId: '',
      appSecret: '',
    },
    instagram: {
      appId: '',
      appSecret: '',
    },
    bluesky: {
      handle: '',
      appPassword: '',
    },
  });

  const [saveStatus, setSaveStatus] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    // Load saved credentials when component mounts
    const loadCredentials = async () => {
      try {
        const savedCreds = await window.electronAPI.storeGet('credentials');
        if (savedCreds) {
          setCredentials(savedCreds);
        }
      } catch (error) {
        console.error('Error loading credentials:', error);
      }
    };
    loadCredentials();
  }, []);

  const handleChange = (platform, field, value) => {
    setCredentials(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      await window.electronAPI.storeSet('credentials', credentials);
      setSaveStatus({
        show: true,
        message: 'Credentials saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSaveStatus({
        show: true,
        message: 'Error saving credentials: ' + error.message,
        severity: 'error',
      });
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Platform Configuration
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Facebook & Instagram</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="App ID"
              value={credentials.facebook.appId}
              onChange={(e) => handleChange('facebook', 'appId', e.target.value)}
              fullWidth
            />
            <TextField
              label="App Secret"
              type="password"
              value={credentials.facebook.appSecret}
              onChange={(e) => handleChange('facebook', 'appSecret', e.target.value)}
              fullWidth
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Bluesky</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Handle"
              value={credentials.bluesky.handle}
              onChange={(e) => handleChange('bluesky', 'handle', e.target.value)}
              fullWidth
            />
            <TextField
              label="App Password"
              type="password"
              value={credentials.bluesky.appPassword}
              onChange={(e) => handleChange('bluesky', 'appPassword', e.target.value)}
              fullWidth
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          startIcon={<SaveIcon />}
        >
          Save Credentials
        </Button>
      </Box>

      {saveStatus.show && (
        <Alert
          severity={saveStatus.severity}
          sx={{ mt: 2 }}
          onClose={() => setSaveStatus({ ...saveStatus, show: false })}
        >
          {saveStatus.message}
        </Alert>
      )}
    </Paper>
  );
};

export default ConfigForm; 