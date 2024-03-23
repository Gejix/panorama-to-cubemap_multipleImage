document.addEventListener('DOMContentLoaded', () => {
    const dom = {
        imageInput: document.getElementById('imageInput'),
        generating: document.getElementById('generating')
    };

    dom.imageInput.addEventListener('change', handleFiles);

    async function handleFiles() {
        const files = Array.from(dom.imageInput.files);
        if (!files.length) return;

        dom.generating.style.visibility = 'visible';
        const zip = new JSZip();

        for (const file of files) {
            // Assume processFile is an async function that handles each file
            await processFile(file, zip);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'cubemaps.zip');
        dom.generating.style.visibility = 'hidden';
    }

    async function processFile(file, zip) {
        // Process each file here
        // This should involve reading the file, generating cube faces,
        // and adding them to the zip
    }
});
