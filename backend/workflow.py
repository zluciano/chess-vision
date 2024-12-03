from inference import InferencePipeline

pipeline = None
fen_move_map = {}

def init_pipeline(on_prediction, orientation, color):
    global pipeline
    global fen_move_map
    if pipeline is not None:
        pipeline.terminate()
    print(fen_move_map)
    pipeline = InferencePipeline.init_with_workflow(
        video_reference="./samples/staticvideo.mov",
        workspace_name="luciano-tg54j",
        workflow_id="chess-game-evaluator",
        on_prediction=on_prediction,
        workflows_parameters={
            "orientation": orientation if orientation is not None else 1,
            "color": color if color is not None else "w",
            "fen_move_map": fen_move_map
        },
        max_fps=60
    )

    pipeline.start()
    pipeline.join()

def stop_pipeline():
    if pipeline is not None:
        pipeline.terminate()

def update_map(fen, move):
    fen_move_map[fen] = move
