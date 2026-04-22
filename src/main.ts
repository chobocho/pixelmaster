import { App } from './app.js';

const CANVAS_ID = 'app-canvas';

function bootstrap(): void {
  const el = document.getElementById(CANVAS_ID);
  if (!(el instanceof HTMLCanvasElement)) {
    throw new Error(`Canvas element #${CANVAS_ID} not found`);
  }
  const app = new App(el);
  app.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
