"""
Crop Disease Detection API
Uses Azure Custom Vision for real-time disease identification
"""

from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import requests
from PIL import Image
import io

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Azure Custom Vision Configuration
PREDICTION_ENDPOINT = os.getenv('PREDICTION_ENDPOINT')
PREDICTION_KEY = os.getenv('PREDICTION_KEY')

# Treatment database
TREATMENTS = {
    'powdery': {
        'name': 'Powdery Mildew',
        'severity': 'Moderate',
        'organic': ['Neem oil spray', 'Baking soda solution (1 tbsp/gallon)', 'Milk spray (40% milk, 60% water)'],
        'chemical': ['Sulfur fungicide', 'Potassium bicarbonate'],
        'prevention': ['Improve air circulation', 'Reduce humidity', 'Remove infected leaves', 'Avoid overhead watering']
    },
    'rust': {
        'name': 'Rust Disease',
        'severity': 'High',
        'organic': ['Copper fungicide', 'Garlic extract spray'],
        'chemical': ['Mancozeb', 'Chlorothalonil'],
        'prevention': ['Remove infected leaves immediately', 'Crop rotation', 'Ensure proper drainage']
    },
    'healthy': {
        'name': 'Healthy Plant',
        'severity': 'None',
        'organic': ['Continue good practices'],
        'chemical': [],
        'prevention': ['Regular monitoring', 'Maintain plant health']
    }
}

@app.route('/')
def home():
    """Render main page"""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict disease from uploaded image
    Returns: JSON with disease, confidence, and treatment info
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        # Read image
        image_data = file.read()
        
        # Validate image
        try:
            Image.open(io.BytesIO(image_data))
        except Exception:
            return jsonify({'error': 'Invalid image file'}), 400
        
        # Call Custom Vision API
        headers = {
            'Prediction-Key': PREDICTION_KEY,
            'Content-Type': 'application/octet-stream'
        }
        
        response = requests.post(PREDICTION_ENDPOINT, headers=headers, data=image_data)
        response.raise_for_status()
        
        # Parse results
        result = response.json()
        predictions = result['predictions']
        
        # Get top prediction
        top_prediction = max(predictions, key=lambda x: x['probability'])
        disease_tag = top_prediction['tagName'].lower()
        confidence = top_prediction['probability'] * 100
        
        # Get treatment info
        treatment = TREATMENTS.get(disease_tag, {
            'name': disease_tag.title(),
            'severity': 'Unknown',
            'organic': [],
            'chemical': [],
            'prevention': []
        })
        
        return jsonify({
            'disease': treatment['name'],
            'confidence': round(confidence, 2),
            'severity': treatment['severity'],
            'treatment': {
                'organic': treatment['organic'],
                'chemical': treatment['chemical'],
                'prevention': treatment['prevention']
            },
            'raw_predictions': [
                {
                    'disease': p['tagName'],
                    'probability': round(p['probability'] * 100, 2)
                } for p in predictions
            ]
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'API Error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Server Error: {str(e)}'}), 500

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'crop-disease-detector'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)