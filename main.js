document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    imageInput.addEventListener('change', handleFiles);

    async function handleFiles() {
        const files = Array.from(imageInput.files);
        const zip = new JSZip();
        const worker = new Worker('convert.js');

        let processedCount = 0;
        const totalFaces = files.length * 6; // Assuming 6 faces per cube map

        worker.onmessage = function(event) {
            const { processedData, face, originalName } = event.data;
            // Add processed data to zip
            zip.file(`${originalName}_${face}.png`, processedData, {binary: true});

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
                const imageData = e.target.result;
                const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
                faces.forEach(face => {
                    worker.postMessage({
                        imageData: imageData,
                        face: face,
                        originalName: file.name.split('.')[0], // Assuming file name has a single dot for extension
                        operation: 'processFace'
                    });
                });
            };
            reader.readAsDataURL(file); // Or readAsArrayBuffer if processing binary data in worker
        });
    }
});
