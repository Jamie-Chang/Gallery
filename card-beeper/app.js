const globalAudio = new Audio(); // Global audio instance to unlock mobile autoplay

// Helper function
function showMessage(element, text, type, autoHide = true) {
    element.textContent = text;
    element.className = `message ${type}`;
    if (autoHide) {
        setTimeout(() => {
            if(element.textContent === text) {
                element.textContent = '';
                element.className = 'message';
            }
        }, 3000);
    }
}

// Function to update the select box based on a card ID
function updateSoundSelectForCard(cardId) {
    const soundSelect = document.getElementById('soundSelect');
    if (!cardId) {
        soundSelect.value = "";
        return;
    }
    
    let mappings = JSON.parse(localStorage.getItem('cardSounds')) || {};
    const mappedSound = mappings[cardId.toLowerCase()];
    
    if (mappedSound) {
        soundSelect.value = mappedSound;
    } else {
        soundSelect.value = "";
    }
}

function initApp() {
    const cardIdInput = document.getElementById('cardIdInput');
    const soundSelect = document.getElementById('soundSelect');
    const saveBtn = document.getElementById('saveMappingBtn');
    const testScanBtn = document.getElementById('testScanBtn');
    const saveMessageEl = document.getElementById('saveMessage');
    const scanMessageEl = document.getElementById('scanMessage');
    
    // When the user manually types a card ID, update the select
    cardIdInput.addEventListener('input', (e) => {
        updateSoundSelectForCard(e.target.value.trim());
    });
    
    // Save mapping
    saveBtn.addEventListener('click', () => {
        const cardId = cardIdInput.value.trim().toLowerCase();
        const selectedSoundUrl = soundSelect.value;

        if (!cardId) {
            showMessage(saveMessageEl, "Oops! Please enter or scan a Card ID first.", "error");
            return;
        }

        let mappings = JSON.parse(localStorage.getItem('cardSounds')) || {};
        
        if (selectedSoundUrl === "") {
            delete mappings[cardId];
            showMessage(saveMessageEl, "🗑️ Mapping removed!", "success");
        } else {
            mappings[cardId] = selectedSoundUrl;
            showMessage(saveMessageEl, "✨ Magic Link Saved!", "success");
        }
        
        localStorage.setItem('cardSounds', JSON.stringify(mappings));
    });

    // Test Sound
    testScanBtn.addEventListener('click', () => {
        const cardId = cardIdInput.value.trim().toLowerCase();
        let mappings = JSON.parse(localStorage.getItem('cardSounds')) || {};
        
        if (cardId && mappings[cardId]) {
            const soundUrl = mappings[cardId];
            playSound(soundUrl);
            showMessage(scanMessageEl, "🎵 Playing magic sound!", "success");
        } else {
            showMessage(scanMessageEl, "🤔 No sound assigned to this card.", "error");
        }
    });

    function playSound(url) {
        globalAudio.src = url;
        globalAudio.play().catch(e => {
            console.error("Audio playback error:", e);
            alert("Could not play sound. Please interact with the page first.");
        });
    }
    
    // Initialize NFC
    initNFCScanner();
}

function initNFCScanner() {
    const scanBtn = document.getElementById('nfcScanBtn');
    const statusEl = document.getElementById('nfcStatus');
    const cardIdInput = document.getElementById('cardIdInput');
    
    let ndef = null;

    scanBtn.addEventListener('click', async () => {
        if (!('NDEFReader' in window)) {
            showMessage(statusEl, "Web NFC is not supported on this browser/device.", "error");
            return;
        }

        // Trick mobile browsers into unlocking audio context by playing silence on user gesture
        globalAudio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
        globalAudio.play().catch(() => {});

        try {
            if (!ndef) {
                ndef = new NDEFReader();
                
                ndef.addEventListener("reading", ({ serialNumber }) => {
                    const normalizedSerial = serialNumber ? serialNumber.trim().toLowerCase() : "";
                    
                    if (normalizedSerial) {
                        cardIdInput.value = normalizedSerial;
                        updateSoundSelectForCard(normalizedSerial);
                        
                        let mappings = JSON.parse(localStorage.getItem('cardSounds')) || {};
                        if (mappings[normalizedSerial]) {
                            globalAudio.src = mappings[normalizedSerial];
                            globalAudio.play().catch(e => console.error("Audio playback error:", e));
                            showMessage(statusEl, "🎶 Scanned & Played!", "success");
                        } else {
                            showMessage(statusEl, "✅ Tag read! Assign a sound below.", "success");
                        }
                    }
                });

                ndef.addEventListener("readingerror", () => {
                    showMessage(statusEl, "⚠️ Error reading tag. Try again.", "error");
                });
            }

            await ndef.scan();
            showMessage(statusEl, "Scanning... Tap an NFC tag.", "success", false);
            scanBtn.innerText = "📡 Scanning Active...";
            scanBtn.classList.add('scanning');
            scanBtn.disabled = true;

        } catch (error) {
            showMessage(statusEl, `Failed to start scan: ${error.message}`, "error");
            scanBtn.innerText = "📡 Start NFC Scan";
            scanBtn.classList.remove('scanning');
            scanBtn.disabled = false;
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
