from flask import Blueprint, request, jsonify
from api.models import db, Project, Effect
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
        
        # Convert times to float if provided, otherwise use defaults for NOT NULL constraint
        # Using -1 for end_time to signify "end of video"
        start_val = float(start_time) if start_time is not None else 0.0
        end_val = float(end_time) if end_time is not None else -1.0
            
        effect = Effect(
            project_id=project_id,
            type=effect_type,
            start_time=start_val,
            end_time=end_val,
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
            start_time = eff.get("start_time")
            end_time = eff.get("end_time")
            
            start_val = float(start_time) if start_time is not None else 0.0
            end_val = float(end_time) if end_time is not None else -1.0

            effect = Effect(
                project_id=project_id,
                type=eff.get("type", "grayscale"),
                start_time=start_val,
                end_time=end_val,
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

@effects_bp.route("/<project_id>/effects/<effect_id>", methods=["DELETE"])
def delete_effect(project_id, effect_id):
    try:
        effect = Effect.query.filter_by(id=effect_id, project_id=project_id).first()
        if not effect:
            return jsonify({"error": "Effect not found"}), 404
            
        db.session.delete(effect)
        db.session.commit()
        
        return jsonify({"message": "Effect deleted"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting effect: {e}")
        return jsonify({"error": str(e)}), 500
