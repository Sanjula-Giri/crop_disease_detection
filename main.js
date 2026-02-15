/**
 * Crop Disease Detection - Main Application
 * Integrates with Azure Custom Vision API
 */

// ============================================
// TREATMENT DATABASE
// ============================================

const TREATMENTS = {
    'powdery': {
        name: 'Powdery Mildew',
        severity: 'Moderate',
        severityClass: 'warning',
        organic: [
            'Neem oil spray - Apply every 7 days',
            'Baking soda solution (1 tbsp per gallon)',
            'Milk spray (40% milk, 60% water)',
            'Potassium bicarbonate spray'
        ],
        chemical: [
            'Sulfur-based fungicide',
            'Myclobutanil',
            'Trifloxystrobin'
        ],
        prevention: [
            'Improve air circulation',
            'Reduce humidity levels',
            'Remove infected leaves',
            'Avoid overhead watering'
        ]
    },
    'rust': {
        name: 'Rust Disease',
        severity: 'High',
        severityClass: 'danger',
        organic: [
            'Copper-based fungicide',
            'Garlic extract spray',
            'Neem oil application',
            'Bordeaux mixture'
        ],
        chemical: [
            'Mancozeb fungicide',
            'Chlorothalonil',
            'Propiconazole'
        ],
        prevention: [
            'Remove infected leaves immediately',
            'Crop rotation (3-4 year cycle)',
            'Ensure proper drainage',
            'Avoid working with wet plants'
        ]
    },
    'healthy': {
        name: 'Healthy Plant',
        severity: 'None',
        severityClass: 'success',
        organic: [
            'Continue current care practices',
            'Regular fertilization',
            'Monitor for early disease signs'
        ],
        chemical: [],
        prevention: [
            'Regular monitoring',
            'Maintain optimal watering',
            'Ensure adequate nutrition',
            'Remove dead plant material'
        ]
    }
};

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    imageInput: document.getElementById('imageInput'),
    uploadArea: document.getElementById('uploadArea'),
    previewSection: document.getElementById('previewSection'),
    previewImage: document.getElementById('previewImage'),
    loadingSection: document.getElementById('loadingSection'),
    loadingText: document.getElementById('loadingText'),
    resultsSection: document.getElementById('resultsSection'),
    resultImage: document.getElementById('resultImage'),
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    
    // Results elements
    diseaseName: document.getElementById('diseaseName'),
    confidenceScore: document.getElementById('confidenceScore'),
    severityLevel: document.getElementById('severityLevel'),
    allPredictionsList: document.getElementById('allPredictionsList'),
    organicList: document.getElementById('organicList'),
    chemicalList: document.getElementById('chemicalList'),
    preventionList: document.getElementById('preventionList')
};

// ============================================
// EVENT LISTENERS
// ============================================

// Image input change
elements.imageInput.addEventListener('change', handleImageSelect);

// Drag and drop
elements.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadArea.style.borderColor = '#20c997';
});

elements.uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    elements.uploadArea.style.borderColor = '#198754';
});

elements.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadArea.style.borderColor = '#198754';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// ============================================
// IMAGE HANDLING
// ============================================

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    if (!CONFIG.supportedFormats.includes(file.type)) {
        showError('Please upload a valid image file (JPG, PNG, or BMP)', 'Invalid file type');
        return;
    }
    
    // Validate file size
    if (file.size > CONFIG.maxFileSize) {
        showError('File size exceeds 6MB. Please choose a smaller image.', 'File too large');
        return;
    }
    
    // Display preview
    const reader = new FileReader();
    reader.onload = function(e) {
        elements.previewImage.src = e.target.result;
        showSection('preview');
    };
    reader.readAsDataURL(file);
    
    if (CONFIG.debugMode) {
        console.log('Image loaded:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
    }
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

async function analyzeImage() {
    const file = elements.imageInput.files[0];
    
    if (!file) {
        showError('Please select an image first', 'No image selected');
        return;
    }
    
    // Show loading state
    showSection('loading');
    elements.analyzeBtn.disabled = true;
    
    try {
        let result;
        
        if (CONFIG.useMockData) {
            // Use mock data
            updateLoadingText('Using mock data...');
            result = await getMockPrediction();
        } else {
            // Call real Azure API
            updateLoadingText('Connecting to Azure Custom Vision...');
            result = await callCustomVisionAPI(file);
        }
        
        // Display results
        displayResults(result, file);
        
        if (CONFIG.debugMode) {
            console.log('Analysis complete:', result);
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError(
            error.message || 'Failed to analyze image. Please check your configuration and try again.',
            'Analysis Failed'
        );
    } finally {
        elements.analyzeBtn.disabled = false;
    }
}

// ============================================
// AZURE CUSTOM VISION API INTEGRATION
// ============================================

async function callCustomVisionAPI(file) {
    return new Promise((resolve, reject) => {
        // Validate configuration
        if (CONFIG.predictionEndpoint === 'YOUR_PREDICTION_ENDPOINT_URL_HERE') {
            reject(new Error('Azure endpoint not configured. Please update config.js with your prediction endpoint.'));
            return;
        }
        
        if (CONFIG.predictionKey === 'YOUR_PREDICTION_KEY_HERE') {
            reject(new Error('Azure key not configured. Please update config.js with your prediction key.'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                updateLoadingText('Uploading image to Azure...');
                
                // Convert to blob
                const arrayBuffer = e.target.result;
                const blob = new Blob([arrayBuffer], { type: file.type });
                
                if (CONFIG.debugMode) {
                    console.log('Calling Azure Custom Vision API...');
                    console.log('Endpoint:', CONFIG.predictionEndpoint);
                }
                
                // Create timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout - Azure API took too long to respond')), CONFIG.apiTimeout);
                });
                
                // Create fetch promise
                const fetchPromise = fetch(CONFIG.predictionEndpoint, {
                    method: 'POST',
                    headers: {
                        'Prediction-Key': CONFIG.predictionKey,
                        'Content-Type': 'application/octet-stream'
                    },
                    body: blob
                });
                
                updateLoadingText('Processing image...');
                
                // Race between timeout and fetch
                const response = await Promise.race([fetchPromise, timeoutPromise]);
                
                if (!response.ok) {
                    // Handle specific HTTP errors
                    if (response.status === 401) {
                        throw new Error('Unauthorized - Check your Prediction-Key in config.js');
                    } else if (response.status === 404) {
                        throw new Error('Endpoint not found - Check your prediction endpoint URL');
                    } else if (response.status === 400) {
                        throw new Error('Bad request - Image format may not be supported');
                    } else {
                        throw new Error(`API Error ${response.status}: ${response.statusText}`);
                    }
                }
                
                updateLoadingText('Analyzing results...');
                
                const data = await response.json();
                
                if (CONFIG.debugMode) {
                    console.log('API Response:', data);
                }
                
                // Validate response
                if (!data.predictions || data.predictions.length === 0) {
                    throw new Error('No predictions returned from API');
                }
                
                // Get top prediction
                const topPrediction = data.predictions.reduce((max, pred) => 
                    pred.probability > max.probability ? pred : max
                );
                
                resolve({
                    disease: normalizeTagName(topPrediction.tagName),
                    confidence: topPrediction.probability * 100,
                    allPredictions: data.predictions.map(p => ({
                        tagName: p.tagName,
                        probability: p.probability * 100
                    }))
                });
                
            } catch (error) {
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    reject(new Error('Network error - Check your internet connection or CORS settings'));
                } else {
                    reject(error);
                }
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsArrayBuffer(file);
    });
}

// ============================================
// MOCK DATA (FOR TESTING)
// ============================================

async function getMockPrediction() {
    // Simulate API delay
    await sleep(1500);
    
    const diseases = ['powdery', 'rust', 'healthy'];
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = 85 + Math.random() * 12;
    
    return {
        disease: randomDisease,
        confidence: confidence,
        allPredictions: diseases.map((d, i) => ({
            tagName: d,
            probability: i === diseases.indexOf(randomDisease) ? confidence : Math.random() * 10
        }))
    };
}

// ============================================
// DISPLAY RESULTS
// ============================================

function displayResults(prediction, imageFile) {
    // Normalize tag name
    const diseaseTag = normalizeTagName(prediction.disease);
    
    // Get treatment info
    const treatment = TREATMENTS[diseaseTag] || {
        name: prediction.disease,
        severity: 'Unknown',
        severityClass: 'secondary',
        organic: ['No treatment information available'],
        chemical: [],
        prevention: ['Monitor the plant regularly']
    };
    
    // Show results section
    showSection('results');
    
    // Set result image
    const reader = new FileReader();
    reader.onload = function(e) {
        elements.resultImage.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
    
    // Disease name
    elements.diseaseName.textContent = treatment.name;
    
    // Confidence score
    const confidence = Math.round(prediction.confidence * 10) / 10;
    elements.confidenceScore.textContent = `${confidence}%`;
    elements.confidenceScore.className = `badge ${confidence > 80 ? 'bg-success' : confidence > 60 ? 'bg-warning' : 'bg-danger'}`;
    
    // Severity
    elements.severityLevel.textContent = treatment.severity;
    elements.severityLevel.className = `badge bg-${treatment.severityClass}`;
    
    // All predictions
    elements.allPredictionsList.innerHTML = prediction.allPredictions
        .sort((a, b) => b.probability - a.probability)
        .map(pred => {
            const percent = Math.round(pred.probability * 10) / 10;
            const barWidth = Math.max(percent, 5); // Minimum 5% for visibility
            return `
                <li class="mb-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span><strong>${pred.tagName}</strong></span>
                        <span class="badge bg-secondary">${percent}%</span>
                    </div>
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar bg-success" style="width: ${barWidth}%"></div>
                    </div>
                </li>
            `;
        })
        .join('');
    
    // Organic treatments
    elements.organicList.innerHTML = treatment.organic
        .map(item => `<li class="mb-2"><i class="bi bi-check2 text-success me-2"></i>${item}</li>`)
        .join('');
    
    // Chemical treatments
    if (treatment.chemical.length > 0) {
        elements.chemicalList.innerHTML = treatment.chemical
            .map(item => `<li class="mb-2"><i class="bi bi-check2 text-warning me-2"></i>${item}</li>`)
            .join('');
    } else {
        elements.chemicalList.innerHTML = '<li class="text-muted"><i class="bi bi-info-circle me-2"></i>No chemical treatment needed</li>';
    }
    
    // Prevention tips
    elements.preventionList.innerHTML = treatment.prevention
        .map(item => `<li class="mb-2"><i class="bi bi-info-circle text-info me-2"></i>${item}</li>`)
        .join('');
    
    // Scroll to results
    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// ============================================
// UI HELPERS
// ============================================

function showSection(section) {
    // Hide all sections
    elements.uploadArea.style.display = 'none';
    elements.previewSection.style.display = 'none';
    elements.loadingSection.style.display = 'none';
    elements.resultsSection.style.display = 'none';
    elements.errorSection.style.display = 'none';
    
    // Show requested section
    switch(section) {
        case 'upload':
            elements.uploadArea.style.display = 'block';
            break;
        case 'preview':
            elements.previewSection.style.display = 'block';
            break;
        case 'loading':
            elements.loadingSection.style.display = 'block';
            break;
        case 'results':
            elements.resultsSection.style.display = 'block';
            break;
        case 'error':
            elements.errorSection.style.display = 'block';
            break;
    }
}

function updateLoadingText(text) {
    if (elements.loadingText) {
        elements.loadingText.textContent = text;
    }
}

function showError(message, title = 'Error') {
    elements.errorMessage.innerHTML = `<strong>${title}:</strong> ${message}`;
    showSection('error');
    
    console.error(`${title}:`, message);
}

function resetDetector() {
    elements.imageInput.value = '';
    showSection('upload');
    
    // Scroll to detector
    document.getElementById('detector').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function normalizeTagName(tagName) {
    // Convert tag name to lowercase and remove special characters
    // 'Powdery_Mildew' -> 'powdery'
    // 'Rust' -> 'rust'
    // 'Healthy' -> 'healthy'
    
    const normalized = tagName.toLowerCase()
        .replace(/_/g, '')
        .replace(/mildew/g, '')
        .replace(/disease/g, '')
        .trim();
    
    // Match to known diseases
    if (normalized.includes('powdery')) return 'powdery';
    if (normalized.includes('rust')) return 'rust';
    if (normalized.includes('healthy')) return 'healthy';
    
    // Return original if no match
    return tagName.toLowerCase();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// SMOOTH SCROLLING
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ============================================
// INITIALIZATION
// ============================================

console.log('%c🌱 Crop Disease Detector', 'font-size: 20px; color: #198754; font-weight: bold');
console.log('%cMicrosoft Elevate AICTE Internship Project', 'font-size: 12px; color: #666');

if (CONFIG.debugMode) {
    console.log('Debug mode enabled');
    console.log('Configuration:', {
        useMockData: CONFIG.useMockData,
        hasEndpoint: CONFIG.predictionEndpoint !== 'YOUR_PREDICTION_ENDPOINT_URL_HERE',
        hasKey: CONFIG.predictionKey !== 'YOUR_PREDICTION_KEY_HERE'
    });
}
