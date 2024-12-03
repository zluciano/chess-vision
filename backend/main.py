import io
from flask import Flask
from flask_socketio import SocketIO
from inference.core.interfaces.camera.entities import VideoFrame
from flask_cors import CORS
from PIL import Image

from workflow import init_pipeline, stop_pipeline, update_map

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app, resources={r"/*": {"origins": "http://localhost:3001"}})

def workflows_sink(
    predictions: dict,
    video_frame: VideoFrame,
) -> None:
    fen = ""
    stats = {}
    image_vector = video_frame.image
    if predictions is not None:
        if "output" in predictions and predictions["output"] is not None:
            if "original_fen" in predictions["output"] and predictions["output"]["original_fen"] is not None:
                fen = predictions["output"]["original_fen"]
            if "stats" in predictions["output"] and predictions["output"]["stats"] is not None:
                stats = {
                    "from": predictions["output"]["stats"]["from"],
                    "to": predictions["output"]["stats"]["to"],
                    "eval": predictions["output"]["stats"]["eval"],
                }
        if "output2" in predictions and predictions["output2"] is not None:
            image_vector = predictions["output2"].numpy_image
    
    pil_image = Image.fromarray(image_vector.astype('uint8'))
    buffer = io.BytesIO()
    pil_image.save(buffer, format='JPEG', quality=85)
    image_data = buffer.getvalue()
    update_map(fen, stats)
            
    socketio.emit('fen_update', {
        'fen': fen,
        'best_move': stats,
        'image': image_data
    })

@socketio.on('start_pipeline')
def handle_start_pipeline(data):
    print("starting pipeline")
    socketio.start_background_task(init_pipeline, workflows_sink, data.get("orientation"), data.get("color"))

@socketio.on('stop_pipeline')
def handle_stop_pipeline():
    stop_pipeline()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5002, allow_unsafe_werkzeug=True)