# Facundo Aragón — Portfolio

Portfolio personal de desarrollo web y diseño. Publicado en **https://20facusam23.github.io/portfolio/**.

## Experiencia

- Apertura tipográfica y geometría 3D dibujada en Canvas, con respuesta al puntero.
- Galería de proyectos con filtros, detalles y enlaces a las demos o al código.
- Presentación vertical de cuatro escenas en `presentacion.html`, con reproducción voluntaria, controles y opción de pantalla completa cuando el navegador la permite.
- Navegación adaptable, acceso por teclado y preferencia de movimiento reducido. El botón de movimiento permite pausar las animaciones.
- Email, portapapeles y enlaces de contacto directos. No hay un formulario que simule enviar mensajes.

## Muestras recientes

La sección «Páginas reales» integra cuatro vistas públicas: A Remarla, Nuts, Aula Datalisting y Tienda Datalisting. Las vistas son miniaturas en tiempo real mediante iframes de GitHub Pages, no capturas PNG ni imágenes creadas artificialmente; se cargan de forma diferida, no admiten interacción dentro de la miniatura y ofrecen enlaces directos. Se aíslan de las sesiones existentes con un sandbox sin acceso al mismo origen. El backend de las funciones autenticadas puede no estar disponible y ninguna pantalla privada se incluye en las muestras.

## Publicación

El sitio es estático y no necesita compilación ni dependencias en producción. GitHub Pages sirve la raíz del repositorio. Se conservan rutas relativas para funcionar bajo `/portfolio/`.

`index.html` contiene el portfolio, `css/` los estilos y `js/` las interacciones. Los datos de los proyectos están en `js/portfolio.js`. Las portadas gráficas y las capturas anteriores se identifican como tales en sus detalles.

La fuente Space Grotesk está alojada en `assets/fonts/`, con su licencia SIL Open Font License.

## Comprobaciones

Con Node.js 22 o posterior:

```sh
npm ci --ignore-scripts
npm run check
npm test
```

Las comprobaciones validan sintaxis, referencias locales, navegación, atributos ARIA y comportamientos de filtros, menú, detalles, portapapeles, movimiento y presentación. Las pruebas de DOM no reemplazan la revisión visual en un navegador.

## Composiciones para compartir

`scripts/export_social.py` genera la imagen social del sitio y un video gráfico vertical de 18 segundos. Requiere Python con Pillow y NumPy, más FFmpeg instalado. El video es una composición animada del portfolio, no una grabación del navegador.

```sh
python3 scripts/export_social.py --output /ruta/de/salida/Facundo_Portfolio_Instagram_18s.mp4
```

Los videos exportados se guardan fuera del repositorio. La presentación web permanece disponible sin descargar un video.
