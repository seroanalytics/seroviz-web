# SeroViz WebR

A browser-based version of SeroViz that combines the R backend functionality with the React frontend using WebR technology. This allows the entire application to run in the browser without requiring a separate server.

## Features

- **WebR Integration**: R statistical computing runs directly in the browser
- **Data Upload**: Upload CSV files with serological data
- **Data Visualization**: Create population and individual-level plots
- **No Server Required**: Everything runs client-side in the browser
- **Same Functionality**: Maintains the same features as the original SeroViz

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start the development server:

   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

1. **Upload Data**: Go to the "Manage datasets" page and upload your CSV file
2. **Explore Data**: Click on a dataset to explore it
3. **Create Plots**: Use the sidebar to configure plot options and create visualizations
4. **Switch Views**: Toggle between population and individual plot views

## Data Format

Your CSV file should contain the following columns:

- `biomarker`: The biomarker identifier
- `value`: The antibody titre value
- `day` (or custom): Time point identifier

Additional columns can be used for covariates and filtering.

## Technology Stack

- **Frontend**: React, TypeScript, Bootstrap
- **Backend**: WebR (R running in the browser)
- **Visualization**: Plotly.js
- **Build Tool**: Create React App

## Development

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm run lint`: Runs ESLintLicense

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or email david.hodgson@charite.de if you have ideas to make this better!
