import './style.css';
import { mulaUi } from './ui';

mulaUi();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* tidak kritikal */ });
  });
}
