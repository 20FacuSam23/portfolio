# Datalisting Grid — integración de promoción cruzada

## Estado del 31/10/2026
Componente central: `portfolio/datalisting-grid/grid.js`.
Integrado en las páginas públicas de `portfolio`, `datalisting-tienda` y `datalisting-aula`.

## Insertar en páginas públicas de Hostinger / Datalisting Laravel
Solo en la vista o layout público elegido; no agregarlo indiscriminadamente a paneles privados, login, checkout ni administración.

```html
<script defer src="https://20facusam23.github.io/portfolio/datalisting-grid/grid.js?v=20261031-1" data-dg-site="datalisting"></script>
```

Agregar antes del cierre de `</body>`. El componente inserta una sección encima del footer existente; si no hay footer, al final del body.

## Reglas
- Marca principal estática: «By Datalisting».
- Carrusel horizontal automático: enlaces de todos los otros proyectos.
- No mostrar el proyecto actual dentro de su propio carrusel.
- «Tu negocio aquí» inicia una solicitud por correo, sin habilitación automática.
- Respetar «prefers-reduced-motion»; detener al pasar el mouse.
- Evitar mostrar el banner en iframes de portfolio (`?vista=portfolio`).
- Cada marca conserva su identidad. Usar logotipo original cuando existe.
- Cambios de listado se hacen en el archivo central y se reflejan en todos los sitios tras la actualización de caché.

## Pendiente
- Integrar el snippet en la web pública de datalisting.info (Hostinger), cuyo código no está en los repositorios publicados aquí.
- Reemplazar identidades tipográficas por archivos de logos oficiales para marcas que aún no tengan un activo gráfico independiente.
- Integrar solicitudes de incorporación con el módulo de administración de Datalisting, con revisión y aprobación antes de mostrarse.
- Validar visualmente la publicación en GitHub Pages y dispositivos móviles.
