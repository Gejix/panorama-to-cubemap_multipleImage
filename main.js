const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
let zip = new JSZip(); // Initialize JSZip

class RadioInput {
  constructor(name, onChange) {
    this.inputs = document.querySelectorAll(`input[name=${name}]`);
    for (let input of this.inputs) {
      input.addEventListener('change', onChange);
    }
  }

  get value() {
    for (let input of this.inputs) {
      if (input.checked) {
        return input.value;
      }
    }
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

    this.anchor = document.createElement('a');
    this.anchor.style.position='absolute';
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

  // Modified setDownload to add images to the zip file
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
    canvas.toBlob(blob => resolve(blob), mimeType[extension], 0.92);
  });
}

const dom = {
  imageInput: document.getElementById('imageInput'),
  faces: document.getElementById('faces'),
  generating: document.getElementById('generating')
};

dom.imageInput.addEventListener('change', loadImage);

const settings = {
  cubeRotation: new Input('cubeRotation', loadImage),
  interpolation: new RadioInput('interpolation', loadImage),
  format: new RadioInput('format', loadImage),
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

function processImage(data) {
  zip = new JSZip(); // Reset JSZip for new processing
  removeChildren(dom.faces);
  dom.generating.style.visibility = 'visible';

  for (let worker of workers) {
    worker.terminate();
  }

  workers = [];
  for (let [faceName, position] of Object.entries(facePositions)) {
    renderFace(data, faceName, position);
  }
}

function renderFace(data, faceName, position) {
  const face = new CubeFace(faceName);
  dom.faces.appendChild(face.anchor);

  const options = {
    data: data,
    face: faceName,
    rotation: Math.PI * settings.cubeRotation.value / 180,
    interpolation: settings.interpolation.value,
  };

  const worker = new Worker('convert.js');
  workers.push(worker);

  worker.onmessage = ({data: imageData}) => {
    const extension = settings.format.value;

    getDataBlob(imageData, extension)
      .then(blob => {
        face.addToZip(blob, extension);
        finished++;

        if (finished === Object.keys(facePositions).length) {
          dom.generating.style.visibility = 'hidden';
          finished = 0;
          zip.generateAsync({type:"blob"})
            .then(function(content) {
              saveAs(content, "cubemap.zip");
            });
        }
      });
  };

  worker.postMessage(options);
}
