from flask import Blueprint, request, jsonify
from api.models import db, Project
import logging

projects_bp = Blueprint('projects', __name__)
logger = logging.getLogger(__name__)

@projects_bp.route("", methods=["POST"])
def create_project():
    try:
        data = request.get_json()
        name = data.get("name")
        video_url = data.get("video_url")
        
        if not name or not video_url:
            return jsonify({"error": "Name and video_url are required"}), 400
            
        project = Project(name=name, video_url=video_url)
        db.session.add(project)
        db.session.commit()
        
        return jsonify(project.to_dict()), 201
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        return jsonify({"error": str(e)}), 500

@projects_bp.route("", methods=["GET"])
def list_projects():
    try:
        projects = Project.query.order_by(Project.created_at.desc()).all()
        return jsonify([p.to_dict() for p in projects]), 200
    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        return jsonify({"error": str(e)}), 500

@projects_bp.route("/<project_id>", methods=["GET"])
def get_project(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404
        return jsonify(project.to_dict()), 200
    except Exception as e:
        logger.error(f"Error getting project: {e}")
        return jsonify({"error": str(e)}), 500

@projects_bp.route("/<project_id>", methods=["PUT"])
def update_project(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404
            
        data = request.get_json()
        if "name" in data:
            project.name = data["name"]
        if "video_url" in data:
            project.video_url = data["video_url"]
            
        db.session.commit()
        return jsonify(project.to_dict()), 200
    except Exception as e:
        logger.error(f"Error updating project: {e}")
        return jsonify({"error": str(e)}), 500
