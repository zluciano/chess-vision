from inference import InferencePipeline

pipeline = None
inputs = {}
fen_move_map = {}

def init_pipeline(on_prediction):
    global pipeline
    global inputs
    global fen_move_map
    if pipeline is not None:
        pipeline.terminate()
    print(inputs)
    pipeline = InferencePipeline.init_with_workflow(
        video_reference="./samples/sample.mov",
        workspace_name="luciano-tg54j",
        workflow_id="chess-game-evaluator",
        on_prediction=on_prediction,
        workflows_parameters={
            "orientation": inputs["orientation"] if "orientation" in inputs else 1,
            "color": inputs["color"] if "color" in inputs else "w",
            "fen_move_map": fen_move_map
        },
        max_fps=30
    )

    pipeline.start()
    pipeline.join()

def stop_pipeline():
    if pipeline is not None:
        pipeline.terminate()

def update_map(fen, move):
    fen_move_map[fen] = move

def update_inputs(key, value):
    inputs[key] = value
