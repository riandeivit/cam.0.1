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

let currentStream = null;
let currentFilter = 'none';

// ===================================
// INICIALIZAÇÃO AUTOMÁTICA DA CÂMERA
// ===================================
window.onload = () => {
    updateAspectRatio('4-5');
    initCamera();
    applyFilter('none'); 
    downloadButton.style.display = 'none'; 
};

function initCamera() {
    // navigator.mediaDevices.getUserMedia é a API principal para acesso à câmera
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            currentStream = stream;
            cameraFeed.srcObject = stream;
            cameraFeed.style.display = 'block';
            
            captureButton.disabled = false;
            
            cameraFeed.onloadedmetadata = () => {
                photoCanvas.width = cameraFeed.videoWidth;
                photoCanvas.height = cameraFeed.videoHeight;
                
                // NOVO: Tenta iniciar a reprodução para corrigir problemas de visualização no celular
                cameraFeed.play().catch(e => console.error("Erro ao tentar reproduzir o vídeo:", e));
            };
        })
        .catch(error => {
            console.error('Erro ao acessar a câmera:', error.name, error.message);
            
            let errorMessage = 'Não foi possível acessar a câmera. Motivo: ';
            
            if (error.name === 'NotAllowedError') {
                 errorMessage += 'Você negou a permissão ou o site está em um contexto inseguro (não HTTPS).';
            } else if (error.name === 'NotReadableError') {
                 errorMessage += 'A câmera está sendo usada por outro aplicativo.';
            } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                 // Aviso crucial para o mobile
                 errorMessage = 'FALHA DE SEGURANÇA: A câmera só pode ser acessada em um site **SEGURO (HTTPS)**. Por favor, use HTTPS.';
            } else {
                 errorMessage += 'Erro desconhecido. Por favor, tente novamente.';
            }

            alert(errorMessage);
            captureButton.disabled = true;
        });
}

// ===================================
// LÓGICA DE PROPORÇÃO DE TELA
// ===================================
function updateAspectRatio(ratio) {
    // 1. Limpa classes antigas
    cameraContainer.classList.remove('aspect-4-5-container', 'aspect-1-1-container', 'aspect-9-16-container');
    cameraFeed.classList.remove('aspect-4-5', 'aspect-1-1', 'aspect-9-16');
    photoCanvas.classList.remove('aspect-4-5', 'aspect-1-1', 'aspect-9-16');

    // 2. Aplica a nova classe de proporção ao CONTÊINER (Viewfinder)
    cameraContainer.classList.add(`aspect-${ratio}-container`);

    // 3. Aplica a nova classe de proporção ao FEED e ao CANVAS
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
// LÓGICA DE FILTROS (APENAS PARA PREVIEW CSS)
// ===================================
function applyFilter(filterName) {
    // Remove filtros CSS de ambos
    cameraFeed.classList.remove('none', 'grayscale', 'sepia', 'vintage');
    photoCanvas.classList.remove('none', 'grayscale', 'sepia', 'vintage');
    
    // Aplica o filtro CSS apenas ao feed de vídeo para o preview
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
        
        // Aplica o filtro CSS para o preview
        applyFilter(filterName);
        
        // Atualiza os rótulos
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
// FUNÇÕES DE MANIPULAÇÃO DE PIXEL (GARANTE QUE O FILTRO SEJA SALVO)
// ===================================

function applyPixelFilter(filterName) {
    // Se for 'none', retorna e não faz manipulação
    if (filterName === 'none') {
        return;
    }
    
    // Obtém os dados do pixel
    let imageData = context.getImageData(0, 0, photoCanvas.width, photoCanvas.height);
    let data = imageData.data; 

    // Aplica a manipulação baseada no filtro
    switch (filterName) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                // Cálculo de luminância para P&B
                let avg = (data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114);
                data[i] = avg;     // R
                data[i + 1] = avg; // G
                data[i + 2] = avg; // B
            }
            break;
        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                
                // Conversão Sépia
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189)); // R
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // G
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // B
            }
            break;
        case 'vintage':
             // Simulação de Vintage (combina sépia, contraste e saturação)
             for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                
                // Aplica Sépia/Tom Suave
                data[i] = (r * 0.9) + (g * 0.05) + (b * 0.05);
                data[i + 1] = (r * 0.05) + (g * 0.8) + (b * 0.05);
                data[i + 2] = (r * 0.05) + (g * 0.05) + (b * 0.7);
                
                // Aumenta o contraste (Aproximação)
                data[i] = Math.min(255, Math.max(0, 1.2 * (data[i] - 128) + 128));
                data[i + 1] = Math.min(255, Math.max(0, 1.2 * (data[i + 1] - 128) + 128));
                data[i + 2] = Math.min(255, Math.max(0, 1.2 * (data[i + 2] - 128) + 128));
            }
            break;
        case 'custom-js':
            // Filtro Customizado (Inverter Cores)
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            break;
    }
    
    // Coloca os novos dados de pixel no canvas
    context.putImageData(imageData, 0, 0);
}


// ===================================
// FUNÇÃO DE CAPTURA (COM INVERSÃO)
// ===================================
captureButton.addEventListener('click', () => {
    if (!currentStream) return;

    // --- CÁLCULO DE CORTE ---
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

    // 1. Redefine o tamanho do canvas para a imagem cortada
    photoCanvas.width = sourceW;
    photoCanvas.height = sourceH;
    
    // --- NOVO: INVERTE A IMAGEM HORIZONTALMENTE (ESPELHAMENTO) ---
    context.save();      // Salva o estado atual do contexto
    context.scale(-1, 1);  // Inverte horizontalmente (espelha)
    
    // Desenha a imagem. O -sourceW compensa a inversão do eixo X.
    context.drawImage(cameraFeed, sourceX, sourceY, sourceW, sourceH, -sourceW, 0, sourceW, sourceH);
    
    context.restore();   // Restaura o estado do contexto para o normal

    // 2. APLICA O FILTRO USANDO MANIPULAÇÃO DE PIXEL (garante que ele seja salvo)
    applyPixelFilter(currentFilter);

    // 3. Adiciona a classe de proporção para o display
    photoCanvas.className = '';
    photoCanvas.classList.add(`aspect-${activeRatioClass}`); 

    // Oculta botão de captura, mostra o de download e o canvas
    cameraFeed.style.display = 'none';
    photoCanvas.style.display = 'block';

    captureButton.style.display = 'none';
    downloadButton.style.display = 'inline-block';
    downloadButton.disabled = false;
});


// ===================================
// FUNÇÃO DE DOWNLOAD (ALTA QUALIDADE - PNG)
// ===================================
downloadButton.addEventListener('click', () => {
    // Usamos PNG para garantir ALTA QUALIDADE SEM COMPRESSÃO (LOSSLESS)
    const MIME_TYPE = 'image/png';
    const QUALITY = 1.0; 

    // O canvas já contém os pixels filtrados, basta exportar
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
