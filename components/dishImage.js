// dishImage.js
// Shared filename convention for dish/menu-item photos, used by
// menuItem.js, dishCard.js, and itemModal.js — replaces the old manual
// "image" field in data/menu.json. Instead of an editor having to set
// { "image": "some-file.jpg" } on every entry, the expected filename is
// derived straight from the item's own name and speculatively loaded;
// a caller renders an <img src="dishImagePath(item.name)"> and attaches
// its own onerror handler to drop the image area if that file doesn't
// exist yet (404), exactly like an item with no photo today.
//
// See the README's "Dish photos: filename convention" section for the
// exact naming rule new uploads should follow.

/**
 * @param {string} name
 * @returns {string} the expected filename, without extension or folder
 *   e.g. "Hawaiian Salmon (3 tacos)" -> "hawaiian-salmon-3-tacos"
 */
export function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (Côte -> cote, crème -> creme)
    .replace(/['’]/g, "") // apostrophes are dropped, not turned into a hyphen (Tommy's -> tommys)
    .replace(/[^a-z0-9]+/g, "-") // any other run of non-alphanumerics (spaces, parens, &, ...) -> one hyphen
    .replace(/^-+|-+$/g, "");
}

/**
 * @param {string} name - the dish/item's exact name as it appears in data/menu.json
 * @returns {string} the path a matching photo would need to exist at
 */
export function dishImagePath(name) {
  return `images/dishes/${slugify(name)}.jpg`;
}
