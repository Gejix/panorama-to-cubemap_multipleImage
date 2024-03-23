// Utility functions
function clamp(x, min, max) {
  return Math.min(max, Math.max(x, min));
}

function mod(x, n) {
  return ((x % n) + n) % n;
}

function lanczosKernel(x, a) {
    if (x === 0) return 1;
    if (x < -a || x > a) return 0;
    const piX = Math.PI * x;
    return a * Math.sin(piX) * Math.sin(piX / a) / (piX * piX);
}


function kernelResample(read, write, filterSize, kernel) {
    const {width, height, data} = read;
    const readIndex = (x, y) => 4 * (y * width + x);
    const a = filterSize; // Lanczos parameter, typically the same as filterSize for simplicity

    for (let y = 0; y < write.height; y++) {
        for (let x = 0; x < write.width; x++) {
            const to = 4 * (y * write.width + x);
            let r = 0, g = 0, b = 0, a = 0;

            for (let ky = -filterSize; ky <= filterSize; ky++) {
                for (let kx = -filterSize; kx <= filterSize; kx++) {
                    const sampleX = clamp(Math.round(x + kx), 0, width - 1);
                    const sampleY = clamp(Math.round(y + ky), 0, height - 1);
                    const weight = lanczosKernel(Math.sqrt(kx * kx + ky * ky), filterSize);

                    const index = readIndex(sampleX, sampleY);
                    r += data[index] * weight;
                    g += data[index + 1] * weight;
                    b += data[index + 2] * weight;
                    a += data[index + 3] * weight;
                }
            }

            write.data[to] = clamp(Math.round(r), 0, 255);
            write.data[to + 1] = clamp(Math.round(g), 0, 255);
            write.data[to + 2] = clamp(Math.round(b), 0, 255);
            write.data[to + 3] = clamp(Math.round(a), 0, 255);
        }
    }
}


function copyPixelLanczos(read, write) {
    const filterSize = 3; // Or another appropriate value
    kernelResample(read, write, filterSize, (x) => lanczosKernel(x, filterSize));
}

const orientations = {
  pz: (out, x, y) => {
    out.x = -1;
    out.y = -x;
    out.z = -y;
  },
  nz: (out, x, y) => {
    out.x = 1;
    out.y = x;
    out.z = -y;
  },
  px: (out, x, y) => {
    out.x = x;
    out.y = -1;
    out.z = -y;
  },
  nx: (out, x, y) => {
    out.x = -x;
    out.y = 1;
    out.z = -y;
  },
  py: (out, x, y) => {
    out.x = -y;
    out.y = -x;
    out.z = 1;
  },
  ny: (out, x, y) => {
    out.x = y;
    out.y = -x;
    out.z = -1;
  }
};

// Main function to render a face of the cube
function renderFace({imageData, face, rotation, interpolation, originalName, maxWidth}) {

  maxWidth = maxWidth || 1024; // Define maxWidth directly if it's constant
  const readData = imageData;
  const faceWidth = Math.min(maxWidth, readData.width / 4) || 1;
  const faceHeight = faceWidth;
  const cube = {};
  const orientation = orientations[face];

  const writeData = new ImageData(faceWidth, faceHeight);

  console.log(`faceWidth: ${faceWidth}, faceHeight: ${faceHeight}`);

    // Select the appropriate pixel copying function based on interpolation method
    const copyPixel = {
        'lanczos': copyPixelLanczos,
    }[interpolation](readData, writeData);

    // Process each pixel for the specified face
    for (let x = 0; x < faceWidth; x++) {
        for (let y = 0; y < faceHeight; y++) {
            const to = 4 * (y * faceWidth + x);
            writeData.data[to + 3] = 255; // Fill alpha channel
            orientation(cube, (2 * (x + 0.5) / faceWidth - 1), (2 * (y + 0.5) / faceHeight - 1));
            const r = Math.sqrt(cube.x * cube.x + cube.y * cube.y + cube.z * cube.z);
            const lon = mod(Math.atan2(cube.y, cube.x) + rotation, 2 * Math.PI);
            const lat = Math.acos(cube.z / r);
            copyPixel(readData.width * lon / Math.PI / 2 - 0.5, readData.height * lat / Math.PI - 0.5, to);
        }
    }
  
    // After processing, construct the response object
    const processedData = `Simulated processed data for ${face} of ${originalName}`;
    self.postMessage({ processedData, face, originalName });
}

// Event listener for messages from the main thread
self.addEventListener('message', (event) => {
    const { imageData, face, rotation, interpolation, originalName, maxWidth} = event.data;
    console.log(`Received request to process face ${face} for ${originalName} with rotation ${rotation}`);

    // Call renderFace with all necessary parameters
    renderFace({ imageData, face, rotation, interpolation, originalName, maxWidth});
});


