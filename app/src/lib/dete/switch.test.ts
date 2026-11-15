// The switch of DE-T on the public copy of the site. Code written with AI assistance (Claude) for team RAACK.
import { afterEach, describe, expect, it, vi } from 'vitest';
import config from '../../../dete/publico.json';
import { isPublicCopy, readSwitch, switchFromApi, switchTarget } from './switch';

const ON = 'https://abc123.lhr.life/api/chat';
/** The envelope of the GitHub API around a switch file: base64 cut in lines, as GitHub sends it. */
const envelope = (file: unknown) => ({ name: 'dete.json', encoding: 'base64', content: btoa(JSON.stringify(file, null, 1)).replace(/(.{60})/g, '$1\n') });
const answer = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

describe('interruptor de DE-T en la copia pública', () => {
  it('apagado: sin dirección, con null o con algo que no es un texto', () => {
    expect(switchTarget({ url: null })).toBeNull();
    expect(switchTarget({})).toBeNull();
    expect(switchTarget(null)).toBeNull();
    expect(switchTarget({ url: 42 })).toBeNull();
    expect(switchTarget('https://abc.lhr.life/api/chat')).toBeNull();
  });

  it('encendido: una dirección https que termina en /api/chat', () => {
    expect(switchTarget({ url: ON })).toBe(ON);
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

  it('la configuración nombra una página https y el interruptor, en la rama del repositorio y por la API', () => {
    expect(config.pagina).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    expect(config.interruptor).toBe(`https://raw.githubusercontent.com/Javiigxs/RAACK/${config.rama}/dete.json`);
    expect(config.api).toBe(`https://api.github.com/repos/Javiigxs/RAACK/contents/dete.json?ref=${config.rama}`);
  });
});

describe('el interruptor leído por la API de GitHub', () => {
  it('saca la dirección del sobre en base64, encendido o apagado', () => {
    expect(switchFromApi(envelope({ url: ON, desde: '2026-11-15T17:18:14.478Z' }))).toBe(ON);
    expect(switchFromApi(envelope({ url: null, desde: '2026-11-15T14:20:10.000Z' }))).toBeNull();
  });

  it('una dirección que no vale también es «apagado», no un fallo', () => {
    expect(switchFromApi(envelope({ url: 'http://abc.lhr.life/api/chat' }))).toBeNull();
  });

  it('lo que no es el archivo (un error de la API, su límite, otro formato) no se toma por respuesta', () => {
    expect(switchFromApi({ message: 'API rate limit exceeded' })).toBeUndefined();
    expect(switchFromApi(null)).toBeUndefined();
    expect(switchFromApi({ encoding: 'base64', content: 'esto no es base64 %%%' })).toBeUndefined();
    expect(switchFromApi({ encoding: 'base64', content: btoa('no es json') })).toBeUndefined();
    expect(switchFromApi({ encoding: 'base64', content: btoa('42') })).toBeUndefined();
    expect(switchFromApi({ encoding: 'utf-8', content: '{"url":null}' })).toBeUndefined();
  });
});

describe('leer el interruptor: primero la API, después el archivo', () => {
  afterEach(() => vi.unstubAllGlobals());

  /** A fetch that answers each address with what the table says and notes which ones were asked. */
  function web(table: Record<string, () => Response>) {
    const asked: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      asked.push(url);
      const reply = table[url];
      if (!reply) throw new TypeError('Failed to fetch');
      return reply();
    });
    return asked;
  }

  it('si la API responde, vale lo que dice y el archivo no se pide', async () => {
    const asked = web({ [config.api]: () => answer(envelope({ url: ON })), [config.interruptor]: () => answer({ url: null }) });
    expect(await readSwitch()).toBe(ON);
    expect(asked).toEqual([config.api]);
  });

  it('la API dice «apagado»: apagado, aunque el archivo siga con la dirección vieja', async () => {
    const asked = web({ [config.api]: () => answer(envelope({ url: null })), [config.interruptor]: () => answer({ url: ON }) });
    expect(await readSwitch()).toBeNull();
    expect(asked).toEqual([config.api]);
  });

  it('si la API llegó a su límite o no responde, se lee el archivo', async () => {
    let asked = web({ [config.api]: () => answer({ message: 'API rate limit exceeded' }, false), [config.interruptor]: () => answer({ url: ON }) });
    expect(await readSwitch()).toBe(ON);
    expect(asked).toEqual([config.api, config.interruptor]);

    asked = web({ [config.interruptor]: () => answer({ url: ON }) });
    expect(await readSwitch()).toBe(ON);
    expect(asked).toEqual([config.api, config.interruptor]);
  });

  it('si no responde ninguno de los dos, DE-T queda apagado', async () => {
    web({});
    expect(await readSwitch()).toBeNull();
  });
});
