# Overview
This project envisions to translate your physical gaame of chess into a digital game to play on the computer or make analysis.

It also provides stats such as the position evaluation and the best move

<img width="1481" alt="Screenshot 2024-12-05 at 07 55 07" src="https://github.com/user-attachments/assets/8cabf291-19d8-4798-b35d-18cd05086abd">


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
