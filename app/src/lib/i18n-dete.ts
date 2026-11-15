// Textos de DE-T, el asistente del caso, y de su enlace bajo la explicación de cada número
// (inglés y español). Primer borrador asistido por IA (Claude): el equipo RAACK lo revisa.

type Dict = Record<string, string>;

export const deteEn: Dict = {
  // Under the explanation of a number
  'x.ask.q': 'Not clear?',
  'x.ask.cta': 'Ask DE-T',
  'x.ask.aria': 'Ask DE-T, the case assistant, about {num}',

  // The panel
  'dete.name': 'DE-T',
  'dete.role': 'The case assistant',
  'dete.sub': 'It answers only with the data of this tool, and checks every figure against the data before showing it.',
  'dete.open': 'Ask DE-T',
  'dete.openAria': 'Ask DE-T, the case assistant',
  'dete.close': 'Close DE-T',
  'dete.clear': 'New conversation',
  'dete.sector': 'Who are you?',
  'dete.sector.civil': 'Citizen',
  'dete.sector.gobierno': 'Government or water authority',
  'dete.sector.periodista': 'Journalist',
  'dete.sector.investigador': 'Researcher',
  'dete.sector.industria': 'Industry or agriculture',
  'dete.memory': 'I only remember the last 2 messages. If something earlier matters, repeat it in your question.',
  'dete.hello': 'Ask me about the case: what a number means, why a reservoir dropped, whether two variables move together, or what the data says about any country.',
  'dete.try': 'Try one:',
  'dete.s1': 'Why did Cerro Prieto dry up in 2022?',
  'dete.s2': 'Is rain related to stored water? Try a lag of 1 year.',
  'dete.s3': 'What do you recommend doing?',
  'dete.input': 'Your question for DE-T',
  'dete.placeholder': 'E.g. Why did Cerro Prieto dry up in 2022?',
  'dete.send': 'Ask',
  'dete.you': 'You',
  'dete.about': 'About',
  'dete.thinking': 'DE-T is checking the data…',
  'dete.verified': 'Figures checked against the data',
  'dete.busy': 'There are many questions at once. Try again in a minute.',
  'dete.down': 'DE-T is not available right now. The rest of the page still works.',
  'dete.empty': 'DE-T could not answer this time.',
  'dete.disclosure':
    'Answers are generated with AI (Kimi, by Moonshot AI) from the results of this tool, and they can be wrong. 📚 = an option from the catalogue, with its source · 🤖 = the AI’s own suggestion, not verified.',
  'dete.q.number': 'What does {num} mean here?',
  'dete.state.water': '{region}, {y0}–{y1}; worry: {concern}',
  'dete.state.city': 'Monterrey: {variable}, {site}, {y0}–{y1}',

  // Invitation inside the verdict
  'dete.verdict.text': 'Questions about this verdict? DE-T answers with the same data, in the words of a citizen, an official, a journalist, a researcher or a business.',

  // Under the country finder of the world section: ask about the place the globe shows
  'dete.place.title': 'Ask DE-T about {name}',
  'dete.place.placeholder': 'Your question about {name}',
  'dete.place.q1': 'Is {name} losing stored water?',
  'dete.place.q2': 'What is still missing to open the case in {name}?',
  'dete.place.q3': 'How does {name} compare with Nuevo León?',

  // DE-T is always on the page; these say that it is off right now
  'dete.tag.off': 'Off',
  'dete.offAria': 'DE-T, the case assistant, is off right now',
  'dete.offnow.title': 'DE-T is off right now',
  'dete.offnow.text': 'DE-T runs on a computer of the team and is switched on for live sessions. Everything else on this page works without it.',
  'dete.offnow.retry': 'Check again',
  'dete.checking': 'Checking whether DE-T is on…',

  // Only while developing: why DE-T is off
  'dete.off.noserver': 'DE-T is off: its server is not running. Start it with npm run dete (the Kimi key goes in app/dete/.env).',
  'dete.off.nokey': 'DE-T is off: its server has no Kimi key. Put it in app/dete/.env and start npm run dete again.'
};

export const deteEs: Dict = {
  'x.ask.q': '¿No quedó claro?',
  'x.ask.cta': 'Pregúntale al DE-T',
  'x.ask.aria': 'Pregúntale al DE-T, el asistente del caso, por {num}',

  'dete.name': 'DE-T',
  'dete.role': 'El asistente del caso',
  'dete.sub': 'Responde solo con los datos de esta herramienta y comprueba cada cifra contra los datos antes de mostrarla.',
  'dete.open': 'Pregúntale al DE-T',
  'dete.openAria': 'Pregúntale al DE-T, el asistente del caso',
  'dete.close': 'Cerrar DE-T',
  'dete.clear': 'Conversación nueva',
  'dete.sector': '¿Quién eres?',
  'dete.sector.civil': 'Ciudadano',
  'dete.sector.gobierno': 'Gobierno o autoridad del agua',
  'dete.sector.periodista': 'Periodista',
  'dete.sector.investigador': 'Investigador',
  'dete.sector.industria': 'Industria o agricultura',
  'dete.memory': 'Solo recuerdo los últimos 2 mensajes. Si quieres que tome en cuenta algo anterior, repítelo en tu pregunta.',
  'dete.hello': 'Pregúntame por el caso: qué significa un número, por qué bajó una presa, si dos variables se mueven juntas o qué dicen los datos de cualquier país.',
  'dete.try': 'Prueba con una:',
  'dete.s1': '¿Por qué se secó Cerro Prieto en 2022?',
  'dete.s2': '¿La lluvia se relaciona con el agua almacenada? Prueba con rezago de 1 año.',
  'dete.s3': '¿Qué recomiendan hacer?',
  'dete.input': 'Tu pregunta para DE-T',
  'dete.placeholder': 'Ej. ¿Por qué se secó Cerro Prieto en 2022?',
  'dete.send': 'Preguntar',
  'dete.you': 'Tú',
  'dete.about': 'Sobre',
  'dete.thinking': 'DE-T está revisando los datos…',
  'dete.verified': 'Cifras verificadas contra los datos',
  'dete.busy': 'Hay muchas preguntas al mismo tiempo. Intenta de nuevo en un minuto.',
  'dete.down': 'DE-T no está disponible en este momento. El resto de la página sigue funcionando.',
  'dete.empty': 'DE-T no pudo responder esta vez.',
  'dete.disclosure':
    'Respuestas generadas con IA (Kimi, de Moonshot AI) a partir de los resultados de esta herramienta; pueden equivocarse. 📚 = opción del catálogo, con su fuente · 🤖 = sugerencia propia de la IA, no verificada.',
  'dete.q.number': '¿Qué significa {num} aquí?',
  'dete.state.water': '{region}, {y0}–{y1}; preocupación: {concern}',
  'dete.state.city': 'Monterrey: {variable}, {site}, {y0}–{y1}',

  'dete.verdict.text': '¿Dudas sobre este veredicto? DE-T responde con los mismos datos, en palabras para ciudadanía, gobierno, prensa, investigación o industria.',

  'dete.place.title': 'Pregúntale al DE-T por {name}',
  'dete.place.placeholder': 'Tu pregunta sobre {name}',
  'dete.place.q1': '¿{name} está perdiendo agua almacenada?',
  'dete.place.q2': '¿Qué falta para abrir el caso en {name}?',
  'dete.place.q3': '¿Cómo se compara {name} con Nuevo León?',

  'dete.tag.off': 'Apagado',
  'dete.offAria': 'DE-T, el asistente del caso, está apagado en este momento',
  'dete.offnow.title': 'DE-T está apagado en este momento',
  'dete.offnow.text': 'DE-T corre en un equipo del propio equipo y se enciende para las sesiones en vivo. Todo lo demás de la página funciona sin él.',
  'dete.offnow.retry': 'Comprobar de nuevo',
  'dete.checking': 'Comprobando si DE-T está encendido…',

  'dete.off.noserver': 'DE-T está apagado: su servidor no está encendido. Arráncalo con npm run dete (la clave de Kimi va en app/dete/.env).',
  'dete.off.nokey': 'DE-T está apagado: su servidor no tiene la clave de Kimi. Ponla en app/dete/.env y vuelve a arrancar npm run dete.'
};
