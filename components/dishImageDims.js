// dishImageDims.js
// Intrinsic pixel dimensions for every file in images/dishes/, so every
// <img> that points there can carry real width/height attributes (the
// browser then reserves the right amount of space before the image has
// loaded, instead of the layout jumping once it does). Not generated —
// just real measured sizes, one entry per file; re-measure and update by
// hand if a dish photo is ever replaced with a different-sized file.

export const DISH_IMAGE_DIMS = {
  "espresso-martinez-1.jpg": { w: 1200, h: 670 },
  "espresso-martinez-2.jpg": { w: 1200, h: 669 },
  "espresso-martinez-3.jpg": { w: 1200, h: 664 },
  "frijoles-con-veneno.jpg": { w: 1000, h: 667 },
  "frijoles-con-veneno-vegan-2.jpg": { w: 1200, h: 670 },
  "killers-chilaquiles-2.jpg": { w: 1200, h: 662 },
  "kuha-ceviche.jpg": { w: 1000, h: 655 },
  "mexican-tuna-poke.jpg": { w: 1000, h: 562 },
  "picadillo-with-chorizo.jpg": { w: 1200, h: 671 },
  "pork-in-chili-ancho.jpg": { w: 1000, h: 550 },
  "pork-in-chili-ancho-lunch.jpg": { w: 1284, h: 711 },
  "quesabirria-2.jpg": { w: 1000, h: 567 },
  "quesabirria-3.jpg": { w: 1200, h: 661 },
  "quesabirria.jpg": { w: 1000, h: 550 },
  "sea-bass-in-mango-salsa.jpg": { w: 1284, h: 717 },
  "tommys-margarita-2.jpg": { w: 1200, h: 662 },
  "tofu-in-salsa-roja.jpg": { w: 1284, h: 713 },
  "tommys-margarita.jpg": { w: 883, h: 706 }
};

/**
 * @param {string} file - filename inside images/dishes/
 * @returns {string} ` width="…" height="…"` (with a leading space) if the
 *   file's dimensions are known, or "" otherwise — so a call site can just
 *   splice this straight into an <img> tag's attribute list either way.
 */
export function dishImageSizeAttrs(file) {
  const dims = DISH_IMAGE_DIMS[file];
  return dims ? ` width="${dims.w}" height="${dims.h}"` : "";
}
