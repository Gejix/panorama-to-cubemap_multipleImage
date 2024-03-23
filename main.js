const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
let zip = new JSZip(); // Initialize JSZip instance at the start of the script

class RadioInput {
  constructor(name, onChange) {
    this.inputs = document.querySelectorAll(`input[name=${name}]`);
    this.inputs.forEach(input => {
      input.addEventListener('change', onChange);
    });
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
    this.anchor = document.createElement('div'); // Changed to div for in-document display
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

  addToZip(blob, fileExtension) {
    zip.file(`${this.faceName}.${fileExtension}`, blob);
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
  cubeRotation: new Input('cubeRotation', () => processImage()),
  interpolation: new RadioInput('interpolation', () => processImage()),
  format: new RadioInput('format', () => processImage()),
};

const facePositions = {
  pz: {x: 1, y: 1},
  nz: {x: 3, y: 1},
  px: {x: 2, y: 1},
  nx: {x: 0, y: 1},
  py: {x: 1, y: 0},
  ny: {x: 1, y: 2}
};

let finished = 0;
let workers = [];
let imgData = null; // Store the image data globally after loading

function loadImage() {
  const file = dom.imageInput.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    imgData = ctx.getImageData(0, 0, img.width, img.height);
    processImage();
  };
  img.src = URL.createObjectURL(file);
}

dom.imageInput.addEventListener('change', loadImage);

function processImage() {
  if (!imgData) return; // Do not proceed if imgData is not set

  removeChildren(dom.faces);
  dom.generating.style.visibility = 'visible';
  zip = new JSZip(); // Reset the JSZip instance
  finished = 0; // Reset finished counter
  workers.forEach(worker => worker.terminate()); // Terminate any existing workers
  workers = []; // Reset the workers array

  Object.entries(facePositions).forEach(([faceName, position]) => {
    const face = new CubeFace(faceName);
    dom.faces.appendChild(face.anchor);
    renderFace(imgData, face, position);
  });
}

function renderFace(data, face, position) {
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
      face.addToZip(blob, extension);
      finished++;

  if (finished === Object.keys(facePositions).length) {
    // All faces have been processed and added to the zip
    dom.generating.style.visibility = 'hidden';

    zip.generateAsync({ type: "blob" })
      .then(function(content) {
        // Use FileSaver.js or a similar method to save the ZIP file
        saveAs(content, "cubemap_images.zip");
        // Reset for the next use
        finished = 0;
        workers.forEach(worker => worker.terminate());
        workers = [];
      });
  }
});
};

worker.postMessage(options);
}

function removeChildren(node) {
while (node.firstChild) {
node.removeChild(node.firstChild);
}
}
