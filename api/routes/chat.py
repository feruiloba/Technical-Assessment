from flask import Blueprint, request, jsonify
import os
import anthropic
import json
import logging

chat_bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)

@chat_bp.route("/command", methods=["POST"])
def process_command():
    data = request.get_json()
    text = data.get("text")
    duration = data.get("duration", 0)
    current_time = data.get("current_time", 0)
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        # Mock response for development if no key is present
        # This is useful for testing the UI without an API key
        logger.warning("ANTHROPIC_API_KEY not found. Using mock response.")
        commands = []
        if "delete" in text.lower() or "remove" in text.lower():
            if "blur" in text.lower():
                commands.append({"action": "delete", "type": "blur"})
            elif "sepia" in text.lower():
                commands.append({"action": "delete", "type": "sepia"})
            elif "gray" in text.lower():
                commands.append({"action": "delete", "type": "grayscale"})
            elif "invert" in text.lower():
                commands.append({"action": "delete", "type": "invert"})
            elif "all" in text.lower():
                commands.append({"action": "delete", "type": "all"})
            else:
                commands.append({"action": "delete", "type": "segmentation"})
        else:
            if "blur" in text.lower():
                commands.append({"action": "add", "type": "blur", "start_time": current_time, "end_time": -1})
            elif "sepia" in text.lower():
                commands.append({"action": "add", "type": "sepia", "start_time": current_time, "end_time": -1})
            elif "gray" in text.lower():
                commands.append({"action": "add", "type": "grayscale", "start_time": current_time, "end_time": -1})
            elif "invert" in text.lower():
                commands.append({"action": "add", "type": "invert", "start_time": current_time, "end_time": -1})
            else:
                commands.append({"action": "add", "type": "segmentation", "start_time": current_time, "end_time": -1})
        
        return jsonify({"commands": commands}), 200
        
    client = anthropic.Anthropic(api_key=api_key)
    
    prompt = f"""
    You are a video editing assistant. Extract video effect commands from the user's text.
    
    Context:
    - Video duration: {duration} seconds
    - Current playback time: {current_time} seconds
    
    Available effects:
    - segmentation (default if 'background' or 'remove background' is mentioned)
    - blur
    - grayscale (or black and white)
    - sepia
    - invert
    
    Instructions:
    - Return ONLY a JSON object. No other text.
    - The JSON object should contain a "commands" key which is a list of command objects.
    - JSON format: {{ "commands": [ {{ "action": "add" | "delete", "type": "string", "start_time": number, "end_time": number }}, ... ] }}
    - "action": "add" for creating effects, "delete" for removing them.
    - If no start time is specified, use the current playback time ({current_time}), EXCEPT for "delete all" or "remove all" commands where you should omit start_time/end_time unless a timeframe is explicitly stated.
    - If no end time is specified, use -1 (which means end of video).
    - If the user says "for 5 seconds", calculate end_time = start_time + 5.
    - If the user says "full video" or "entire video", use start_time=0, end_time=-1.
    - If the user says "from start", use start_time=0.
    - For DELETE commands:
      - If user says "delete blur", set action="delete", type="blur".
      - If user says "delete all", set action="delete", type="all". Do NOT set start_time/end_time unless the user says "delete all from 5 to 10".
      - If user says "delete sepia from 10 to 12", set action="delete", type="sepia", start_time=10, end_time=12.
      - If user says "delete blur at 5 seconds", set action="delete", type="blur", start_time=5, end_time=5 (or a small range).
      - Timeframes for delete are optional but can be used to target specific effects.
    - If the user asks for multiple things (e.g. "add blur 0-5 and sepia 10-15"), return multiple objects in the "commands" list.
    
    User text: "{text}"
    """
    
    try:
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract JSON from response
        content = message.content[0].text
        # Simple cleanup in case there's extra text
        start_idx = content.find('{')
        end_idx = content.rfind('}') + 1
        if start_idx != -1 and end_idx != -1:
            json_str = content[start_idx:end_idx]
            data = json.loads(json_str)
            
            # Normalize response to always have "commands" list
            if "commands" in data:
                return jsonify(data), 200
            elif "action" in data:
                # Single command format backward compatibility
                return jsonify({"commands": [data]}), 200
            else:
                # Fallback if LLM returns just the object without "commands" key or "action"
                # Try to guess if it's a single command object
                if "type" in data:
                    if "action" not in data:
                        data["action"] = "add"
                    return jsonify({"commands": [data]}), 200
                
            return jsonify({"error": "Invalid response format from LLM"}), 400
        else:
            logger.error(f"Could not parse JSON from LLM response: {content}")
            return jsonify({"error": "Could not understand command"}), 400
            
    except Exception as e:
        logger.error(f"Error processing chat command: {e}")
        return jsonify({"error": str(e)}), 500