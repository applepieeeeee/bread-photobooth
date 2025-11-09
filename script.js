// variables 
const { StrictMode } = require("react");

const VIEWS = {
    START: 'view-start',
    CAPTURE: 'view-capture'
}

const STATE = {
    captured: [],
    videoStream: null,
    isCapturing: false
}

const CANVAS_SIZE = { width: 620, height: 460 };


// elements
const $ = (selector) => document.getElementById(selector);

const startButton = $('startButton');
const captureButton = $('captureButton');
const videoFeed = $('videoFeed');
const countdownOverlay = $('countdownOverlay');
const cameraError = $('cameraError');
const cameraErrorMessage = $('cameraErrorMessage');

// for capturing. 
const tempCanvas = $('tempCanvas');
const tempC = tempCanvas.getContext('2d');

// functions

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

    try{
        // get camera stream
    } catch (e){
        console.error("Error accessing camera: ", e);
    }
}

function captureImage(){
    tempCanvas.width = CANVAS_SIZE.width;
    tempCanvas.height = CANVAS_SIZE.height;
    tempC.drawImage(videoFeed, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
    return tempCanvas.toDataURL('image/png', 0.9);
}