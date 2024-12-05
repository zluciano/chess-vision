import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import "@mui/icons-material"
import io from 'socket.io-client';
import { Chess } from 'chess.js';
import './App.css';
import { ArrowBack, ArrowDownward, ArrowForward, ArrowUpward } from '@mui/icons-material';
import { Box, Radio, RadioGroup, FormControlLabel, FormControl, Typography } from '@mui/material';
import PieceEditor from './components/PieceEditor';
import FullScreenHeaders from './components/FullScreenHeaders';
import HeaderButtons from './components/HeaderButtons';
const START_BOARD = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1'
const USE_SOCKET = true
let socket
if (USE_SOCKET) {
  socket = io('http://localhost:5002');
}

const App = () => {
  const [fen, setFen] = useState(START_BOARD);
  const [videoFrame, setVideoFrame] = useState('');
  const [rawVideoFrame, setRawVideoFrame] = useState('');
  const [positionEvaluation, setPositionEvaluation] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [playerTurn, setPlayerTurn] = useState('w');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [editBoard, setEditBoard] = useState(false);
  const [showPieceEditPopup, setShowPieceEditPopup] = useState(false);
  const [substitutePiece, setSubstitutePiece] = useState(null);
  const [showBestMove, setShowBestMove] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [boardOrientation, setBoardOrientation] = useState(1)
  const track = useRef(null)
  const isPredictionInProgress = useRef(false);
  const bestMovesCache = useRef(new Map([["", {}], [undefined, {}]]));

  async function requestPrediction(frame) {
    const response = await fetch("https://included-top-midge.ngrok-free.app/infer/workflows/luciano-tg54j/chess-game-evaluator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.REACT_APP_API_KEY,
        inputs: {
          image: { type: "url", value: frame },
          orientation: boardOrientation,
          color: playerTurn,
          fen_move_map: bestMovesCache.current
        }
      })
    })
    const jresponse = await response.json()
    bestMovesCache.current.set(jresponse.outputs[0].output.stats.fen, jresponse.outputs[0].output.stats);
    setVideoFrame(jresponse.outputs[0].output2.value);
    if (jresponse.outputs[0].output.stats?.eval) {
      setPositionEvaluation(jresponse.outputs[0].output.stats?.eval)
    }
    if (jresponse.outputs[0].output?.original_fen !== undefined && jresponse.outputs[0].output.original_fen !== "") {
      const receivedFen = jresponse.outputs[0].output.original_fen
      const additionalFields = `${playerTurn} - - 0 1`;
      const isFenComplete = receivedFen.split(' ').length === 6;
      const newFen = isFenComplete ? receivedFen : `${receivedFen} ${additionalFields}`;
      setFen(newFen)
    }
  }

  const isValidFen = (fen) => {
    try {
      new Chess(fen);
      return true
    }
    catch {
      return false
    }
  };

  const bestMove = () => {
    return bestMovesCache.current.get(fen);
  };

  useEffect(() => {
    const handleFenUpdate = (data) => {
      if (tracking) {
        const additionalFields = `${playerTurn} - - 0 1`;
        const isFenComplete = data.fen.split(' ').length === 6;
        const newFen = isFenComplete ? data.fen : `${data.fen} ${additionalFields}`;
        setFen(newFen);
        setVideoFrame(data.image);
        setPositionEvaluation(data.best_move?.eval)
        if (isValidFen(data.fen)) {
          const bestMoveData = data.best_move;
          bestMovesCache.current.set(newFen, bestMoveData);
        }
      }
    };

    if (USE_SOCKET) {
      socket.on('fen_update', handleFenUpdate);
      socket.on('image_ready', (data) => setVideoFrame(data.outputs[0].label_visualization_1.value));
    }

    return () => {
      if (USE_SOCKET) {
        socket.off('fen_update', handleFenUpdate);
      }
    };
  }, [bestMovesCache, playerTurn, tracking]);

  const handleSquareClick = (square) => {
    const game = new Chess();
    game.load(fen, {skipValidation: true})
    if (validMoves.map((move) => move.to).includes(square)){
      game.move(validMoves.find((move) => move.to === square)?.san)
    }
    if (game.get(square) && game.turn() === game.get(square).color) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const handleSquareRightClick = (square) => {
    const game = new Chess()
    game.load(fen, {skipValidation: true})
    const color = game.get(square)?.color
    setSubstitutePiece({square, color});
    setShowPieceEditPopup(true);
  }

  const handleSubstitute = (newPieceType) => {
    const game = new Chess();
    game.load(fen, {skipValidation: true})
    game.put({type: newPieceType, color: substitutePiece.color}, substitutePiece.square);
    const newFen = game.fen();
    setFen(newFen);
    setShowPieceEditPopup(false);
  };

  const removePiece = () => {
    const game = new Chess();
    game.load(fen, {skipValidation: true})
    game.remove(substitutePiece.square)
    const newFen = game.fen();
    setFen(newFen);
    setShowPieceEditPopup(false);
  }

  const toggleEditBoard = async () => {
    setEditBoard(prevEditBoard => !prevEditBoard);
  };

  const toggleShowBestMove = () => {
    setShowBestMove(prevShowBestMove => !prevShowBestMove);
  };

  const toggleFullScreen = () => {
    setFullScreen(prevFullScreen => !prevFullScreen);
  }

  const onDrop = (sourceSquare, targetSquare) => {
    const game = new Chess();
    game.load(fen, {skipValidation: true})
    if (editBoard) {
      const piece = game.get(sourceSquare)
      game.remove(sourceSquare)
      game.put(piece, targetSquare)
    } else {
      game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });
      setPlayerTurn(prevTurn => (prevTurn === 'w' ? 'b' : 'w'));
    }

    const newFen = game.fen();
    setFen(newFen);
    setSelectedSquare(null);

    console.log(`Piece dropped from ${sourceSquare} to ${targetSquare}`);
  };

  useEffect(() => {
    const updateValidMoves = () => {
      const game = new Chess();
      game.load(fen, {skipValidation: true})
      const moves = game.moves({ square: selectedSquare, verbose: true });
      setValidMoves(moves);
    };

    if (selectedSquare) {
      updateValidMoves();
    } else {
      setValidMoves([]);
    }
  }, [selectedSquare, fen]);

  const trackResponse = useCallback(async () => {
    if (isPredictionInProgress.current) return;
    isPredictionInProgress.current = true;
  
    const imageCapture = new ImageCapture(track.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    while (tracking) {
      const frame = await imageCapture.grabFrame();
      canvas.width = frame.width;
      canvas.height = frame.height;
  
      ctx.drawImage(frame, 0, 0);
      const base64Image = canvas.toDataURL('image/png', 0.3);
      await requestPrediction(base64Image)
    }
    isPredictionInProgress.current = false;
  }, [tracking]);

  useEffect(() => {
    const trackWebcam = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: 'environment'} });
      const tracks = stream.getVideoTracks()[0];
      track.current = tracks;
    
      const imageCapture = new ImageCapture(tracks);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
    
      while (true) {
        const frame = await imageCapture.grabFrame();
        canvas.width = frame.width;
        canvas.height = frame.height;
    
        ctx.drawImage(frame, 0, 0);
        const base64Image = canvas.toDataURL('image/png', 0.8);
        setRawVideoFrame(base64Image)
      }
    };
    trackWebcam()
  }, []);
    
  
  useEffect(() => {
    if (USE_SOCKET) {
      if (tracking) {
        socket.emit('start_pipeline');
      } else {
        socket.emit('stop_pipeline');
      }
    } else {
      if (tracking) {
        trackResponse();
      }
    }
  }, [tracking, trackResponse, bestMovesCache, track]);

  useEffect(() => {
    if (USE_SOCKET) {
      socket.emit('update_inputs', {key: "orientation", value: boardOrientation})
    }
  }, [boardOrientation])

  useEffect(() => {
    if (USE_SOCKET) {
      socket.emit('update_inputs', {key: "color", value: playerTurn})
    }
  }, [playerTurn])
  
  const toggleTracking = () => {
    setTracking(prevTracking => !prevTracking);
  };
  

  const game = new Chess()
  game.load(fen, {skipValidation: true})
  const best = bestMove()

  const webcamScreen = (
    <img
      src={tracking && videoFrame ? `data:image/png;base64, ${videoFrame}` : rawVideoFrame}
      alt="Video Frame"
      width={fullScreen ? "70%" : "40%"}
      style={{ marginRight: '10px', marginLeft: '30px' }}
    />
  )

  const turnSelector = (
    <FormControl component="fieldset"
      sx={{
        borderWidth: 1,
        borderColor: '#000000',
        borderStyle: 'solid',
        borderRadius: 1,
        padding: 1,
        marginBottom: 2,
      }}>
      Player Turn
      <RadioGroup row defaultChecked defaultValue={"w"} onChange={(e) => {
      const selectedValue = e.target.value;
      if (selectedValue === 'w') {
        setPlayerTurn('w');
        setFen((prevFen) => prevFen.replace(' b ', ' w '));
      } else if (selectedValue === 'b') {
        setPlayerTurn('b');
        setFen((prevFen) => prevFen.replace(' w ', ' b '));
      }
    }}>
        {[
          { value: "w", label: "White" },
          { value: "b", label: "Black"  },
        ].map((item) => (
          <FormControlLabel
            key={item.value}
            value={item.value}
            control={<Radio />}
            label={item.label}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        ))}
      </RadioGroup>
    </FormControl>
  )

  const orientationSelector = (
    <FormControl component="fieldset"
      sx={{
        borderWidth: 1,
        borderColor: '#000000',
        borderStyle: 'solid',
        borderRadius: 1,
        padding: 1,
        marginBottom: 2,
      }}>
      Which direction is black?
      <RadioGroup row defaultChecked defaultValue={1} onChange={(e) => {
        setBoardOrientation(parseInt(e.target.value))
      }}>
        {[
          { value: 1, icon: <ArrowUpward /> },
          { value: 2, icon: <ArrowForward /> },
          { value: 3, icon: <ArrowDownward /> },
          { value: 4, icon: <ArrowBack /> },
        ].map((item) => (
          <FormControlLabel
            key={item.value}
            value={item.value}
            control={<Radio />}
            label={item.icon}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        ))}
      </RadioGroup>
    </FormControl>
  )

  return (
    <Box alignItems={'center'} display={'flex'} justifyItems={'center'} justifyContent={'center'}>
      {fullScreen && (
        <Box alignItems={'center'} display={'flex'} justifyItems={'center'} justifyContent={'center'}>
          <FullScreenHeaders
            tracking={tracking}
            toggleTracking={toggleTracking}
            fullScreen={fullScreen}
            toggleFullScreen={toggleFullScreen}
          />
          {webcamScreen}
        </Box>
      )}
      {!fullScreen && (
        <Box alignItems={'center'}>
          <Typography variant="h4" gutterBottom>
            Digital Board
          </Typography>
          <Box display={'flex'} gap={'10px'} >
            <HeaderButtons
              tracking={tracking}
              toggleTracking={toggleTracking}
              editBoard={editBoard}
              toggleEditBoard={toggleEditBoard}
              showBestMove={showBestMove}
              toggleShowBestMove={toggleShowBestMove}
              fullScreen={fullScreen}
              toggleFullScreen={toggleFullScreen}
            />
            {turnSelector}
            {orientationSelector}
          </Box>
          <Box display={'flex'} alignItems={'center'} justifyContent={'center'} >
            {(videoFrame || rawVideoFrame) && webcamScreen}
            <Chessboard
              customArrows={showBestMove ? [[best.from, best.to]] : []}
              position={fen}
              onPieceDrop={onDrop}
              boardWidth={window.innerWidth/3}
              onSquareClick={handleSquareClick}
              onSquareRightClick={handleSquareRightClick}
              customSquareStyles={{
                ...(selectedSquare && {
                  [selectedSquare]: { backgroundColor: 'lightblue' },
                }),
                ...Object.fromEntries(validMoves.map((move) => [move.to, { backgroundColor: "lightgray" }]))
              }} />
          </Box>
          <Box padding={2} backgroundColor={'#f5f5f5'} borderRadius={1} boxShadow={1} width={250} marginLeft={90} marginTop={2}>
            <Typography variant="h6" gutterBottom>
              Position Evaluation: {positionEvaluation}
            </Typography>
            <Typography variant="body1">
              Current Turn: {playerTurn === 'w' ? 'White' : 'Black'}
            </Typography>
          </Box>
        </Box>
      )}
      <PieceEditor
        showPieceEditPopup={showPieceEditPopup && !fullScreen && editBoard}
        setShowPieceEditPopup={setShowPieceEditPopup}
        handleSubstitute={handleSubstitute}
        removePiece={removePiece}
        substitutePiece={substitutePiece}
        setSubstitutePiece={setSubstitutePiece}
      />
    </Box>
  );
};

export default App;