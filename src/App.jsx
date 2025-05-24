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
  IconButton,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import PostAddIcon from '@mui/icons-material/PostAdd';
import MenuIcon from '@mui/icons-material/Menu';
import PlatformSelector from './components/PlatformSelector';
import ConfigForm from './components/ConfigForm';

const DRAWER_WIDTH = 200;

function App() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const [text, setText] = useState('');
  const [platforms, setPlatforms] = useState({
    facebook: false,
    instagram: false,
    bluesky: false,
    twitter: false,
  });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [currentView, setCurrentView] = useState('post');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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
      
      const errors = Object.entries(results)
        .filter(([_, result]) => result.error)
        .map(([platform, result]) => `${platform}: ${result.error}`);

      const successes = Object.entries(results)
        .filter(([_, result]) => result.success)
        .map(([platform, result]) => {
          if (result.debug) {
            return `${platform}: ${result.debug}`;
          }
          return `${platform}: Success`;
        });

      if (errors.length > 0) {
        setNotification({
          open: true,
          message: `Errors occurred: ${errors.join(', ')}`,
          severity: 'error',
        });
      } else {
        const successMessage = successes.length > 0 ? successes.join(', ') : 'Posted successfully!';
        setNotification({
          open: true,
          message: successMessage,
          severity: 'success',
        });
        setText('');
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
        <Typography 
          variant={isSmallScreen ? "h5" : "h4"} 
          component="h1" 
          gutterBottom
          sx={{ mb: 3 }}
        >
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
            size={isSmallScreen ? "small" : "medium"}
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
          size={isSmallScreen ? "small" : "medium"}
        >
          Post
        </Button>
      </Paper>
    );
  };

  const drawer = (
    <Box>
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={currentView === 'post'}
            onClick={() => {
              setCurrentView('post');
              if (isSmallScreen) setMobileOpen(false);
            }}
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
            onClick={() => {
              setCurrentView('config');
              if (isSmallScreen) setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Config" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: isSmallScreen ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)`,
          ml: isSmallScreen ? 0 : `${DRAWER_WIDTH}px`,
          bgcolor: 'background.paper',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              color: 'text.primary',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {currentView === 'post' ? 'Create Post' : 'Settings'}
          </Typography>
          {isSmallScreen && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isSmallScreen ? "temporary" : "permanent"}
        anchor={isSmallScreen ? "right" : "left"}
        open={isSmallScreen ? mobileOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: isSmallScreen ? 'none' : '1px solid',
            borderColor: 'divider',
          },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 3,
          width: '100%',
          mt: '64px', // Height of AppBar
          boxSizing: 'border-box',
          overflow: 'auto',
        }}
      >
        {renderContent()}
      </Box>

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