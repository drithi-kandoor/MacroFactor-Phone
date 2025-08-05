const textElement = document.getElementById('text');
const debugElement = document.getElementById('debug');
const gammaValueElement = document.getElementById('gammaValue');
const betaValueElement = document.getElementById('betaValue');
const widthValueElement = document.getElementById('widthValue');
const weightValueElement = document.getElementById('weightValue');

let hasOrientationSupport = false;
let orientationPermissionGranted = false;

// Show debug by default to help troubleshoot
debugElement.style.display = 'block';

// Check if device orientation is supported
if (window.DeviceOrientationEvent) {
    hasOrientationSupport = true;
    console.log('DeviceOrientationEvent is supported');
} else {
    console.log('DeviceOrientationEvent is NOT supported');
}

// Add better error handling and logging
function setupOrientationListener() {
    if (hasOrientationSupport) {
        window.addEventListener('deviceorientation', handleOrientation);
        console.log('Added deviceorientation listener');
        
        // Test if we're getting events after a delay
        setTimeout(() => {
            console.log('Checking if orientation events are firing...');
        }, 2000);
    }
}

// Fallback for desktop or when orientation doesn't work
document.addEventListener('mousemove', handleMouseMove);

// Request permission for iOS 13+ and setup listeners
async function requestOrientationPermission() {
    console.log('Requesting orientation permission...');
    
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceOrientationEvent.requestPermission();
            console.log('Permission state:', permissionState);
            
            if (permissionState === 'granted') {
                orientationPermissionGranted = true;
                setupOrientationListener();
                console.log('Orientation permission granted');
            } else {
                console.log('Orientation permission denied');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
        }
    } else {
        // For Android and older iOS, just set up the listener
        console.log('No permission needed, setting up listener');
        setupOrientationListener();
    }
}

// Handle device orientation changes with better logging
function handleOrientation(event) {
    console.log('Orientation event fired:', event.gamma, event.beta, event.alpha);
    
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
    } else {
        console.log('Gamma or Beta is null');
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

// For mobile devices, request permission on user interaction
textElement.addEventListener('touchstart', requestOrientationPermission, { once: true });
textElement.addEventListener('click', requestOrientationPermission, { once: true });

// Also try to set up orientation listener on page load for Android
window.addEventListener('load', () => {
    console.log('Page loaded, attempting to set up orientation...');
    requestOrientationPermission();
});

// Initialize with default values
updateFontVariation(100, 700);

console.log('Script loaded, hasOrientationSupport:', hasOrientationSupport);