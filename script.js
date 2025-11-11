// variables 
const VIEWS = {
    START: 'view-start',
    CAPTURE: 'view-capture',
    RESULTS: 'view-results'
}

const STATE = {
    capturedImages: [],
    videoStream: null,
    isCapturing: false
}

const CANVAS_SIZE = { width: 620, height: 460 };
const MAX_CAPTURES = 3;


// elements
const $ = (selector) => document.getElementById(selector);

const startButton = $('startButton');
const captureButton = $('captureButton');
const restartButton = $('restartButton');
const videoFeed = $('videoFeed');

const countdownOverlay = $('countdownOverlay');
const countdownText = $('countdownText');

const cameraError = $('cameraError');
const cameraErrorMessage = $('cameraErrorMessage');

const pictureStatus = $('pictureStatus');
const photostrip = $('photostrip');

const captureMessage = $('captureMessage');

// for capturing. 
const tempCanvas = $('tempCanvas');
const tempC = tempCanvas.getContext('2d');

if (tempCanvas){
    tempCanvas.width = CANVAS_SIZE.width;
    tempCanvas.height = CANVAS_SIZE.height;
}

// functions

function setCaptureBtnToDisabled(isDisabled){
    captureButton.disabled = isDisabled;

    if(isDisabled){
        captureButton.style.pointerEvents = 'none';
        captureButton.style.opacity = '0.5';
    }{
        captureButton.style.pointerEvents = 'auto';
        captureButton.style.opacity = '1.0';
    }
}
function showMessage(msg){
    if (!captureMessage) return;

    captureMessage.textContent = msg;
    setTimeout(() =>{
        captureMessage.textContent = ''; 
    }, 3000);
}

function switchToView(viewName){
    Object.values(VIEWS).forEach(id =>{
        const view = $(id);
        if(view){
            view.style.display = 'none';
        }
    });

    const target = $(viewName);
    if (target){
        target.style.display = 'flex';
        target.style.flexDirection = 'column';
        target.style.alignItems = 'center';
        target.style.justifyContent = 'center';
    }
}

async function initCamera(){
    captureButton.disabled = true;
    cameraError.style.display = 'none';

    try{
        // get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
            },
            audio: false
        });

        STATE.videoStream = stream;
        videoFeed.srcObject = stream;

        await new Promise((resolve, reject) => {
            videoFeed.onloadedmetadata = () => {
                videoFeed.play().then(resolve).catch(reject);
            };
            videoFeed.onerror = reject;
        });

        captureButton.disabled = false;
        pictureStatus.textContent = 'Picture 0 of 3';
        showMessage('camera initialized!');

    } catch (e){
        console.error("Error accessing camera: ", e);

        cameraErrorMessage.textContent = `Error: ${e.name || 'Unknown'}. Please update your camera permissions and reload.`;
        cameraError.style.display = 'flex';

        captureButton.disabled = true;
        showMessage('failed to access camera.');
    }
}

function stopCamera(){
    if (STATE.videoStream){
        STATE.videoStream.getTracks().forEach(track => track.stop());
        STATE.videoStream = null;
    }
}

function captureImage(){
    tempC.save();
    tempC.scale(-1,1);
    tempC.drawImage(videoFeed, -CANVAS_SIZE.width, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
    tempC.restore();

    return tempCanvas.toDataURL('image/png', 0.9);
}

function displayResults(){
    photostrip.innerHTML = '';
    STATE.capturedImages.forEach((imgDataUrl) =>{
        const img = document.createElement('img');
        img.src = imgDataUrl.originalDataURL;
        img.className = 'captured-image';
        photostrip.appendChild(img);
    });
    switchToView(VIEWS.RESULTS);
}

function startCaptureSequence(){
    if (STATE.isCapturing || STATE.capturedImages.length >= 3){
        return;
    }

/*
        countdown + capture logics
*/
    STATE.isCapturing = true;
    captureButton.disabled = true;

    countdownOverlay.style.display = 'flex';

    let count = 3;
    countdownText.textContent = count;

    const interval = setInterval(() => {
        if(count > 0){
            countdownText.textContent = count;
        } else if (count === 0){
            countdownText.textContent = 'cheese!';

            const dataURL = captureImage();
            STATE.capturedImages.push( { originalDataURL: dataURL });

            const currentCount = STATE.capturedImages.length;
            pictureStatus.textContent = `Picture ${currentCount} of 3`;

            clearInterval(interval);

            if(currentCount >= 3){

                setTimeout(() => {
                    countdownOverlay.style.display = 'none';
                    STATE.isCapturing = false;

                    stopCamera();
                    console.log('done!');
                    showMessage('all photos taken!');
                    displayResults();

                }, 500);
            } else {
                setTimeout(() => {
                    countdownOverlay.style.display = 'none';
                    captureButton.disabled = false;
                    STATE.isCapturing = false;
                    showMessage('ready for next photo!');
                }, 1000);
            }
        }
    }, 1000);
}

startButton.addEventListener('click', async() => {
    STATE.capturedImages = []; // reset 
    switchToView(VIEWS.CAPTURE);
    await initCamera();
});

captureButton.addEventListener('click', startCaptureSequence);

restartButton.addEventListener('click', () => {
    STATE.capturedImages = [];
    pictureStatus.textContent = `Picture 0 of ${MAX_CAPTURES}`;
    switchToView(VIEWS.START);
})

window.onload = () => {
    switchToView(VIEWS.START);
};