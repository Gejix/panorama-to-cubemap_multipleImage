document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    imageInput.addEventListener('change', handleFiles);

    async function handleFiles() {
        const files = Array.from(imageInput.files);
        const zip = new JSZip();
        let processedCount = 0;
        const facesPerImage = 6; // Assuming each image will generate 6 faces
        const totalFaces = files.length * facesPerImage;

        files.forEach(file => {
            processFile(file, zip).then(() => {
                processedCount += facesPerImage;
                if (processedCount === totalFaces) {
                    zip.generateAsync({type: 'blob'}).then(content => {
                        saveAs(content, "cubemaps.zip");
                    });
                }
            });
        });
    }

    function processFile(file, zip) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                const worker = new Worker('convert.js');
                let facesProcessed = 0;

                worker.onmessage = function(event) {
                    const { faceData, faceName } = event.data;
                    zip.file(`${file.name}_${faceName}.jpg`, faceData, {binary: true});
                    facesProcessed++;
                    if (facesProcessed === 6) {
                        worker.terminate();
                        resolve();
                    }
                };

                worker.onerror = function(error) {
                    console.error("Worker error:", error);
                    reject(error);
                };

                // Send image data to the worker for processing
                // Note: Adjust the message format as needed based on your convert.js
                const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
                faces.forEach(face => {
                    worker.postMessage({ imageData, face });
                });
            };
            reader.readAsDataURL(file); // Consider using readAsArrayBuffer if needed
        });
    }
});
