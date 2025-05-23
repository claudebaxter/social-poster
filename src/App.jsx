import { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Snackbar,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PlatformSelector from './components/PlatformSelector';
import ConfigForm from './components/ConfigForm';

const DRAWER_WIDTH = 240;

function App() {
  const [text, setText] = useState('');
  const [platforms, setPlatforms] = useState({
    facebook: false,
    instagram: false,
    bluesky: false,
    twitter: false,
  });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [currentView, setCurrentView] = useState('post'); // 'post' or 'config'

  const handlePost = async () => {
    if (!text.trim()) {
      setNotification({
        open: true,
        message: 'Please enter some text to post',
        severity: 'warning',
      });
      return;
    }

    if (!Object.values(platforms).some(Boolean)) {
      setNotification({
        open: true,
        message: 'Please select at least one platform',
        severity: 'warning',
      });
      return;
    }

    try {
      const results = await window.electronAPI.postContent({ text, platforms });
      
      // Check for any errors in the results
      const errors = Object.entries(results)
        .filter(([_, result]) => result.error)
        .map(([platform, result]) => `${platform}: ${result.error}`);

      if (errors.length > 0) {
        setNotification({
          open: true,
          message: `Errors occurred: ${errors.join(', ')}`,
          severity: 'error',
        });
      } else {
        setNotification({
          open: true,
          message: 'Posted successfully!',
          severity: 'success',
        });
        setText(''); // Clear the text field after successful post
      }
    } catch (error) {
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const renderContent = () => {
    if (currentView === 'config') {
      return <ConfigForm />;
    }

    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Social Poster
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your post..."
            variant="outlined"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Platforms
          </Typography>
          <PlatformSelector platforms={platforms} onChange={setPlatforms} />
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handlePost}
          endIcon={<SendIcon />}
          disabled={!text.trim() || !Object.values(platforms).some(Boolean)}
        >
          Post
        </Button>
      </Paper>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ overflow: 'auto', mt: 8 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton
                selected={currentView === 'post'}
                onClick={() => setCurrentView('post')}
              >
                <ListItemIcon>
                  <PostAddIcon />
                </ListItemIcon>
                <ListItemText primary="Post" />
              </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton
                selected={currentView === 'config'}
                onClick={() => setCurrentView('config')}
              >
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Config" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Container maxWidth="md" sx={{ py: 4, pr: `${DRAWER_WIDTH + 24}px` }}>
        {renderContent()}
      </Container>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App; 