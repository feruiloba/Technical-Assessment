from flask import Blueprint, request, jsonify
from models import db, Project, Effect
import logging
import json

effects_bp = Blueprint('effects', __name__)
logger = logging.getLogger(__name__)

@effects_bp.route("/<project_id>/effects", methods=["POST"])
def add_effect(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404
            
        data = request.get_json()
        effect_type = data.get("type", "grayscale")
        start_time = data.get("start_time")
        end_time = data.get("end_time")
        config = data.get("config")
        
        if start_time is None or end_time is None:
            return jsonify({"error": "start_time and end_time are required"}), 400
            
        effect = Effect(
            project_id=project_id,
            type=effect_type,
            start_time=float(start_time),
            end_time=float(end_time),
            config=json.dumps(config) if config else None
        )
        
        db.session.add(effect)
        db.session.commit()
        
        return jsonify(effect.to_dict()), 201
    except Exception as e:
        logger.error(f"Error adding effect: {e}")
        return jsonify({"error": str(e)}), 500

@effects_bp.route("/<project_id>/effects", methods=["PUT"])
def update_effects(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404
            
        data = request.get_json()
        effects_data = data.get("effects", [])
        
        # Clear existing effects
        Effect.query.filter_by(project_id=project_id).delete()
        
        # Add new effects
        new_effects = []
        for eff in effects_data:
            effect = Effect(
                project_id=project_id,
                type=eff.get("type", "grayscale"),
                start_time=float(eff.get("start_time")),
                end_time=float(eff.get("end_time")),
                config=json.dumps(eff.get("config")) if eff.get("config") else None
            )
            db.session.add(effect)
            new_effects.append(effect)
            
        db.session.commit()
        
        return jsonify([e.to_dict() for e in new_effects]), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating effects: {e}")
        return jsonify({"error": str(e)}), 500
