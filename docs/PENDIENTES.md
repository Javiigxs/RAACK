---
tags: [raack, pendientes]
fecha: 2026-11-14
---
# Pendientes de RAACK

## Decisiones del equipo

- [ ] **Giovanni: pendiente de nuestra decisión.** Ver [Giovanni - decisión pendiente](decisiones/GIOVANNI.md).
- [ ] Elegir una o dos variables para la primera demostración.
- [ ] Definir región o puntos comparables, periodo y frecuencia temporal.
- [ ] Decidir si la región está en Canadá: de eso depende usar GEO.ca y RCM. Ver [Cobertura de los 13 recursos](../recursos/COBERTURA.md).
- [ ] Pasar la [validación de la propuesta](VALIDACION.md) antes de elegir el caso final: problema real, medible, hecha con los datos que nos dieron y con un diferenciador.
- [ ] Elegir la fuente principal de datos y el método para comunicar tasa de cambio e incertidumbre.

## Datos y acceso

- [ ] Descargar una serie suficientemente larga para analizar tendencias; el CSV GLDAS actual es una muestra corta.
- [ ] Confirmar unidades, versión, calidad, cobertura y cita del producto seleccionado.
- [x] Crear la cuenta NASA Earthdata del equipo (14 de noviembre de 2026).
- [ ] Mientras llega AppEEARS, sacar de Hydrology Time Series una serie instantánea de Monterrey para empezar la herramienta. Ver [Funcionalidades y tiempos](FUNCIONALIDADES.md).
- [ ] Revisar el resultado de la [solicitud de prueba AppEEARS en Monterrey](SOLICITUD_APPEEARS_MONTERREY.md) (NDVI y temperatura 2001–2025) y probar con ella la importación y el cálculo de tendencias.
- [ ] Pedir los demás accesos que hagan falta una vez elegidos variable, región y periodo: token de NOAA, verificación de KNMI o registro en EODMS. Qué pedir y para qué: [Bases de datos que hay que pedir](SOLICITUDES_DE_DATOS.md).
- [ ] Si se necesitan, resolver las descargas bloqueadas del ZIP SAR y las muestras NOAA; ver [Recursos y descargas](../recursos/README.md).
- [ ] Si se usa el notebook SAR, adaptar rutas y reunir sus datos externos. La guía QGIS conserva imágenes remotas.

## Criterios que debe cubrir la herramienta

- [ ] Selección comprensible de variable y región.
- [ ] Visualización temporal con fechas y unidades.
- [ ] Dirección y tasa de cambio.
- [ ] Prueba o intervalo de confianza con límites explicados.
- [ ] Procedencia de los datos y posibilidad de reproducir el resultado.
