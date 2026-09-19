# Küme — demo de rediseño

Demo estático (HTML + CSS + JS, sin build) de la portada de Küme, aplicando el manual normativo y el folleto 2023 de la marca.
No es el sitio oficial: los textos, la marca y las imágenes pertenecen a Küme.

## Ver el demo

- **Local:** desde la carpeta del proyecto, `python3 -m http.server 8000` y entrar a `http://localhost:8000`.
- **GitHub Pages:** subir el contenido a un repo → *Settings → Pages → Deploy from a branch → `main` / `(root)`*.

## Identidad de marca aplicada

| Elemento | Origen |
|---|---|
| Logo fino, logo bold (claro y sobre oscuro), isotipo K y siluetas de perro y gato | Extraídos como **vectores (SVG)** de los PDFs del manual normativo, sin modificar |
| Naranja `#ED6E00` (Pantone Orange 021 C), para perros | Manual normativo |
| Verde `#8FD400` (Pantone 375), para gatos | Manual normativo |
| Gris Pantone Cool Gray 10 C `#63666A`, negro del logo `#231F20` | Manual normativo |
| Violeta `#9464A6` (concentrados proteicos) y gris claro `#EBEDED` | Folleto 2023 |
| Mosaico de fotos en blanco y negro + cuadrados de color, y textos de producto | Folleto 2023 |
| Tipografía: Helvetica Neue Thin | Manual. En la web se usa **Inter** (variable, 100–900), su equivalente abierto |

Notas:
- El folleto imprime el verde más amarillento (`#B0CC1F`) que el manual (`#8FD400`). Se usó el del manual.
- Helvetica Neue no se puede publicar como web font sin licencia. Si Küme la licencia, se reemplaza en `assets/css/styles.css` (`--ff` y `@font-face`).
- El naranja con texto blanco no alcanza contraste AA en tamaños chicos; por eso los botones y textos chicos sobre naranja van en negro y el blanco se reserva para títulos grandes.

## Efectos incluidos

| Efecto | Cómo está hecho |
|---|---|
| El lema "La elección de los que eligen" engorda letra por letra al acercar el mouse (del peso fino del logo fino hacia el peso del logo bold). En celulares, una onda automática | Fuente variable + GSAP |
| Mosaico del hero que entra escalonado y se desplaza en paralaje por columna | GSAP + ScrollTrigger |
| Scrollytelling: sección fijada donde la ramita se dibuja mientras cambia el texto | ScrollTrigger (`pin`, `scrub`) |
| Nombres de los profesionales que se deslizan en sentido opuesto | ScrollTrigger (`scrub`) |
| Cuatro paneles de producto que se expanden al pasar el mouse | CSS (`flex-grow`, `grid-template-rows`) + GSAP `quickTo` |
| Filas del blog con barrido de color al pasar el mouse | CSS |
| Scroll suave | Lenis |
| Barra de progreso | CSS puro (`animation-timeline: scroll()`), con respaldo en GSAP |
| Cursor personalizado y botones "magnéticos" | GSAP (solo con mouse) |

Con `prefers-reduced-motion` (o sin JS) el sitio se ve completo y sin animaciones.

## Qué se corrigió respecto del sitio actual

- El teléfono enlaza al número real (`tel:+5491144462185`); el original apunta a `+1-800-356-8933`, un número de plantilla.
- Un solo `<h1>`, jerarquía de títulos ordenada, título y meta description propios, `og:locale` en `es_AR`, datos estructurados.
- Enlace para saltar al contenido, foco visible, formulario con etiquetas y errores.

## Pendiente / a reemplazar

- **Fotos:** las del folleto están a 96 ppi (140–570 px de ancho), por eso se usan en tamaños chicos (tiles de 140–190 px). Para el sitio final hacen falta los originales en alta resolución.
- **Formulario:** valida los campos pero no envía nada. Falta un servicio (Formspree, Netlify Forms, endpoint propio).
- **Imagen para redes:** crear `assets/img/og.jpg` (1200×630) y descomentar la etiqueta `og:image` en `index.html`.
- **Páginas no rehechas:** Sobre nosotros, FAQs, Contacto y las notas del blog enlazan al sitio actual. La tienda sigue en Tienda Nube.
- **Fichas técnicas:** el folleto trae análisis nutricional e ingredientes por producto; no están en el demo y serían una buena sección a desplegar por producto.
- Está incluido `assets/img/logo-bold-gatos.svg` (K verde), sin usar todavía: sirve para páginas o secciones de gatos.

## Estructura

```
index.html
assets/
  css/styles.css     estilos y variables de color
  js/main.js         animaciones e interacciones
  vendor/            GSAP 3.15, ScrollTrigger, Lenis 1.3
  fonts/             Inter (variable, latin)
  img/               logos y siluetas (SVG), fotos del folleto (JPG)
```

## Licencias

- GSAP y ScrollTrigger: licencia "no charge" de GSAP (https://gsap.com/standard-license).
- Lenis: MIT. Inter: SIL Open Font License (ver `assets/fonts/`).
- Marca, logos, fotos y textos: propiedad de Küme.

## Nota

Si el repo es público, conviene avisar a Küme antes: el demo usa su marca, sus fotos y sus textos.
