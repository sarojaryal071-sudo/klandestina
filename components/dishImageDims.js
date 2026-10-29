// dishImageDims.js
// Intrinsic pixel dimensions for every file in images/dishes/, so every
// <img> that points there can carry real width/height attributes (the
// browser then reserves the right amount of space before the image has
// loaded, instead of the layout jumping once it does). Not generated —
// there are only 7 files, so this is just their real measured sizes;
// re-measure and update by hand if a dish photo is ever replaced with a
// different-sized file.

export const DISH_IMAGE_DIMS = {
  "frijoles-con-veneno.jpg": { w: 1000, h: 667 },
  "kuha-ceviche.jpg": { w: 1000, h: 655 },
  "mexican-tuna-poke.jpg": { w: 1000, h: 562 },
  "pork-in-chili-ancho.jpg": { w: 1000, h: 550 },
  "quesabirria-2.jpg": { w: 1000, h: 567 },
  "quesabirria.jpg": { w: 1000, h: 550 },
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
