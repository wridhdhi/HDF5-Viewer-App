# HDF5 Heatmap Viewer

A desktop application for visualizing HDF5 files with interactive heatmaps and 1D series plots.

## Features

- Upload and browse HDF5 files
- Visualize multi-dimensional datasets as heatmaps
- Create 1D series plots from datasets or slices
- Customize plot appearance with LaTeX-style fonts, custom labels, colors, and more
- Export plots as PNG images

## Requirements

- Windows OS
- Python 3.8 or higher
- Node.js and npm

## Quick Start

1. **Install Dependencies (First-time Setup)**:
   - Double-click `setup_dependencies.bat` to install all required packages

2. **Start the Application**:
   - Double-click `quick_start.bat` to launch the application
   - Or use `start_heatmap_viewer.bat` which will check dependencies first

3. **Using the Application**:
   - The application will open in your default web browser
   - Use the "Upload File" button to load an HDF5 file
   - Select datasets from the sidebar to visualize them
   - Use the control panels to customize your visualizations

## Batch Files

- `setup_dependencies.bat`: Installs all required dependencies without starting the application
- `quick_start.bat`: Quickly starts the application (use after initial setup)
- `start_heatmap_viewer.bat`: Checks and installs dependencies, then starts the application

## Troubleshooting

- If the application doesn't start correctly, check that Python and Node.js are installed and in your PATH
- Make sure all required ports (8000 for backend, 5173 for frontend) are available
- If you encounter issues with dependencies, try running `setup_dependencies.bat` again

## Credits

Designed by Wridhdhisom Karar. (c) Quantum Circuits Group