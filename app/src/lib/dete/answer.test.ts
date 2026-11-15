// How DE-T's answers are laid out. Code written with AI assistance (Claude) for team RAACK.
import { describe, expect, it } from 'vitest';
import { blocks, inline } from './answer';

describe('respuestas de DE-T', () => {
  it('separa párrafos por líneas en blanco y une las líneas de un mismo párrafo', () => {
    expect(blocks('Primera línea\nsigue aquí.\n\nOtro párrafo.')).toEqual([
      { kind: 'p', parts: [{ text: 'Primera línea sigue aquí.', bold: false }] },
      { kind: 'p', parts: [{ text: 'Otro párrafo.', bold: false }] }
    ]);
  });

  it('reconoce listas con guion o numeradas', () => {
    const b = blocks('Opciones:\n- 📚 Del catálogo (A1): medir\n- 🤖 Sugerencia\n1. uno\n2. dos');
    expect(b.map((x) => x.kind)).toEqual(['p', 'ul', 'ol']);
    expect(b[1]).toEqual({
      kind: 'ul',
      items: [[{ text: '📚 Del catálogo (A1): medir', bold: false }], [{ text: '🤖 Sugerencia', bold: false }]]
    });
  });

  it('pone en negrita lo que va entre dobles asteriscos y deja un par sin cerrar como está', () => {
    expect(inline('GRACE baja **−7.1 cm por década** (confirmada)')).toEqual([
      { text: 'GRACE baja ', bold: false },
      { text: '−7.1 cm por década', bold: true },
      { text: ' (confirmada)', bold: false }
    ]);
    expect(inline('2 ** 3 = 8')).toEqual([{ text: '2 ** 3 = 8', bold: false }]);
  });

  it('un título de Markdown queda como una línea en negrita', () => {
    expect(blocks('### Qué dice la evidencia')).toEqual([{ kind: 'p', parts: [{ text: 'Qué dice la evidencia', bold: true }] }]);
  });

  it('el HTML de una respuesta queda como texto: nunca se interpreta', () => {
    const b = blocks('<img src=x onerror=alert(1)> hola');
    expect(b).toEqual([{ kind: 'p', parts: [{ text: '<img src=x onerror=alert(1)> hola', bold: false }] }]);
  });
});
