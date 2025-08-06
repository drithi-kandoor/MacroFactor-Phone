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

// Check if device motion/orientation is supported
if (window.DeviceOrientationEvent || window.DeviceMotionEvent) {
    hasOrientationSupport = true;
    console.log('Device motion/orientation is supported');
} else {
    console.log('Device motion/orientation is NOT supported');
}

// Handle device orientation changes with better logging (fallback)
function handleOrientation(event) {
    console.log('Orientation event fired:', event.gamma, event.beta, event.alpha);
    
    const gamma = event.gamma; // Left/Right tilt (-90 to 90)
    const beta = event.beta;   // Front/Back tilt (-180 to 180)
    
    if (gamma !== null && beta !== null) {
        // Map gamma (-45 to 45) to width (100 to 900)
        const width = mapRange(gamma, -45, 45, 100, 900);
        
        // Map beta (-45 to 45) to weight (100 to 900)
        // Clamp beta to reasonable range for better control
        const clampedBeta = Math.max(-45, Math.min(45, beta));
        const weight = mapRange(clampedBeta, -45, 45, 100, 900);
        
        updateFontVariation(width, weight);
        updateDebugInfo(gamma, beta, width, weight);
    } else {
        console.log('Gamma or Beta is null');
    }
}

// Request permission for iOS 13+ and setup listeners
async function requestOrientationPermission() {
    console.log('Requesting motion/orientation permission...');
    
    // Try DeviceMotionEvent first (better for iOS 13+)
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            console.log('DeviceMotion permission state:', permissionState);
            
            if (permissionState === 'granted') {
                orientationPermissionGranted = true;
                window.addEventListener('devicemotion', handleMotion);
                window.addEventListener('deviceorientation', handleOrientation);
                console.log('DeviceMotion permission granted');
                return;
            } else {
                console.log('DeviceMotion permission denied');
            }
        } catch (error) {
            console.error('Error requesting DeviceMotion permission:', error);
        }
    }
    
    // Fallback to DeviceOrientationEvent
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceOrientationEvent.requestPermission();
            console.log('DeviceOrientation permission state:', permissionState);
            
            if (permissionState === 'granted') {
                orientationPermissionGranted = true;
                setupOrientationListener();
                console.log('DeviceOrientation permission granted');
                return;
            } else {
                console.log('DeviceOrientation permission denied');
            }
        } catch (error) {
            console.error('Error requesting DeviceOrientation permission:', error);
        }
    }
    
    // For Android and older iOS, just set up the listeners
    console.log('No permission needed, setting up listeners');
    setupOrientationListener();
    window.addEventListener('devicemotion', handleMotion);
}

// Handle device motion events (better for iOS)
function handleMotion(event) {
    console.log('Motion event fired:', event);
    
    // Use rotationRate for motion-based control
    if (event.rotationRate) {
        const { alpha, beta, gamma } = event.rotationRate;
        console.log('Rotation rates - alpha:', alpha, 'beta:', beta, 'gamma:', gamma);
        
        if (gamma !== null && beta !== null) {
            // Map rotation rates to font variations
            // Clamp values for better control
            const clampedGamma = Math.max(-45, Math.min(45, gamma * 10)); // Scale for sensitivity
            const clampedBeta = Math.max(-45, Math.min(45, beta * 10));
            
            const width = mapRange(clampedGamma, -45, 45, 100, 900);
            const weight = mapRange(clampedBeta, -45, 45, 100, 900);
            
            updateFontVariation(width, weight);
            updateDebugInfo(clampedGamma, clampedBeta, width, weight);
        }
    }
    
    // Fallback to acceleration if rotationRate not available
    if (event.acceleration && !event.rotationRate) {
        const { x, y } = event.acceleration;
        console.log('Acceleration - x:', x, 'y:', y);
        
        if (x !== null && y !== null) {
            const clampedX = Math.max(-10, Math.min(10, x));
            const clampedY = Math.max(-10, Math.min(10, y));
            
            const width = mapRange(clampedX, -10, 10, 100, 900);
            const weight = mapRange(clampedY, -10, 10, 100, 900);
            
            updateFontVariation(width, weight);
            updateDebugInfo(clampedX, clampedY, width, weight);
        }
    }
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
    updateDebugInfo(x / windowWidth * 90 - 45, y / windowHeight * 90 - 45, width, weight);
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

// Toggle debug display (tap/click to show/hide) - only on text element
textElement.addEventListener('click', () => {
    debugElement.style.display = debugElement.style.display === 'none' ? 'block' : 'none';
});

// For mobile devices, request permission on any screen tap/touch
document.addEventListener('touchstart', requestOrientationPermission, { once: true });
document.addEventListener('click', requestOrientationPermission, { once: true });

// Also try to set up orientation listener on page load for Android
window.addEventListener('load', () => {
    console.log('Page loaded, attempting to set up orientation...');
    requestOrientationPermission();
});

// Initialize with default values
updateFontVariation(100, 700);

console.log('Script loaded, hasOrientationSupport:', hasOrientationSupport);