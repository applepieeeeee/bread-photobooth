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
const downloadButton = $('downloadButton');

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
        captureButton.style.opacity = '0.7';
    } else{
        captureButton.style.pointerEvents = 'auto';
        captureButton.style.opacity = '1.0';
    }
}
function showMessage(msg, duration = 3000){
    if (captureMessage){
        captureMessage.textContent = msg;
        setTimeout(() =>{
            captureMessage.textContent = '';
        }, duration);
    }
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
    setCaptureBtnToDisabled(false);
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

        setCaptureBtnToDisabled(false);
        pictureStatus.textContent = `Picture ${STATE.capturedImages.length + 1} of 3`;
        showMessage('camera initialized!');

    } catch (e){
        console.error("Error accessing camera: ", e);

        if (cameraErrorMessage){
            cameraErrorMessage.textContent = `Error: ${e.name || 'Unknown'}. Please update your permissions and reload.`;
        }
        if (cameraError){
            cameraError.style.display = 'flex';
        }

        setCaptureBtnToDisabled(true);
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
    if (!tempC || !videoFeed) return;

    tempC.save();
    tempC.scale(-1,1);
    tempC.drawImage(videoFeed, -CANVAS_SIZE.width, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
    tempC.restore();

    return tempCanvas.toDataURL('image/png', 0.9);
}

function displayResults(){
    if (!photostrip) return;

    photostrip.innerHTML = '';

    STATE.capturedImages.forEach((imgDataUrl) =>{
        const img = document.createElement('img');
        img.src = imgDataUrl.originalDataURL;
        img.className = 'captured-image';
        photostrip.appendChild(img);
    });

    stopCamera();
    switchToView(VIEWS.RESULTS);
}

function downloadPhotostrip(){
    if (STATE.capturedImages.length !== MAX_CAPTURES){
        showMessage("not enough photos :(");
        return;
    }

    const STRIP_WIDTH = CANVAS_SIZE.width;
    const STRIP_HEIGHT = CANVAS_SIZE.height * MAX_CAPTURES;

    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = STRIP_WIDTH;
    stripCanvas.height = STRIP_HEIGHT;
    const stripC = stripCanvas.getContext('2d');

    let imagesLoadedCount = 0;

    STATE.capturedImages.forEach((imageObj, index) => {
        const img = new Image();

        img.onload = () =>{
            stripC.save();
            stripC.scale(-1,1);

            stripC.drawImage(img, -STRIP_WIDTH, index * CANVAS_SIZE.height, STRIP_WIDTH, CANVAS_SIZE.height);
            stripC.restore();

            imagesLoadedCount++;

            if (imagesLoadedCount === MAX_CAPTURES){
                const link = document.createElement('a');
                link.download = 'bread_photobooth_strip.png';
                link.href = stripCanvas.toDataURL('image/png');

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        }
        img.src = imageObj.originalDataURL;
    });
}

function startCaptureSequence(){
    if (STATE.isCapturing || STATE.capturedImages.length >= 3){
        return;
    }

/*
        countdown + capture logics
*/
    STATE.isCapturing = true;
    setCaptureBtnToDisabled(true);

    countdownOverlay.style.display = 'flex';

    let count = 3;
    countdownText.textContent = count;

    const interval = setInterval(() => {
        count--;

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
                    showMessage('all photos taken!');
                    displayResults();
                }, 500);

            } else {
                setTimeout(() => {
                    countdownOverlay.style.display = 'none';
                    setCaptureBtnToDisabled(false);
                    STATE.isCapturing = false;
                    showMessage('ready for next photo!');
                }, 1000);
            }
        }
    }, 1000);
}


// event listeners

if (startButton){
    startButton.addEventListener('click', async() => {
        STATE.capturedImages = []; // reset 
        switchToView(VIEWS.CAPTURE);
        await initCamera();
    });
}

if (captureButton){
    captureButton.addEventListener('click', startCaptureSequence);
}

if (downloadButton){
    downloadButton.addEventListener('click', downloadPhotostrip);
}

if (restartButton){
    restartButton.addEventListener('click', () => {
        STATE.capturedImages = [];
        pictureStatus.textContent = `Picture 0 of ${MAX_CAPTURES}`;
        switchToView(VIEWS.START);
    })
}

window.onload = () => {
    switchToView(VIEWS.START);
};