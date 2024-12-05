import React from 'react';
import { Button, Box } from '@mui/material';

const FullScreenHeaders = ({ tracking, fullScreen, toggleTracking, toggleFullScreen }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1,
        gap: 2,
      }}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={toggleTracking}
        sx={{ padding: '10px 16px' }}
      >
        {tracking ? 'Stop Tracking' : 'Start Tracking'}
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={toggleFullScreen}
        sx={{ padding: '10px 16px' }}
      >
        {fullScreen ? 'Disable FullScreen' : 'Enable FullScreen'}
      </Button>
    </Box>
  );
};

export default FullScreenHeaders;
