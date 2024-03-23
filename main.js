document.getElementById('processImages').addEventListener('click', () => {
    const files = document.getElementById('imageInput').files;
    const zip = new JSZip();
    const worker = new Worker('convert.js');
    let count = files.length;

    worker.onmessage = (e) => {
        const { name, processedBlob } = e.data;
        zip.file(name, processedBlob);

        count--;
        if (count === 0) {
            zip.generateAsync({ type: 'blob' }).then((content) => {
                saveAs(content, 'cubemaps.zip');
            });
        }
    };

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            worker.postMessage({ name: file.name, imageDataUrl: e.target.result });
        };
        reader.readAsDataURL(file);
    });
});
