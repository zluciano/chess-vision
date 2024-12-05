import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material';

const PieceEditor = ({ showPieceEditPopup, setShowPieceEditPopup, handleSubstitute, removePiece, substitutePiece, setSubstitutePiece }) => {
  
  return (
    <Dialog open={showPieceEditPopup} onClose={() => setShowPieceEditPopup(false)} fullWidth maxWidth="xs">
      <DialogTitle>Substitute Piece</DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button variant="outlined" onClick={() => handleSubstitute('k')}>King</Button>
          <Button variant="outlined" onClick={() => handleSubstitute('q')}>Queen</Button>
          <Button variant="outlined" onClick={() => handleSubstitute('r')}>Rook</Button>
          <Button variant="outlined" onClick={() => handleSubstitute('b')}>Bishop</Button>
          <Button variant="outlined" onClick={() => handleSubstitute('n')}>Knight</Button>
          <Button variant="outlined" onClick={() => handleSubstitute('p')}>Pawn</Button>
          <Button variant="outlined" onClick={() => removePiece()}>Remove</Button>
        </div>

        <FormControl component="fieldset" style={{ marginTop: '16px' }}>
          <RadioGroup
            value={substitutePiece?.color}
            onChange={(e) => setSubstitutePiece({ square: substitutePiece?.square, color: e.target.value })}
            row
          >
            <FormControlLabel value="w" control={<Radio />} label="White" />
            <FormControlLabel value="b" control={<Radio />} label="Black" />
          </RadioGroup>
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setShowPieceEditPopup(false)} color="secondary">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PieceEditor;
