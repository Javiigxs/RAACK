// What the page tells DE-T about a number, and what DE-T keeps in mind. Code written with AI
// assistance (Claude) for team RAACK.
import { describe, expect, it } from 'vitest';
import { around, compact } from './context';
import { history, MEMORY, type Msg } from './dete.svelte';

describe('contexto de un número para DE-T', () => {
  it('deja entero un texto corto', () => {
    expect(around('Total stored water is falling by −7.1 cm per decade.', 33, 37)).toBe('Total stored water is falling by −7.1 cm per decade.');
  });

  it('recorta un texto largo alrededor del número, sin partir palabras, y marca los cortes', () => {
    const text = `${'palabra '.repeat(80)}el agua almacenada baja −7.1 cm por década ${'otra '.repeat(80)}`;
    const start = text.indexOf('−7.1');
    const out = around(text, start, start + 4, 120);
    expect(out.length).toBeLessThanOrEqual(122);
    expect(out).toContain('−7.1');
    expect(out.startsWith('…')).toBe(true);
    expect(out.endsWith('…')).toBe(true);
    expect(out).toMatch(/^…palabra /);
    expect(out).toMatch(/ otra…$/);
  });

  it('cerca del principio usa el espacio que sobra al final', () => {
    const text = `Lluvia de 806 mm ${'y más texto '.repeat(60)}`;
    const out = around(text, 10, 13, 100);
    expect(out.startsWith('Lluvia de 806 mm')).toBe(true);
    expect(out.endsWith('…')).toBe(true);
  });

  it('solo manda los campos con contenido, en una línea', () => {
    expect(compact({ numero: ' −7.1 cm\nper decade ', tipo: '', etiqueta: undefined, idioma: 'en' })).toEqual({ numero: '−7.1 cm per decade', idioma: 'en' });
  });
});

describe('memoria de DE-T', () => {
  const msgs: Msg[] = [
    { id: 1, role: 'user', text: 'primera' },
    { id: 2, role: 'assistant', text: 'respuesta 1' },
    { id: 3, role: 'user', text: 'segunda' },
    { id: 4, role: 'assistant', text: '', note: 'busy' },
    { id: 5, role: 'assistant', text: 'respuesta 2' }
  ];

  it('manda solo los últimos mensajes de la conversación y la pregunta nueva', () => {
    expect(MEMORY).toBe(2);
    expect(history(msgs, 'tercera')).toEqual([
      { role: 'user', content: 'segunda' },
      { role: 'assistant', content: 'respuesta 2' },
      { role: 'user', content: 'tercera' }
    ]);
  });

  it('los avisos de la página no cuentan como mensajes de DE-T', () => {
    expect(history([msgs[3]], 'hola')).toEqual([{ role: 'user', content: 'hola' }]);
  });
});
