const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const previewSection = document.getElementById('previewSection');
const results = document.getElementById('results');

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewSection.style.display = 'block';
            results.style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
});

async function analyzeImage() {
    const file = imageInput.files[0];
    if (!file) {
        alert('Please select an image first');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        alert('Error analyzing image: ' + error.message);
    }
}

function displayResults(data) {
    document.getElementById('diseaseName').textContent = data.disease;
    document.getElementById('confidence').textContent = data.confidence + '%';
    document.getElementById('severity').textContent = data.severity;

    // Organic treatments
    const organicList = document.getElementById('organicList');
    organicList.innerHTML = '';
    data.treatment.organic.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        organicList.appendChild(li);
    });

    // Chemical treatments
    const chemicalList = document.getElementById('chemicalList');
    chemicalList.innerHTML = '';
    data.treatment.chemical.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        chemicalList.appendChild(li);
    });

    // Prevention
    const preventionList = document.getElementById('preventionList');
    preventionList.innerHTML = '';
    data.treatment.prevention.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        preventionList.appendChild(li);
    });

    results.style.display = 'block';
}