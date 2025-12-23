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
from api.routes.chat import chat_bp

app = Flask(__name__)

# Vercel/Lambda environment is read-only except for /tmp
# We need to set instance_path to /tmp to avoid OSError when Flask-SQLAlchemy tries to create it
if os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
    app.instance_path = '/tmp'

CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"]}})

# Database Configuration
# Use PRISMA_DATABASE_URL if available, otherwise DATABASE_URL, fallback to SQLite
db_url = os.getenv('PRISMA_DATABASE_URL') or os.getenv('DATABASE_URL', 'sqlite:///video_editor.db')

# Convert Prisma-style URLs to standard PostgreSQL format for SQLAlchemy
# Prisma URLs may use formats like: prisma+postgres://, prisma://accelerate.prisma-data.net/?api_key=...
if 'prisma' in db_url.lower():
    # If it's a Prisma Accelerate URL, we need a direct database URL instead
    # Check for a direct postgres URL in DIRECT_URL or DATABASE_URL_UNPOOLED
    direct_url = os.getenv('DIRECT_URL') or os.getenv('DATABASE_URL_UNPOOLED') or os.getenv('DATABASE_URL')
    if direct_url and 'prisma' not in direct_url.lower():
        db_url = direct_url
    else:
        # Try to extract/convert the URL - remove prisma+ prefix if present
        db_url = db_url.replace("prisma+postgres://", "postgresql://")
        db_url = db_url.replace("prisma+postgresql://", "postgresql://")
        db_url = db_url.replace("prisma://", "postgresql://")

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
app.register_blueprint(chat_bp)

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