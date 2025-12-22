from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
import base64
import numpy as np
import cv2
import uuid
from helpers import face_cascade

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"]}})

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route("/hello-world", methods=["GET"])
def hello_world():
    try:
        return jsonify({"Hello": "World"}), 200
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/detect-faces", methods=["POST"])
def detect_faces():
    try:
        data = request.get_json()
        image_data = data.get("image")

        if not image_data:
            return jsonify({"error": "No image provided"}), 400

        # Remove data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Decode base64 to image
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Invalid image"}), 400

        # Convert to grayscale for detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detect faces using Haar Cascade
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )

        # Format results
        detections = []
        for (x, y, w, h) in faces:
            detections.append({
                "id": str(uuid.uuid4())[:8],
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "confidence": 0.9,  # Haar Cascade doesn't provide confidence
                "label": "Face"
            })

        return jsonify({"detections": detections}), 200

    except Exception as e:
        logger.error(f"Error in face detection: {e}")
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=False)
