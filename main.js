const textElement = document.getElementById('text');
const debugElement = document.getElementById('debug');
const gammaValueElement = document.getElementById('gammaValue');
const betaValueElement = document.getElementById('betaValue');
const widthValueElement = document.getElementById('widthValue');
const weightValueElement = document.getElementById('weightValue');

let hasOrientationSupport = false;

// Check if device orientation is supported
if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleOrientation);
    hasOrientationSupport = true;
}

// Fallback for desktop: use mouse position
if (!hasOrientationSupport || window.innerWidth > 768) {
    document.addEventListener('mousemove', handleMouseMove);
}

// Request permission for iOS 13+
function requestOrientationPermission() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                }
            })
            .catch(console.error);
    }
}

// Handle device orientation changes
function handleOrientation(event) {
    const gamma = event.gamma; // Left/Right tilt (-90 to 90)
    const beta = event.beta;   // Front/Back tilt (-180 to 180)
    
    if (gamma !== null && beta !== null) {
        // Map gamma (-90 to 90) to width (100 to 900)
        const width = mapRange(gamma, -90, 90, 100, 900);
        
        // Map beta (-90 to 90) to weight (100 to 900)
        // Clamp beta to reasonable range for better control
        const clampedBeta = Math.max(-90, Math.min(90, beta));
        const weight = mapRange(clampedBeta, -90, 90, 100, 900);
        
        updateFontVariation(width, weight);
        updateDebugInfo(gamma, beta, width, weight);
    }
}

// Fallback mouse control for desktop
function handleMouseMove(event) {
    const x = event.clientX;
    const y = event.clientY;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Map mouse X position to width
    const width = mapRange(x, 0, windowWidth, 100, 900);
    
    // Map mouse Y position to weight
    const weight = mapRange(y, 0, windowHeight, 100, 900);
    
    updateFontVariation(width, weight);
    updateDebugInfo(x / windowWidth * 180 - 90, y / windowHeight * 180 - 90, width, weight);
}

// Update font variation settings
function updateFontVariation(width, weight) {
    textElement.style.fontVariationSettings = `'wght' ${Math.round(weight)}, 'wdth' ${Math.round(width)}`;
}

// Update debug information
function updateDebugInfo(gamma, beta, width, weight) {
    if (gammaValueElement) {
        gammaValueElement.textContent = Math.round(gamma);
        betaValueElement.textContent = Math.round(beta);
        widthValueElement.textContent = Math.round(width);
        weightValueElement.textContent = Math.round(weight);
    }
}

// Utility function to map a value from one range to another
function mapRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// Toggle debug display (tap/click to show/hide)
textElement.addEventListener('click', () => {
    debugElement.style.display = debugElement.style.display === 'none' ? 'block' : 'none';
});

// For iOS devices, request permission on user interaction
textElement.addEventListener('touchstart', requestOrientationPermission, { once: true });

// Initialize with default values
updateFontVariation(100, 700);