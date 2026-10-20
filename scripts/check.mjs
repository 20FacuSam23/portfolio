import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { parse, walk } from "css-tree";

const root = process.cwd();
let checked = 0;
function localAsset(base, reference) {
  if (/^(https?:|mailto:|data:|tel:)/.test(reference)) return;
  const file = decodeURIComponent(reference.split(/[?#]/)[0]);
  if (!file) return;
  assert(existsSync(path.resolve(base, file)), `Falta el archivo ${reference}`);
  checked++;
}
for (const filename of ["index.html", "presentacion.html"]) {
  const { document } = parseHTML(readFileSync(filename, "utf8"));
  assert.equal(document.documentElement.lang, "es");
  assert.equal(
    document.querySelectorAll("h1").length,
    1,
    `${filename}: un único h1`,
  );
  assert(document.title.length > 15);
  const ids = [...document.querySelectorAll("[id]")].map(
    (element) => element.id,
  );
  assert.equal(new Set(ids).size, ids.length, `${filename}: IDs duplicados`);
  for (const element of document.querySelectorAll(
    "[aria-labelledby],[aria-controls]",
  )) {
    const refs = [
      element.getAttribute("aria-labelledby"),
      element.getAttribute("aria-controls"),
    ]
      .filter(Boolean)
      .join(" ")
      .split(/\s+/);
    for (const id of refs)
      assert(document.getElementById(id), `Referencia ARIA inexistente: ${id}`);
  }
  for (const link of document.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href");
    assert(href !== "#" && href.trim(), "Enlace vacío");
    if (href.startsWith("#"))
      assert(
        document.getElementById(href.slice(1)),
        `Destino inexistente ${href}`,
      );
    else localAsset(root, href);
    if (link.target === "_blank")
      assert(link.rel.includes("noopener"), `Falta noopener: ${href}`);
  }
  for (const element of document.querySelectorAll(
    '[src],link[rel="stylesheet"],link[rel="preload"],link[rel="icon"]',
  )) {
    localAsset(
      root,
      element.getAttribute("src") || element.getAttribute("href"),
    );
  }
  for (const image of document.querySelectorAll("img")) {
    assert(image.hasAttribute("alt"), "Imagen sin alternativa textual");
    assert(
      image.hasAttribute("width") && image.hasAttribute("height"),
      "Imagen sin dimensiones",
    );
  }
  for (const button of document.querySelectorAll("button"))
    assert(
      button.getAttribute("aria-label") || button.textContent.trim(),
      "Botón sin nombre accesible",
    );
}
for (const filename of ["css/estilos.css", "css/presentacion.css"]) {
  const ast = parse(readFileSync(filename, "utf8"), {
    onParseError(error) {
      throw error;
    },
  });
  walk(ast, (node) => {
    if (node.type === "Url")
      localAsset(path.dirname(path.join(root, filename)), node.value);
  });
}
assert(existsSync("assets/fonts/OFL.txt"), "Falta la licencia de la fuente");
assert(existsSync("assets/compartir.png"), "Falta la imagen para compartir");
console.log(
  `HTML, CSS, ARIA, navegación y ${checked} referencias locales comprobados.`,
);
