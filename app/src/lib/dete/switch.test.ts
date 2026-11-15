// The switch of DE-T on the public copy of the site. Code written with AI assistance (Claude) for team RAACK.
import { describe, expect, it } from 'vitest';
import config from '../../../dete/publico.json';
import { isPublicCopy, switchTarget } from './switch';

describe('interruptor de DE-T en la copia pública', () => {
  it('apagado: sin dirección, con null o con algo que no es un texto', () => {
    expect(switchTarget({ url: null })).toBeNull();
    expect(switchTarget({})).toBeNull();
    expect(switchTarget(null)).toBeNull();
    expect(switchTarget({ url: 42 })).toBeNull();
    expect(switchTarget('https://abc.lhr.life/api/chat')).toBeNull();
  });

  it('encendido: una dirección https que termina en /api/chat', () => {
    expect(switchTarget({ url: 'https://abc123.lhr.life/api/chat' })).toBe('https://abc123.lhr.life/api/chat');
  });

  it('no acepta otra cosa: http, otra ruta, credenciales, parámetros ni código', () => {
    for (const url of [
      'http://abc.lhr.life/api/chat',
      'https://abc.lhr.life/',
      'https://abc.lhr.life/api/chat/otra',
      'https://usuario:clave@abc.lhr.life/api/chat',
      'https://abc.lhr.life/api/chat?x=1',
      'https://abc.lhr.life/api/chat#x',
      'javascript:alert(1)',
      'api/chat',
      ''
    ]) {
      expect(switchTarget({ url }), url).toBeNull();
    }
  });

  it('solo la copia pública lee el interruptor', () => {
    expect(isPublicCopy('https://javiigxs.github.io')).toBe(true);
    expect(isPublicCopy('http://localhost:8000')).toBe(false);
    expect(isPublicCopy('https://otra.github.io')).toBe(false);
  });

  it('la configuración nombra una página https y un interruptor en la rama del repositorio', () => {
    expect(config.pagina).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    expect(config.interruptor).toBe(`https://raw.githubusercontent.com/Javiigxs/RAACK/${config.rama}/dete.json`);
  });
});
