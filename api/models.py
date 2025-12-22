from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
import json

db = SQLAlchemy()

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    video_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    effects = db.relationship('Effect', backref='project', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'video_url': self.video_url,
            'created_at': self.created_at.isoformat(),
            'effects': [effect.to_dict() for effect in self.effects]
        }

class Effect(db.Model):
    __tablename__ = 'effects'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    start_time = db.Column(db.Float, nullable=True)
    end_time = db.Column(db.Float, nullable=True)
    config = db.Column(db.Text, nullable=True) # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        config_dict = None
        if self.config:
            try:
                config_dict = json.loads(self.config)
            except:
                pass
                
        return {
            'id': self.id,
            'project_id': self.project_id,
            'type': self.type,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'config': config_dict,
            'created_at': self.created_at.isoformat()
        }
