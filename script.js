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
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.style.display = 'none';
    });

    const target = document.getElementById(viewName);
    if (target){
        target.style.display = 'flex'
    }

    if (viewId !== VIEWS.CAPTURE && STATE.videoStream){
        STATE.videoStream.getTracks().forEach(track => track.stop());
        STATE.videoStream = null;
        if(videoFeed) videoFeed.srcObject = null;
    }
}

async function initCamera(){
    if (!videoFeed) return;

    try{
        if(cameraError) cameraError.style.display = 'none';
        setCaptureBtnToDisabled(true);

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: CANVAS_SIZE.width,
                height: CANVAS_SIZE.height
            }
        });

        STATE.videoStream = stream;
        videoFeed.srcObject = stream;
        videoFeed.onplay();

        videoFeed.onloadedmetadata = () =>{
            if (pictureStatus) pictureStatus.textContent = `Picture 0 of ${MAX_CAPTURES}`;
            setCaptureBtnToDisabled(false);
        };
    } catch(err){
        console.error("camera access denied or failed: ", err);
        if (cameraErrorMessage) cameraErrorMessage.textContent = err.name || "Unknown Error";
        if (cameraError) cameraError.style.display = 'flex';
        setCaptureBtnToDisabled(true);
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
    switchToView(VIEWS.RESULTS);
    if (photstrip) photostrip.innerHTML = '';

    STATE.capturedImages.forEach(img => {
        const imgElement = document.createElement('img');
        imgElement.src = img.originalDataURL;
        imgElement.className = 'captured-image';
        if (photostrip) photostrip.appendChild(imgElement);
    });
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