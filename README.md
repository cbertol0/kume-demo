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

## Páginas

- `index.html`: portada. Los cinco productos se abren en un **panel lateral** dentro de la misma página (Perros, Gatos, Omegas 3 y 6, Muscular Plus y Recovery Forte), con beneficios, modo de empleo, análisis nutricional e ingredientes. Se puede compartir un producto abierto con un enlace, por ejemplo `index.html#producto-gatos`.
- `index.html` suma, respecto de la versión 1, las secciones **Guía rápida**, **Los que eligen** (testimonios) y **Dónde comprar**.
- `sobre-kume.html`: página "Sobre Küme" con el texto del sitio actual, y los perfiles de Sandra Rivadulla y Daniel Pampin con un resumen de su trayectoria.

Fuentes de los textos: beneficios, indicaciones y modo de empleo salen de kume.com.ar/productos; el análisis nutricional y los ingredientes, del folleto 2023. Los textos están copiados tal cual, incluidos posibles errores del folleto (por ejemplo "albumina", "Saccharomyces cereviciae" en lugar de "cerevisiae", "zarzaparilla"); conviene revisarlos con el cliente.

## Efectos incluidos

| Efecto | Cómo está hecho |
|---|---|
| El lema "La elección de los que eligen" engorda letra por letra al acercar el mouse (del peso fino del logo fino hacia el peso del logo bold). En celulares, una onda automática | Fuente variable + GSAP |
| Mosaico del hero que entra escalonado y se desplaza en paralaje por columna | GSAP + ScrollTrigger |
| Scrollytelling: sección fijada donde la ramita se dibuja mientras cambia el texto | ScrollTrigger (`pin`, `scrub`) |
| Nombres de los profesionales que se deslizan en sentido opuesto | ScrollTrigger (`scrub`) |
| Cinco paneles de producto que se expanden al pasar el mouse | CSS (`flex-grow`, `grid-template-rows`) + GSAP `quickTo` |
| Panel lateral de detalle de producto | `<dialog>` nativo (foco, Esc y fondo), con cambio de producto sin cerrar |
| Sobre Küme: entrada escalonada, tiles y fotos con paralaje | GSAP + ScrollTrigger |
| Filas del blog con barrido de color al pasar el mouse | CSS |
| Guía rápida: el resultado cambia de color y producto al elegir | CSS + GSAP (`fromTo` de opacidad) |
| Filtro por zona en "Dónde comprar" | JS, sin librerías |
| Scroll suave | Lenis |
| Barra de progreso | CSS puro (`animation-timeline: scroll()`), con respaldo en GSAP |
| Cursor personalizado y botones "magnéticos" | GSAP (solo con mouse) |

Con `prefers-reduced-motion` (o sin JS) el sitio se ve completo y sin animaciones.


## Novedades de la versión 2

### Ritmo (lo que más se nota)

| Qué | Antes | Ahora |
|---|---|---|
| Scroll fijado de la sección "¿Qué significa holístico?" | 3,2 alturas de pantalla (≈2.880 px para 3 párrafos) | 2,1 alturas (≈1.890 px) |
| Aire muerto entre los paneles de producto y esa sección | ≈500 px | lo ocupa la guía rápida |
| Sección de contacto | columnas alineadas arriba, media sección naranja vacía | columnas centradas |

### Secciones nuevas

- **Guía rápida (`#guia`)** — dos preguntas (mascota y objetivo) y recomienda uno de los cinco productos, con el botón que abre el panel de detalle que ya existía. Funciona con teclado (flechas dentro de cada grupo) y **sin JS**: el resultado viene resuelto en el HTML para perro + alimento diario.
- **Prueba social (`#voces`)** — tres testimonios. Es lo que más falta para una marca premium poco conocida.
- **Dónde comprar (`#donde-comprar`)** — listado de puntos de venta con filtro por zona, más el enlace a la tienda online y una llamada a pet shops que quieran distribuir. Sin JS se ve el listado completo.

Las tres entran con una animación sobria de aparición; nada nuevo se fija ni se mueve en paralaje.

> **Ojo antes de publicar:** los testimonios y el listado de puntos de venta son **contenido de ejemplo** y están marcados como tales en la propia página (franja gris con borde naranja, clase `.demo-tag`). Hay que reemplazarlos por los reales y borrar esa marca (`.demo-tag` en `index.html` y su regla en `styles.css`).

### Medido en el navegador

| | |
|---|---|
| LCP en 4G lento | 1,2 s |
| CLS | 0,006 |
| Peso total | 560 kB |
| Errores de consola o red | ninguno |
| Desborde horizontal de 360 a 1920 px | ninguno |
| Con `prefers-reduced-motion` o sin JS | la página se ve completa, la guía y el listado funcionan |

## Qué se corrigió respecto del sitio actual

- El teléfono enlaza al número real (`tel:+5491144462185`); el original apunta a `+1-800-356-8933`, un número de plantilla.
- Un solo `<h1>`, jerarquía de títulos ordenada, título y meta description propios, `og:locale` en `es_AR`, datos estructurados.
- Enlace para saltar al contenido, foco visible, formulario con etiquetas y errores.

## Pendiente / a reemplazar

- **Fotos de los profesionales y de la familia de productos (Sobre Küme):** se cargan directamente desde kume.com.ar. Si esa carga falla, la página muestra las iniciales sobre un bloque de color (y una foto local de la línea). Para independizar el demo: descargarlas a `assets/img/` y cambiar los `src` en `sobre-kume.html`.
- **Credenciales (CV en PDF):** el botón "Ver credenciales completas" abre los PDF originales alojados en kume.com.ar. No están copiados en el repo. Si se prefiere tenerlos dentro del demo, guardarlos en `assets/docs/` y cambiar los enlaces.
- **Fotos de producto:** los cinco productos usan recortes con fondo transparente (`assets/img/pack-*.webp`), hechos a partir de las imágenes que envió el cliente. Los de Muscular Plus y Recovery Forte salen de las imágenes con tabla incluida (unos 250 px de alto), así que se ven algo blandos al agrandarse: para el sitio final conviene tener esas dos fotos originales en alta. La bolsa de Perros es la de 3 kg "mordida pequeña".
- **"Comprá online":** todos los botones llevan a la portada de la tienda en Tienda Nube. Falta la URL de cada producto.
- **Fotos del folleto:** a 96 ppi (140–570 px de ancho), por eso se usan en tamaños chicos. Para el sitio final hacen falta los originales.
- **Formulario:** valida los campos pero no envía nada. Falta un servicio (Formspree, Netlify Forms, endpoint propio).
- **Imagen para redes:** crear `assets/img/og.jpg` (1200×630) y descomentar la etiqueta `og:image` en `index.html`.
- **Páginas no rehechas:** FAQs, Contacto y las notas del blog enlazan al sitio actual. La tienda sigue en Tienda Nube.
- Está incluido `assets/img/logo-bold-gatos.svg` (K verde), sin usar todavía.
- **Testimonios y puntos de venta son de ejemplo**: reemplazar por los reales y sacar la marca `.demo-tag`.
- Las fotos de mascotas del folleto son chicas (142–285 px). Alcanzan para el mosaico y para las firmas de los testimonios, pero si en algún momento se quieren mostrar grandes hacen falta originales de mayor resolución.

## Estructura

```
index.html
sobre-kume.html
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
