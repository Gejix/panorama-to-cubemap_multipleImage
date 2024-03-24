const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
//const ctx = canvas.getContext('2d');
let zip = new JSZip(); // Initialize a new JSZip instance

class RadioInput {
    constructor(name, onChange) {
        this.inputs = document.querySelectorAll(`input[name=${name}]`);
        this.inputs.forEach(input => input.addEventListener('change', onChange));
    }

    get value() {
        const selected = Array.from(this.inputs).find(input => input.checked);
        return selected ? selected.value : null;
    }
}

class Input {
    constructor(id, onChange) {
        this.input = document.getElementById(id);
        this.input.addEventListener('change', onChange);
        this.valueAttrib = this.input.type === 'checkbox' ? 'checked' : 'value';
    }

    get value() {
        return this.input[this.valueAttrib];
    }
}

class CubeFace {
    constructor(faceName) {
        this.faceName = faceName;
        this.anchor = document.createElement('div'); // Use div for display
        this.anchor.style.position = 'absolute';
        this.anchor.title = faceName;
        this.img = document.createElement('img');
        this.img.style.filter = 'blur(4px)';
        this.anchor.appendChild(this.img);
    }

    setPreview(url, x, y) {
        this.img.src = url;
        this.anchor.style.left = `${x}px`;
        this.anchor.style.top = `${y}px`;
    }

    addToZip(blob, fileExtension, folderName) {
        zip.file(`${folderName}/${this.faceName}.${fileExtension}`, blob);
    }
}

const mimeType = {
    'jpg': 'image/jpeg',
    'png': 'image/png'
};

function getDataBlob(imgData, extension) {
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    ctx.putImageData(imgData, 0, 0);
    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), mimeType[extension]);
    });
}

const dom = {
    imageInput: document.getElementById('imageInput'),
    faces: document.getElementById('faces'),
    generating: document.getElementById('generating')
};

const settings = {
    cubeRotation: new Input('cubeRotation', loadImages),
    interpolation: new RadioInput('interpolation', loadImages),
    format: new RadioInput('format', loadImages),
};

const facePositions = {
    pz: {x: 1, y: 1},
    nz: {x: 3, y: 1},
    px: {x: 2, y: 1},
    nx: {x: 0, y: 1},
    py: {x: 1, y: 0},
    ny: {x: 1, y: 2}
};

let workers = [];

function loadImages() {
    const files = dom.imageInput.files;
    if (files.length === 0) return;
    removeChildren(dom.faces);
    zip = new JSZip(); // Reset the JSZip instance for new input
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, img.width, img.height);
                processImage(imgData, `image${index + 1}`);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function processImage(imgData, folderName) {
    Object.entries(facePositions).forEach(([faceName, position]) => {
        const face = new CubeFace(faceName);
        dom.faces.appendChild(face.anchor); // Optionally display processed faces
        renderFace(imgData, face, position, folderName);
    });
}

function renderFace(data, face, position, folderName) {
    const options = {
        data: data,
        face: face.faceName,
        rotation: Math.PI * settings.cubeRotation.value / 180,
        interpolation: settings.interpolation.value,
    };

    const worker = new Worker('convert.js');
    workers.push(worker);

    worker.onmessage = ({data: imageData}) => {
        const extension = settings.format.value;
        getDataBlob(imageData, extension).then(blob => {
            face.addToZip(blob, extension, folderName);

            // Once all faces for a panorama are added, we could think about when to generate the ZIP.
            // However, since we're processing multiple panoramas, we need a global way to know when all are done.
            // This example doesn't fully implement tracking of completion across multiple panoramas,
            // but you would typically check here if all expected work is done before generating the ZIP.
        });
    };
    worker.postMessage(options);
}

function removeChildren(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

// Add event listener for file input changes
dom.imageInput.addEventListener('change', loadImages);

// Generate ZIP after all images are processed (this part needs to be integrated into your workflow, after confirming all workers have finished their tasks)
function generateAndDownloadZip() {
    if (workers.every(worker => worker.state === 'terminated')) { // Assuming a 'state' property tracks the worker's state; you need to implement this.
        dom.generating.style.visibility = 'hidden'; // Hide generating indicator
        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                // Use FileSaver.js or a similar library to save the ZIP file
                saveAs(content, "cubemap_images.zip"); // Make sure you've included FileSaver.js
            });
    }
}

// Note: This example assumes you might add a 'state' property to workers to track their status,
// and a mechanism to call `generateAndDownloadZip` when appropriate.
// In practice, you might count finished workers and compare against total expected tasks,
// or use another method to determine when all asynchronous work is completed.

