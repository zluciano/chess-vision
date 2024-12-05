# Overview
This project envisions to translate your physical gaame of chess into a digital game to play on the computer or make analysis.

It also provides stats such as the position evaluation and the best move

<img width="1481" alt="sample_image" src="https://github.com/user-attachments/assets/cc5e811a-65bb-420c-ad1b-13d323cd54cd">


# Run the project

## Set up inference pipeline

`pip install inference && inference server start`

## Backend

`pip install -r requirements.txt`

`python main.py`


## Frontend

`npm install`

`npm start`

# Modify the inputs

The project is set to run against a sample video provided, you can change it to another video of your choice by updating the `video_reference` on `backend/workflow.py`

You can also set the value to `0` to run it against your webcam!
