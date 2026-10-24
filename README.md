# GestureScroll

Control web page scrolling with hand gestures using your webcam, React, and MediaPipe.

## Features

- Real-time hand tracking in the browser
- Pinch your thumb and index finger to grab the page
- Move your hand up or down to scroll
- Release the pinch to stop scrolling
- Adjustable scroll sensitivity
- Live camera preview and gesture status

## Tech Stack

- React
- TypeScript
- Vite
- MediaPipe Tasks Vision

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mmokht81/GestureScroll.git
cd GestureScroll
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL shown in your terminal and allow camera access when prompted.

## Usage

1. Wait for the camera to initialize.
2. Pinch your thumb and index finger together to grab the page.
3. Move your hand up or down to scroll.
4. Release the pinch to stop scrolling.

## Configuration

In `src/App.tsx`, adjust `SCROLL_SENSITIVITY` to change the scrolling speed.

```ts
const SCROLL_SENSITIVITY = 1300;
```

Higher values make scrolling faster; lower values make it slower.

## Requirements

- Node.js and npm
- A modern browser with webcam support
- Camera permission
- MediaPipe model and WASM assets in the expected `public/` paths

## Build

Create a production build:

```bash
npm run build
```

The generated files are placed in `dist/`.

## License

No license specified.
