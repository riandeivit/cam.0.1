const cameraContainer = document.querySelector('.camera-container');
const cameraFeed = document.getElementById('cameraFeed');
const photoCanvas = document.getElementById('photoCanvas');
const context = photoCanvas.getContext('2d');

const captureButton = document.getElementById('captureButton');
const downloadButton = document.getElementById('downloadButton');

// Selectors de Proporção
const mainToggle = document.querySelector('.main-toggle');
const hiddenRatios = document.getElementById('hiddenRatios');
const secondaryRatioButtons = document.querySelectorAll('#hiddenRatios .aspect-btn'); 
let isRatioExpanded = false; 

// Selectors de Filtros
const filterToggle = document.querySelector('.filter-label');
const hiddenFilters = document.getElementById('hiddenFilters');
const secondaryFilterButtons = document.querySelectorAll('#hiddenFilters .filter-btn');
let isFilterExpanded = false; 

// ===================================
// VARIÁVEIS DE CÂMERA E CONTROLES SUPERIORES
// ===================================
const flipCameraButton = document.getElementById('flipCameraButton');
const flashButton = document.getElementById('flashButton');
let currentFacingMode = 'user'; // Começa com a câmera FRONTAL (selfie)
let isFlashlightAvailable = false;
let isFlashlightOn = false;
let currentStream = null;
let currentFilter = 'none';


// ===================================
// INICIALIZAÇÃO AUTOMÁTICA DA CÂMERA
// ===================================
window.onload = () => {
    updateAspectRatio('4-5');
    setupControls(); // Configura os event listeners
    initCamera(currentFacingMode); // Inicia a câmera (frontal por padrão)
    applyFilter('none'); 
    downloadButton.style.display = 'none'; 
};

// NOVO: Função para parar o stream atual
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => {
            track.stop();
        });
    }
}

// ATUALIZADA: Função para iniciar a câmera com base no facingMode
function initCamera(facingMode) {
    stopCamera(); 
    
    // Desliga o flash antes de tentar iniciar (boa prática)
    if (isFlashlightOn) {
        isFlashlightOn = false;
        flashButton.classList.remove('active');
        flashButton.textContent = '💡';
    }

    const constraints = {
        video: {
            facingMode: facingMode, 
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            currentStream = stream;
            cameraFeed.srcObject = stream;
            cameraFeed.style.display = 'block';
            captureButton.disabled = false;
            currentFacingMode = facingMode; 
            
            // Lógica para detecção e controle do Flash
            const videoTrack = currentStream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            
            isFlashlightAvailable = capabilities.torch; 

            // O Flash só é habilitado se estiver disponível E se a câmera for a traseira
            if (isFlashlightAvailable && currentFacingMode === 'environment') {
                flashButton.disabled = false;
            } else {
                flashButton.disabled = true;
            }

            cameraFeed.onloadedmetadata = () => {
                photoCanvas.width = cameraFeed.videoWidth;
                photoCanvas.height = cameraFeed.videoHeight;
                cameraFeed.play().catch(e => console.error("Erro ao tentar reproduzir o vídeo:", e));
            };
        })
        .catch(error => {
            console.error('Erro ao acessar a câmera:', error.name, error.message);
            
            let errorMessage = 'Não foi possível acessar a câmera.';
            
            if (error.name === 'NotAllowedError') {
                 errorMessage += ' Você negou a permissão.';
            } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                 errorMessage = 'FALHA DE SEGURANÇA: A câmera só pode ser acessada em um site **SEGURO (HTTPS)**.';
            }

            alert(errorMessage);
            captureButton.disabled = true;
            flashButton.disabled = true;
        });
}

// NOVO: Função para alternar entre as câmeras
function flipCamera() {
    const newFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
    initCamera(newFacingMode);
}

// NOVO: Função para ligar/desligar o flash
function toggleFlash() {
    if (!isFlashlightAvailable || currentFacingMode === 'user' || flashButton.disabled) {
        return;
    }
    
    const track = currentStream.getVideoTracks()[0];
    isFlashlightOn = !isFlashlightOn;

    track.applyConstraints({
        advanced: [{ torch: isFlashlightOn }]
    }).then(() => {
        if (isFlashlightOn) {
            flashButton.classList.add('active');
            flashButton.textContent = '⚡'; 
        } else {
            flashButton.classList.remove('active');
            flashButton.textContent = '💡'; 
        }
    }).catch(e => {
        console.error('Erro ao controlar o flash:', e);
        isFlashlightOn = !isFlashlightOn; 
        alert('Não foi possível controlar o Flash.');
    });
}

// NOVO: Configura os event listeners
function setupControls() {
    flipCameraButton.addEventListener('click', flipCamera);
    flashButton.addEventListener('click', toggleFlash);
}


// ===================================
// LÓGICA DE PROPORÇÃO DE TELA (sem alterações)
// ===================================
function updateAspectRatio(ratio) {
    cameraContainer.classList.remove('aspect-4-5-container', 'aspect-1-1-container', 'aspect-9-16-container');
    cameraFeed.classList.remove('aspect-4-5', 'aspect-1-1', 'aspect-9-16');
    photoCanvas.classList.remove('aspect-4-5', 'aspect-1-1', 'aspect-9-16');

    cameraContainer.classList.add(`aspect-${ratio}-container`);
    cameraFeed.classList.add(`aspect-${ratio}`, currentFilter);
    photoCanvas.classList.add(`aspect-${ratio}`);
}

mainToggle.addEventListener('click', () => {
    isRatioExpanded = !isRatioExpanded;
    if (isRatioExpanded) {
        hiddenRatios.classList.add('expanded');
    } else {
        hiddenRatios.classList.remove('expanded');
    }
});

secondaryRatioButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const ratio = event.target.getAttribute('data-ratio');
        updateAspectRatio(ratio);
        
        const oldRatio = mainToggle.getAttribute('data-ratio');
        const oldText = mainToggle.textContent;

        mainToggle.setAttribute('data-ratio', ratio);
        mainToggle.textContent = ratio.replace('-', ':');
        
        button.setAttribute('data-ratio', oldRatio);
        button.textContent = oldText;
        
        isRatioExpanded = false;
        hiddenRatios.classList.remove('expanded');
    });
});

// ===================================
// LÓGICA DE FILTROS (sem alterações)
// ===================================
function applyFilter(filterName) {
    cameraFeed.classList.remove('none', 'grayscale', 'sepia', 'vintage');
    photoCanvas.classList.remove('none', 'grayscale', 'sepia', 'vintage');
    
    if (filterName !== 'custom-js') {
        cameraFeed.classList.add(filterName);
    }
    
    currentFilter = filterName;
}

filterToggle.addEventListener('click', () => {
    isFilterExpanded = !isFilterExpanded;
    if (isFilterExpanded) {
        hiddenFilters.classList.add('expanded');
    } else {
        hiddenFilters.classList.remove('expanded');
    }
});

secondaryFilterButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const filterName = event.target.getAttribute('data-filter');
        applyFilter(filterName);
        
        const oldFilter = filterToggle.getAttribute('data-filter');
        const oldText = filterToggle.textContent;

        filterToggle.setAttribute('data-filter', filterName);
        filterToggle.textContent = button.textContent;
        
        button.setAttribute('data-filter', oldFilter);
        button.textContent = oldText;
        
        filterToggle.classList.add('active-filter');
        
        isFilterExpanded = false;
        hiddenFilters.classList.remove('expanded');
    });
});

// ===================================
// FUNÇÕES DE MANIPULAÇÃO DE PIXEL (sem alterações)
// ===================================
function applyPixelFilter(filterName) {
    if (filterName === 'none') {
        return;
    }
    
    let imageData = context.getImageData(0, 0, photoCanvas.width, photoCanvas.height);
    let data = imageData.data; 

    switch (filterName) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                let avg = (data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114);
                data[i] = avg;     
                data[i + 1] = avg; 
                data[i + 2] = avg; 
            }
            break;
        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189)); 
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); 
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); 
            }
            break;
        case 'vintage':
             for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                
                data[i] = (r * 0.9) + (g * 0.05) + (b * 0.05);
                data[i + 1] = (r * 0.05) + (g * 0.8) + (b * 0.05);
                data[i + 2] = (r * 0.05) + (g * 0.05) + (b * 0.7);
                
                data[i] = Math.min(255, Math.max(0, 1.2 * (data[i] - 128) + 128));
                data[i + 1] = Math.min(255, Math.max(0, 1.2 * (data[i + 1] - 128) + 128));
                data[i + 2] = Math.min(255, Math.max(0, 1.2 * (data[i + 2] - 128) + 128));
            }
            break;
        case 'custom-js':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            break;
    }
    
    context.putImageData(imageData, 0, 0);
}


// ===================================
// FUNÇÃO DE CAPTURA (CORRIGIDA: SEM ESPELHAMENTO DO CANVAS)
// ===================================
captureButton.addEventListener('click', () => {
    if (!currentStream) return;

    // --- CÁLCULO DE CORTE (Crop) ---
    const activeRatioClass = mainToggle.getAttribute('data-ratio');
    let [num, den] = activeRatioClass.split('-').map(Number);
    const targetRatio = num / den; 
    
    const videoW = cameraFeed.videoWidth;
    const videoH = cameraFeed.videoHeight;
    const videoRatio = videoW / videoH;

    let sourceX, sourceY, sourceW, sourceH;

    if (videoRatio > targetRatio) {
        // Cortar lateralmente
        sourceH = videoH;
        sourceW = videoH * targetRatio;
        sourceX = (videoW - sourceW) / 2;
        sourceY = 0;
    } else {
        // Cortar verticalmente
        sourceW = videoW;
        sourceH = videoW / targetRatio;
        sourceY = (videoH - sourceH) / 2;
        sourceX = 0;
    }

    // 1. Redefine o tamanho do canvas
    photoCanvas.width = sourceW;
    photoCanvas.height = sourceH;
    
    // Desenha a imagem. Como o FEED de vídeo está espelhado pelo CSS, 
    // a captura para o Canvas já sai espelhada, exatamente como a pré-visualização.
    context.drawImage(cameraFeed, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);
    
    // 2. APLICA O FILTRO POR PIXEL
    applyPixelFilter(currentFilter);

    // 3. Adiciona a classe de proporção para o display
    photoCanvas.className = '';
    photoCanvas.classList.add(`aspect-${activeRatioClass}`); 

    // Oculta vídeo e mostra o canvas
    cameraFeed.style.display = 'none';
    photoCanvas.style.display = 'block';

    captureButton.style.display = 'none';
    downloadButton.style.display = 'inline-block';
    downloadButton.disabled = false;
    
    // Desliga o flash após a captura (se estiver ligado)
    if (isFlashlightOn) {
        toggleFlash();
    }
});


// ===================================
// FUNÇÃO DE DOWNLOAD (sem alterações)
// ===================================
downloadButton.addEventListener('click', () => {
    const MIME_TYPE = 'image/png';
    const QUALITY = 1.0; 

    const dataURL = photoCanvas.toDataURL(MIME_TYPE, QUALITY); 
    
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `minha-foto-filtrada-${currentFilter}.png`; 
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Volta para o modo de câmera
    captureButton.style.display = 'inline-block';
    captureButton.disabled = false;
    downloadButton.style.display = 'none';
    downloadButton.disabled = true;
    
    cameraFeed.style.display = 'block';
    photoCanvas.style.display = 'none';
});
