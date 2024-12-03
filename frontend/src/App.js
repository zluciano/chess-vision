import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import io from 'socket.io-client';
import { Chess } from 'chess.js';
import './App.css';
const START_BOARD = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1'
const USE_SOCKET = false
let socket
if (USE_SOCKET) {
  socket = io('http://localhost:5002');
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

const App = () => {
  const [fen, setFen] = useState(START_BOARD);
  const [videoFrame, setVideoFrame] = useState('');
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
  const track = useRef(null)
  const isPredictionInProgress = useRef(false);
  const bestMovesCache = useRef(new Map([["", {}], [undefined, {}]]));

  const calculatePositionEvaluation = useCallback((fen) => {
    return bestMovesCache.current.get(fen)?.eval;
  }, [bestMovesCache]);

  const updateStats = useCallback((fen) => {
    const game = new Chess();
    game.load(fen, {skipValidation: true})
    setPositionEvaluation(calculatePositionEvaluation(game.fen()));
  }, [calculatePositionEvaluation]);

  async function requestPrediction(frame) {
    const response = await fetch("http://localhost:9001/infer/workflows/luciano-tg54j/chess-game-evaluator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.REACT_APP_API_KEY,
        inputs: {
          image: { type: "url", value: frame },
          orientation: 2,
          color: "w",
          fen_move_map: bestMovesCache.current
        }
      })
    })
    const jresponse = await response.json()
    bestMovesCache.current.set(jresponse.outputs[0].output.stats.fen, jresponse.outputs[0].output.stats);
    setVideoFrame(jresponse.outputs[0].output2.value);
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
        if (isValidFen(data.fen)) {
          updateStats(newFen);
          const bestMoveData = data.best_move;
          bestMovesCache.current.set(newFen, bestMoveData);
        } else {
          updateStats(START_BOARD);
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
  }, [bestMovesCache, playerTurn, tracking, updateStats]);

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
    updateStats(newFen);
    setShowPieceEditPopup(false);
  };

  const removePiece = () => {
    const game = new Chess();
    game.load(fen, {skipValidation: true})
    game.remove(substitutePiece.square)
    const newFen = game.fen();
    setFen(newFen);
    updateStats(newFen);
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
    updateStats(newFen);
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

  const trackWebcam = useCallback(async () => {
    if (isPredictionInProgress.current) return;
    isPredictionInProgress.current = true;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const tracks = stream.getVideoTracks()[0];
    track.current = tracks;
  
    const imageCapture = new ImageCapture(tracks);
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
    if (USE_SOCKET) {
      if (tracking) {
        socket.emit('start_pipeline', { orientation: 3, color: "w", fen_move_map: bestMovesCache.current });
      } else {
        socket.emit('stop_pipeline');
      }
    } else {
      if (tracking) {
        trackWebcam();
      } else {
        try {
          track.current?.stop();
        } catch {}
      }
    }
  }, [tracking, trackWebcam, bestMovesCache, track]);
  
  const toggleTracking = () => {
    setTracking(prevTracking => !prevTracking);
  };
  

  const game = new Chess()
  game.load(fen, {skipValidation: true})
  const best = bestMove()

  const webcamScreen = useCallback( () => (
    <img
      src={`data:image/png;base64, ${videoFrame}`}
      alt="Video Frame"
      width={fullScreen ? "100%" : "400"}
      style={{ marginRight: '10px' }}
    />
  ))

  return (
    <div className="App">
      {fullScreen && webcamScreen()}
      {!fullScreen && (<><h1>Digital Board</h1><div style={{ display: 'flex', gap: '10px' }}>
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <button onClick={toggleTracking} style={{ padding: '10px', marginBottom: '10px', marginRight: '10px' }}>
              {tracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
            <button onClick={toggleEditBoard} style={{ padding: '10px', marginBottom: '10px', marginRight: '10px' }}>
              {editBoard ? 'Disable Edit Mode' : 'Enable Edit Mode'}
            </button>
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <button onClick={toggleShowBestMove} style={{ padding: '10px', marginBottom: '10px', marginRight: '10px' }}>
              {showBestMove ? 'Disable Best Move' : 'Enable Best Move'}
            </button>
            <button onClick={toggleFullScreen} style={{ padding: '10px', marginBottom: '10px', marginRight: '10px' }}>
              {showBestMove ? 'Disable FullScreen' : 'Enable FullScreen'}
            </button>
          </div>
        </div>
        <div>
          <label>
            <input
              type="radio"
              value="w"
              checked={playerTurn === 'w'}
              onChange={() => {
                setPlayerTurn('w');
                setFen(prevFen => prevFen.replace(" b ", " w "));
              } } />
            White
          </label>
          <label>
            <input
              type="radio"
              value="b"
              checked={playerTurn === 'b'}
              onChange={() => {
                setPlayerTurn('b');
                setFen(prevFen => prevFen.replace(" w ", " b "));
              } } />
            Black
          </label>
        </div>
      </div><div style={{ display: 'flex', alignItems: 'center' }}>
          {videoFrame && webcamScreen()}
          <Chessboard
            customArrows={showBestMove ? [[best.from, best.to]] : []}
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={400}
            onSquareClick={handleSquareClick}
            onSquareRightClick={handleSquareRightClick}
            customSquareStyles={{
              ...(selectedSquare && {
                [selectedSquare]: { backgroundColor: 'lightblue' },
              }),
              ...Object.fromEntries(validMoves.map((move) => [move.to, { backgroundColor: "lightgray" }]))
            }} />
          <div style={{
            height: '400px',
            width: '20px',
            backgroundColor: 'lightgray',
            borderRadius: '5px',
            marginLeft: '10px',
          }}>
            <div
              style={{
                height: `${sigmoid(positionEvaluation) * 100}%`,
                backgroundColor: positionEvaluation > 0 ? 'white' : 'black',
                borderRadius: '5px',
              }} />
          </div>
        </div><div className="stats">
          <p>Position Evaluation: {positionEvaluation ? positionEvaluation : 0}</p>
          <p>Current Turn: {playerTurn === 'w' ? 'White' : 'Black'}</p>
        </div></>)}
      {showPieceEditPopup && !fullScreen && editBoard && (
        <div className="popup" style={{display: "flex", flexDirection: "column"}}>
          <button onClick={() => handleSubstitute('k')}>King</button>
          <button onClick={() => handleSubstitute('q')}>Queen</button>
          <button onClick={() => handleSubstitute('r')}>Rook</button>
          <button onClick={() => handleSubstitute('b')}>Bishop</button>
          <button onClick={() => handleSubstitute('n')}>Knight</button>
          <button onClick={() => handleSubstitute('p')}>Pawn</button>
          <button onClick={() => removePiece()}>Remove</button>
          <button onClick={() => setShowPieceEditPopup(false)}>Cancel</button>
          <div>
            <label>
              <input 
                type="radio"
                value="w"
                checked={substitutePiece.color === 'w'} 
                onChange={() => setSubstitutePiece({ square: substitutePiece.square, color: 'w' })} 
              />
              White
            </label>
            <label>
              <input 
                type="radio"
                value="b"
                checked={substitutePiece.color === 'b'} 
                onChange={() => setSubstitutePiece({ square: substitutePiece.square, color: 'b' })} 
              />
              Black
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;