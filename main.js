document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const processImagesButton = document.getElementById('processImages');

    processImagesButton.addEventListener('click', async () => {
        const files = imageInput.files;
        if (files.length === 0) {
            alert('Please select at least one image.');
            return;
        }

        const zip = new JSZip();
        for (const file of files) {
            // Process each file (this function needs to be implemented)
            const cubeFaces = await processFile(file); // Returns an array of {name, blob}
            cubeFaces.forEach(face => {
                zip.file(face.name, face.blob);
            });
        }

        const zipBlob = await zip.generateAsync({type: 'blob'});
        saveAs(zipBlob, 'cubemaps.zip');
    });
});

async function processFile(file) {
    // Placeholder: Implement the logic to generate cube faces for the file
    // This will likely involve drawing the image to a canvas, processing it,
    // and then extracting the faces as separate images.
    return []; // Should return an array of objects like { name: 'imageName_face.png', blob: Blob }
}

const worker = new Worker('convert.js');
worker.postMessage({ imageData: 'yourImageData', settings: 'yourSettings' });

worker.onmessage = (e) => {
    console.log(e.data.result); // Handle the processed data
};

