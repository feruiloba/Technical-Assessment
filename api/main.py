import os
from dotenv import load_dotenv

# Load environment variables BEFORE importing modules that use them
load_dotenv()

import cv2
import uuid
import json
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from api.helpers import face_cascade
from api.models import db, Project, Effect
from api.routes.projects import projects_bp
from api.routes.effects import effects_bp
from api.routes.detection import detection_bp
from api.routes.upload import upload_bp

app = Flask(__name__, static_folder='../app/build', static_url_path='/')

# Vercel/Lambda environment is read-only except for /tmp
# We need to set instance_path to /tmp to avoid OSError when Flask-SQLAlchemy tries to create it
if os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
    app.instance_path = '/tmp'

CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"]}})

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
app.register_blueprint(upload_bp)

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

# Catch-all route to prevent Flask 404s interfering with frontend routing
# This is useful if Vercel routing falls through to Flask for some reason
@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=False)