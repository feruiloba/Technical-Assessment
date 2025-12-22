from flask import Blueprint, request, jsonify
import cloudinary
import cloudinary.uploader
import os
import logging

upload_bp = Blueprint('upload', __name__)
logger = logging.getLogger(__name__)

# Configure Cloudinary
# You need to set these environment variables
cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET'),
  secure = True
)

@upload_bp.route("/upload", methods=["POST"])
def upload_video():
    try:
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        file = request.files['video']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Upload to Cloudinary
        # resource_type="video" is important for video files
        upload_result = cloudinary.uploader.upload(
            file, 
            resource_type="video",
            folder="video-editor-projects"
        )
        
        return jsonify({
            "url": upload_result['secure_url'],
            "public_id": upload_result['public_id'],
            "duration": upload_result.get('duration'),
            "format": upload_result.get('format')
        }), 200

    except Exception as e:
        logger.error(f"Error uploading video: {e}")
        return jsonify({"error": str(e)}), 500
