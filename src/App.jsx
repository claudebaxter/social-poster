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
  Chip,
  Card,
  CardMedia,
  CardActions,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import PostAddIcon from '@mui/icons-material/PostAdd';
import MenuIcon from '@mui/icons-material/Menu';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import PlatformSelector from './components/PlatformSelector';
import ConfigForm from './components/ConfigForm';

const DRAWER_WIDTH = 200;

function App() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const [text, setText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
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

  const handleImageAttach = async () => {
    try {
      const result = await window.electronAPI.selectImage();
      if (result && !result.error) {
        setAttachedImage(result);
      } else if (result?.error) {
        setNotification({
          open: true,
          message: result.error,
          severity: 'error',
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: `Error selecting image: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const handleImageRemove = () => {
    setAttachedImage(null);
  };

  // Helper function to check image size for Bluesky
  const getImageSizeWarning = () => {
    if (!attachedImage) return null;
    
    const blueskySizeLimit = 976 * 1024; // 976KB
    if (platforms.bluesky && attachedImage.size > blueskySizeLimit) {
      const sizeInKB = (attachedImage.size / 1024).toFixed(0);
      return `Image is ${sizeInKB}KB but Bluesky limit is 976KB. Will attempt compression.`;
    }
    return null;
  };

  // Helper function to check if Twitter/X has image with manual note
  const getTwitterImageWarning = () => {
    if (platforms.twitter && attachedImage) {
      return 'Twitter/X requires manual image attachment in browser';
    }
    return null;
  };

  const isPostButtonDisabled = () => {
    // Basic validation
    if (!text.trim() || !Object.values(platforms).some(Boolean)) {
      return true;
    }
    
    // Instagram requires an image
    if (platforms.instagram && !attachedImage) {
      return true;
    }
    
    return false;
  };

  const getValidationMessage = () => {
    if (!text.trim()) return 'Please enter some text to post';
    if (!Object.values(platforms).some(Boolean)) return 'Please select at least one platform';
    if (platforms.instagram && !attachedImage) return 'Instagram requires an image to be attached';
    return '';
  };

  const handlePost = async () => {
    const validationMessage = getValidationMessage();
    if (validationMessage) {
      setNotification({
        open: true,
        message: validationMessage,
        severity: 'warning',
      });
      return;
    }

    try {
      const postData = { 
        text, 
        platforms,
        ...(attachedImage && { image: attachedImage })
      };
      
      const results = await window.electronAPI.postContent(postData);
      
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
        setAttachedImage(null);
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

        {/* Image Attachment Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleImageAttach}
              startIcon={<AttachFileIcon />}
              size={isSmallScreen ? "small" : "medium"}
            >
              Attach Image
            </Button>
            
            {platforms.instagram && !attachedImage && (
              <Chip 
                icon={<ImageIcon />}
                label="Instagram requires an image"
                color="warning"
                size="small"
              />
            )}

            {/* Bluesky image size warning */}
            {getImageSizeWarning() && (
              <Tooltip title={getImageSizeWarning()} arrow>
                <Chip 
                  icon={<WarningIcon />}
                  label="Image size warning"
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            )}

            {/* Twitter image manual attachment warning */}
            {getTwitterImageWarning() && (
              <Tooltip title={getTwitterImageWarning()} arrow>
                <Chip 
                  icon={<InfoIcon />}
                  label="Manual attachment required"
                  color="info"
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>
          
          {attachedImage && (
            <Card sx={{ maxWidth: 400, mb: 2 }}>
              <CardMedia
                component="img"
                height="200"
                image={attachedImage.dataUrl}
                alt="Attached image"
                sx={{ objectFit: 'cover' }}
              />
              <CardActions>
                <Chip 
                  label={attachedImage.name}
                  size="small"
                  sx={{ maxWidth: 250 }}
                />
                <Chip 
                  label={`${(attachedImage.size / 1024).toFixed(0)}KB`}
                  size="small"
                  variant="outlined"
                />
                <Box sx={{ flexGrow: 1 }} />
                <IconButton 
                  onClick={handleImageRemove}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          )}
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
          disabled={isPostButtonDisabled()}
          size={isSmallScreen ? "small" : "medium"}
        >
          Post
        </Button>
        
        {getValidationMessage() && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', mt: 1 }}
          >
            {getValidationMessage()}
          </Typography>
        )}
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