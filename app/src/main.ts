import { mount } from 'svelte';
import App from './App.svelte';
// Hanken Grotesk (SIL Open Font License 1.1), servida desde el propio sitio: sin peticiones a terceros.
import '@fontsource-variable/hanken-grotesk/wght.css';
import './app.css';

mount(App, { target: document.getElementById('app')! });
