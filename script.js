// variables 

const VIEWS = {
    START: 'view-start',
    CAPTURE: 'view-capture'
}

const STATE = {
    captured: [],
    videoStream: null,
    isCapturing: false
}

const CANVAS_SIZE = { width: 600, height: 450 };

// elements
const $ = (selector) => document.getElementById(selector);

const startButton = $('startButton');
const CaptureButton = $('captureButton');

// functions

function switchToView(viewName){

}

async function initCamera(){
    captureButton.disabled = true;

    try{
        // get camera stream
    } catch (err){
        console.error("Error accessing camera: ", err);
    }
}