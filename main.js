document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    imageInput.addEventListener('change', handleFiles);

    async function handleFiles() {
        const files = Array.from(imageInput.files);
        const zip = new JSZip();
        let processedCount = 0;
        const totalFaces = files.length * 6; // Assuming 6 faces per cube map

        const worker = new Worker('convert.js');
        worker.onmessage = function(event) {
            const { processedData, face, originalName, operation } = event.data;
            console.log(processedData); // For debugging

            // Add processed data to zip. Assuming processedData is a Blob or similar.
            // Note: The typo 'jpeng' corrected to 'jpeg'
            zip.file(`${originalName}_${face}.jpeg`, processedData, {binary: true});

            processedCount++;
            if (processedCount === totalFaces) {
                // All faces processed, generate zip
                zip.generateAsync({type: 'blob'}).then(function(content) {
                    saveAs(content, "cubemaps.zip");
                });
            }
        };

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Assuming the reader reads as DataURL. You might need to adjust based on your processing logic.
                const imageData = e.target.result;
                const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
                faces.forEach(face => {
                    worker.postMessage({
                        imageData: imageData,
                        rotation:0,
                        face: face,
                        interpolation: 'copyPixelLanczos',
                        originalName: file.name.split('.')[0],
                        operation: 'processFace',
                        maxWidth: 1024
                    });
                });
            };
            reader.readAsDataURL(file); // Consider readAsArrayBuffer if your worker expects binary data
        });
    }
});
