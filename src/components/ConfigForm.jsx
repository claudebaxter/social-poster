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
  InputAdornment,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const ConfigForm = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

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
    twitter: {
      intentUrl: 'https://twitter.com/intent/tweet',
    },
  });

  const [saveStatus, setSaveStatus] = useState({ show: false, message: '', severity: 'success' });
  const [expanded, setExpanded] = useState(false);

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

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleSave = async () => {
    try {
      console.log('=== SAVING CREDENTIALS ===');
      console.log('Full credentials object:', credentials);
      console.log('Bluesky handle:', credentials.bluesky.handle);
      console.log('Bluesky app password length:', credentials.bluesky.appPassword.length);
      console.log('Bluesky app password (first 4 chars):', credentials.bluesky.appPassword.substring(0, 4) + '...');
      
      await window.electronAPI.storeSet('credentials', credentials);
      
      // Verify what was actually saved
      const savedCreds = await window.electronAPI.storeGet('credentials');
      console.log('=== VERIFICATION: Retrieved after save ===');
      console.log('Retrieved credentials:', savedCreds);
      console.log('Retrieved Bluesky handle:', savedCreds?.bluesky?.handle);
      console.log('Retrieved Bluesky password length:', savedCreds?.bluesky?.appPassword?.length);
      
      setSaveStatus({
        show: true,
        message: 'Credentials saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving credentials:', error);
      setSaveStatus({
        show: true,
        message: 'Error saving credentials: ' + error.message,
        severity: 'error',
      });
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: isSmallScreen ? 2 : 3,
        width: '100%',
        maxWidth: '100%',
        mx: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Platform Configuration
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Accordion 
          expanded={expanded === 'facebook'} 
          onChange={handleAccordionChange('facebook')}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              minHeight: 48,
              '& .MuiAccordionSummary-content': {
                margin: '12px 0',
              }
            }}
          >
            <Typography>Facebook & Instagram</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="App ID"
                value={credentials.facebook.appId}
                onChange={(e) => handleChange('facebook', 'appId', e.target.value)}
                fullWidth
                size={isSmallScreen ? "small" : "medium"}
              />
              <TextField
                label="App Secret"
                type="password"
                value={credentials.facebook.appSecret}
                onChange={(e) => handleChange('facebook', 'appSecret', e.target.value)}
                fullWidth
                size={isSmallScreen ? "small" : "medium"}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion 
          expanded={expanded === 'bluesky'} 
          onChange={handleAccordionChange('bluesky')}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              minHeight: 48,
              '& .MuiAccordionSummary-content': {
                margin: '12px 0',
              }
            }}
          >
            <Typography>Bluesky</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Handle"
                value={credentials.bluesky.handle}
                onChange={(e) => handleChange('bluesky', 'handle', e.target.value)}
                fullWidth
                size={isSmallScreen ? "small" : "medium"}
              />
              <TextField
                label="App Password"
                type="password"
                value={credentials.bluesky.appPassword}
                onChange={(e) => handleChange('bluesky', 'appPassword', e.target.value)}
                fullWidth
                size={isSmallScreen ? "small" : "medium"}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion 
          expanded={expanded === 'twitter'} 
          onChange={handleAccordionChange('twitter')}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              minHeight: 48,
              '& .MuiAccordionSummary-content': {
                margin: '12px 0',
              }
            }}
          >
            <Typography>X (Twitter)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Intent URL"
                value={credentials.twitter.intentUrl}
                onChange={(e) => handleChange('twitter', 'intentUrl', e.target.value)}
                fullWidth
                size={isSmallScreen ? "small" : "medium"}
                helperText="Customize the Twitter intent URL (e.g., add default hashtags)"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="This URL will be used to open Twitter's web interface with your post pre-filled. You can customize it with default hashtags or other parameters.">
                        <HelpOutlineIcon color="action" />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          size={isSmallScreen ? "small" : "medium"}
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