import { App } from './app.js';
import { buildUILayout } from './ui/UILayout.js';

function bootstrap(): void {
  const root = document.getElementById('app');
  if (root === null) throw new Error('#app root element not found');

  const refs = buildUILayout(root);
  const app = new App(refs);
  app.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
