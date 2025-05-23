import React from 'react';
import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import CloudIcon from '@mui/icons-material/Cloud'; // For Bluesky

const PlatformSelector = ({ platforms, onChange }) => {
  const handleChange = (platform) => {
    onChange({ ...platforms, [platform]: !platforms[platform] });
  };

  return (
    <FormGroup row>
      <FormControlLabel
        control={
          <Checkbox
            checked={platforms.facebook}
            onChange={() => handleChange('facebook')}
            icon={<FacebookIcon />}
            checkedIcon={<FacebookIcon color="primary" />}
          />
        }
        label="Facebook"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={platforms.instagram}
            onChange={() => handleChange('instagram')}
            icon={<InstagramIcon />}
            checkedIcon={<InstagramIcon color="secondary" />}
          />
        }
        label="Instagram"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={platforms.bluesky}
            onChange={() => handleChange('bluesky')}
            icon={<CloudIcon />}
            checkedIcon={<CloudIcon color="info" />}
          />
        }
        label="Bluesky"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={platforms.twitter}
            onChange={() => handleChange('twitter')}
            icon={<TwitterIcon />}
            checkedIcon={<TwitterIcon color="primary" />}
          />
        }
        label="X (Twitter)"
      />
    </FormGroup>
  );
};

export default PlatformSelector; 