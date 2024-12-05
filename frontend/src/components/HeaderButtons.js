import React from 'react';
import { Button, Box, Grid2 } from '@mui/material';

const HeaderButtons = ({ tracking, editBoard, showBestMove, fullScreen, toggleTracking, toggleEditBoard, toggleShowBestMove, toggleFullScreen }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, padding: 2 }}>
      <Grid2 container direction="column" spacing={2}>
        <Grid2 item>
          <Button
            variant="contained"
            color="primary"
            onClick={toggleTracking}
            sx={{ width: '200px' }}
          >
            {tracking ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
        </Grid2>
        <Grid2 item>
          <Button
            variant="contained"
            color="primary"
            onClick={toggleEditBoard}
            sx={{ width: '200px' }}
          >
            {editBoard ? 'Disable Edit Mode' : 'Enable Edit Mode'}
          </Button>
        </Grid2>
      </Grid2>

      <Grid2 container direction="column" spacing={2}>
        <Grid2 item>
          <Button
            variant="contained"
            color="primary"
            onClick={toggleShowBestMove}
            sx={{ width: '200px' }}
          >
            {showBestMove ? 'Disable Best Move' : 'Enable Best Move'}
          </Button>
        </Grid2>
        <Grid2 item>
          <Button
            variant="contained"
            color="primary"
            onClick={toggleFullScreen}
            sx={{ width: '200px' }}
          >
            {fullScreen ? 'Disable FullScreen' : 'Enable FullScreen'}
          </Button>
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default HeaderButtons;
