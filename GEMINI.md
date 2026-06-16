# LitFut - Project Context

## Project Overview
LitFut is a football tournament simulator built as a single-page Progressive Web App (PWA). It features a conference-based league system (EUR, AME, AAO) with automated draws, match simulations, and standings tracking.

### Core Technologies
- **HTML5/CSS3**: Utilizes modern CSS features like variables, grid, and flexbox for a responsive, mobile-first design.
- **Vanilla JavaScript**: All simulation logic, state management, and DOM manipulation are handled in external files for maintainability.
- **PWA**: Includes a `manifest.json` and `service-worker.js` for offline functionality and installation on mobile devices.

## Directory Structure
- `index.html`: The main entry point (HTML structure).
- `styles.css`: External stylesheet containing all application styles.
- `script.js`: External JavaScript file containing simulation logic and state management.
- `manifest.json`: Configuration for the Progressive Web App (name, icons, theme colors).
- `service-worker.js`: Implements basic caching for offline use.
- `icons/`: Contains SVG icons used for the PWA manifest and browser favicon.
- `README.md`: Minimal project identification.

## Building and Running
As a static web application, LitFut does not require a build step.

### Development
- **Run Locally**: Open `index.html` directly in any modern web browser.
- **PWA Testing**: To test service worker and manifest functionality, serve the directory using a local web server:
  ```bash
  # Example using 'serve' (requires Node.js)
  npx serve .
  ```

## Development Conventions
- **Modular Architecture**: CSS and JS are extracted into standalone files for better maintainability and clarity.
- **State Management**: The application state is maintained in a central `state` object and automatically persisted to `localStorage` (key: `litfut_v1_state`) on every change.
- **Styling**: Uses a dark-themed, "cyber-sport" aesthetic with high-contrast accents (Green, Blue, Orange, Purple).
- **Conferences**:
  - **EUR (Europe)**: 12 teams, 3 qualifiers per league.
  - **AME (Americas)**: 12 teams, 3 qualifiers per league.
  - **AAO (Africa/Asia/Oceania)**: 12 teams, 2 qualifiers per league.

## TODOs / Future Improvements
- [ ] Add more detailed match statistics.
