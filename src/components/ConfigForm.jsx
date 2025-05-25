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
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FacebookIcon from '@mui/icons-material/Facebook';
import LogoutIcon from '@mui/icons-material/Logout';

const ConfigForm = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [credentials, setCredentials] = useState({
    facebook: {
      accessToken: '',
      userInfo: null,
      pages: [],
    },
    instagram: {
      accessToken: '',
      userInfo: null,
      pages: [],
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
  const [metaAuthLoading, setMetaAuthLoading] = useState(false);

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

    // Listen for OAuth callback
    const handleOAuthCallback = async (event, { code }) => {
      try {
        setMetaAuthLoading(true);
        
        const result = await window.electronAPI.exchangeMetaCode(code);
        
        if (result.success) {
          // Update credentials with the new OAuth data
          setCredentials(prev => ({
            ...prev,
            facebook: {
              accessToken: prev.facebook.accessToken,
              userInfo: result.user,
              pages: result.pages,
            },
            instagram: {
              accessToken: prev.instagram.accessToken,
              userInfo: result.user,
              pages: result.pages,
            },
          }));
          
          setSaveStatus({
            show: true,
            message: `Successfully logged in as ${result.user.name}!`,
            severity: 'success',
          });
        } else {
          throw new Error(result.error || 'OAuth exchange failed');
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        setSaveStatus({
          show: true,
          message: 'OAuth login failed: ' + error.message,
          severity: 'error',
        });
      } finally {
        setMetaAuthLoading(false);
      }
    };

    window.electronAPI.onMetaOAuthCallback(handleOAuthCallback);

    // Cleanup
    return () => {
      window.electronAPI.removeMetaOAuthListener(handleOAuthCallback);
    };
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

  const handleMetaLogin = async () => {
    try {
      setMetaAuthLoading(true);
      
      // Get OAuth URL from Vercel API
      const response = await fetch('/api/meta-oauth-url');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get OAuth URL');
      }

      // Open OAuth URL in external browser
      await window.electronAPI.openExternal(data.oauthUrl);
      
      // Show message to user
      setSaveStatus({
        show: true,
        message: 'OAuth window opened in browser. Please complete authentication and return here.',
        severity: 'info',
      });

    } catch (error) {
      console.error('Error initiating Meta OAuth:', error);
      setSaveStatus({
        show: true,
        message: 'Error initiating OAuth: ' + error.message,
        severity: 'error',
      });
    } finally {
      setMetaAuthLoading(false);
    }
  };

  const handleMetaLogout = async () => {
    try {
      setCredentials(prev => ({
        ...prev,
        facebook: {
          accessToken: '',
          userInfo: null,
          pages: [],
        },
        instagram: {
          accessToken: '',
          userInfo: null,
          pages: [],
        },
      }));
      
      setSaveStatus({
        show: true,
        message: 'Logged out of Meta accounts successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
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

  const isMetaConnected = credentials.facebook.accessToken && credentials.facebook.userInfo;

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
              {isMetaConnected ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={`Connected as ${credentials.facebook.userInfo.name}`}
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                  
                  {credentials.facebook.pages.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Available Pages:
                      </Typography>
                      {credentials.facebook.pages.map((page) => (
                        <Chip 
                          key={page.id}
                          label={page.name}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleMetaLogout}
                    startIcon={<LogoutIcon />}
                    size={isSmallScreen ? "small" : "medium"}
                  >
                    Disconnect Meta Account
                  </Button>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Connect your Meta account to post to Facebook and Instagram. 
                    This will use secure OAuth authentication.
                  </Typography>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleMetaLogin}
                    startIcon={<FacebookIcon />}
                    disabled={metaAuthLoading}
                    size={isSmallScreen ? "small" : "medium"}
                  >
                    {metaAuthLoading ? 'Opening OAuth...' : 'Login with Meta'}
                  </Button>
                </Box>
              )}
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