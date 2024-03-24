# Panorama to Cubemap for Multiple Images

Transform 360° panoramic images into cubemaps directly in your browser. This application leverages the Canvas API and Web Workers to efficiently process multiple images simultaneously, ensuring high-quality output through Lanczos interpolation and customizable scene orientation.

**Live Demo:** [Panorama to Cubemap for Multiple Images](https://gejix.github.io/panorama-to-cubemap_multipleImage/)

## Key Features

- **Multiple Image Processing:** Batch convert several 360° panoramas into cubemaps without leaving your web browser.
- **High-Quality Interpolation:** Utilizes Lanczos resampling for superior image quality in the generated cubemap faces.
- **Orientation Control:** Easily adjust the orientation of each cubemap to perfectly align the scene as needed.
- **Efficient Performance:** By utilizing Web Workers, image processing is done in parallel, enhancing the application's performance and responsiveness.
- **Web-Based:** No installation required; run the application directly in your web browser with support for all modern browsers.

## How It Works

1. **Select Images:** Upload your 360° panoramic images. The app supports processing multiple images in one go.
2. **Adjust Settings:** If desired, adjust the cubemap orientation and select the interpolation method for each image.
3. **Generate Cubemaps:** Initiate the conversion process. The app will generate six cube faces for each panorama.
4. **Download Results:** Once processing is complete, download the cubemap faces as a ZIP file, organized by the original image names.

## Using the Application

To use the Panorama to Cubemap for Multiple Images web app, simply navigate to the [live demo](https://gejix.github.io/panorama-to-cubemap_multipleImage/) and follow the on-screen instructions to upload your panoramic images and start the conversion process.

## Technology

This application is built using the following web technologies:

- **HTML5 Canvas API:** For image manipulation and generation of cubemap faces.
- **Web Workers:** To offload the processing workload to background threads, ensuring a smooth UI experience.
- **JSZip:** For packaging and downloading the generated cubemap faces as ZIP files.
- **FileSaver.js:** To facilitate client-side downloading of the ZIP files containing the cubemap images.

## Feedback and Contributions

We welcome your feedback and contributions to the Panorama to Cubemap for Multiple Images project. Feel free to open an issue or pull request on our [GitHub repository]([https://github.com/your-github-repo](https://github.com/Gejix/panorama-to-cubemap_multipleImage]).

---

Enjoy creating cubemaps from your panoramic images directly in your browser!

