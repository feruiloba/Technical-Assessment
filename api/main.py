import cv2
import uuid
import os
import json
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from api.helpers import face_cascade
from api.models import db, Project, Effect
from api.routes.projects import projects_bp
from api.routes.effects import effects_bp
from api.routes.detection import detection_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"]}})

load_dotenv()

# Database Configuration
# Use SQLite for local development, but allow override for Postgres
db_url = os.getenv('DATABASE_URL', 'sqlite:///video_editor.db')
# Fix for Heroku/Vercel postgres URLs starting with postgres:// instead of postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Register Blueprints
app.register_blueprint(projects_bp, url_prefix='/projects')
app.register_blueprint(effects_bp, url_prefix='/projects')
app.register_blueprint(detection_bp)

# Create tables on startup
with app.app_context():
    db.create_all()

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

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=False)