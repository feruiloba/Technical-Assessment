import os
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

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

def clean_postgres_url(url):
    """Clean Postgres URL by removing unsupported parameters like api_key."""
    if not url:
        return url
    
    parsed = urlparse(url)
    
    # Parse query parameters and filter out unsupported ones
    query_params = parse_qs(parsed.query)
    # Keep only standard PostgreSQL connection parameters
    valid_params = ['sslmode', 'connect_timeout', 'application_name', 'options']
    cleaned_params = {k: v[0] for k, v in query_params.items() if k in valid_params}
    
    # Rebuild the URL
    cleaned_url = urlunparse((
        parsed.scheme.replace('postgres', 'postgresql') if parsed.scheme == 'postgres' else parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        urlencode(cleaned_params) if cleaned_params else '',
        parsed.fragment
    ))
    
    return cleaned_url

# Database Configuration
# Try POSTGRES_URL_NON_POOLING first (direct connection), then POSTGRES_URL
db_url = os.getenv('POSTGRES_URL_NON_POOLING') or os.getenv('POSTGRES_URL') or os.getenv('DATABASE_URL', 'sqlite:///video_editor.db')

# Clean the URL to remove unsupported parameters
if 'postgresql' in db_url or 'postgres' in db_url:
    db_url = clean_postgres_url(db_url)

# Fix for URLs starting with postgres:// instead of postgresql://
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