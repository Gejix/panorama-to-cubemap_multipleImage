document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const processBtn = document.getElementById('processBtn');
    const generating = document.getElementById('generating'); // Assuming this is your loading indicator

    processBtn.addEventListener('click', async () => {
        const files = imageInput.files;
        if (files.length === 0) {
            alert("Please select at least one image.");
            return;
        }

        generating.style.visibility = 'visible'; // Show loading indicator

        const zip = new JSZip();
        let processedCount = 0;

        for (const file of files) {
            const worker = new Worker('convert.js');
            worker.onmessage = async (e) => {
                // Assuming e.data is the processed ImageData for a single face
                const blob = await getDataURL(e.data, 'png'); // Or 'jpg', based on your settings
                const baseName = file.name.split('.').slice(0, -1).join('.');
                // Example: adding "_top" for demonstration, adjust based on actual face logic
                zip.file(`${baseName}_top.png`, blob);

                processedCount++;
                if (processedCount === files.length * 6) { // Assuming 6 faces per image
                    const content = await zip.generateAsync({ type: 'blob' });
                    saveAs(content, 'cubemaps.zip');
                    generating.style.visibility = 'hidden'; // Hide loading indicator
                }
            };

            // Example: Sending the file for processing, adjust based on your actual data needs
            const imageData = await fileToImageData(file);
            worker.postMessage({ imageData: imageData, settings: { /* Your settings here */ } });
        }
    });
});

async function fileToImageData(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, img.width, img.height));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

async function getDataURL(imgData, extension) {
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  ctx.putImageData(imgData, 0, 0);
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), mimeType[extension], 0.92);
  });
}
