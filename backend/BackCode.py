from flask import Flask, request, jsonify
import pandas as pd
import pickle
import traceback
from flask_cors import CORS
import datetime

# Create a debug log file
debug_log_path = "api_debug.log"
def log_debug(message):
    """Write debug message to file with timestamp"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    with open(debug_log_path, "a") as f:
        f.write(f"{timestamp} - {message}\n")

# Create Flask app
app = Flask(__name__)
CORS(app)

# Log startup
log_debug("Starting application")

# Load saved pipeline
try:
    with open("pipeline.pkl", "rb") as f:
        model = pickle.load(f)
    log_debug("Model loaded successfully")
except Exception as e:
    log_debug(f"Failed to load model: {str(e)}")
    model = None

@app.route("/", methods=["GET"])
def root():
    log_debug("Root endpoint accessed")
    return jsonify({"message": "API is running."})

@app.route("/predict", methods=["POST"])
def predict():
    log_debug("Predict endpoint called")
    
    if model is None:
        log_debug("Model not loaded, cannot make prediction")
        return jsonify({"error": "Model not available"}), 500
        
    try:
        log_debug(f"Raw request data: {request.data}")
        
        data = request.get_json()
        if data is None:
            log_debug("No JSON data in request")
            return jsonify({"error": "No data provided or invalid JSON"}), 400
            
        log_debug(f"Parsed request data: {data}")

        required_keys = [ "Start_Lat", "Start_Lng", "Distance(mi)", "Temperature(F)", "Humidity(%)",
            "Pressure(in)", "Visibility(mi)", "Wind_Direction", "Wind_Speed(mph)",
            "Weather_Condition", "Amenity", "Bump", "Crossing", "Give_Way", "Junction",
            "No_Exit", "Railway", "Roundabout", "Station", "Stop", "Traffic_Calming",
            "Traffic_Signal", "Turning_Loop", "Sunrise_Sunset", "Civil_Twilight",
            "Nautical_Twilight", "Astronomical_Twilight"
            
        ]

        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            log_debug(f"Missing required keys: {missing_keys}")
            return jsonify({"error": f"Missing input fields: {missing_keys}"}), 400

        input_df = pd.DataFrame([data])
        log_debug("Created DataFrame for prediction")
        
        prediction = model.predict(input_df)
        predicted_fare = round(float(prediction[0]), 2)

        log_debug(f"Prediction made: {predicted_fare}")
        
        response = {"Prediction": predicted_fare}
        log_debug(f"Returning response: {response}")
        
        return jsonify(response), 200

    except Exception as e:
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        log_debug(f"Error during prediction: {error_msg}\n{stack_trace}")
        return jsonify({"error": error_msg}), 500

if __name__ == "__main__":
    log_debug("Flask application starting")
    app.run(host='0.0.0.0', port=5000, debug=True)
