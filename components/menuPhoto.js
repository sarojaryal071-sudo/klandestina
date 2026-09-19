// menuPhoto.js
// The Menu section's image column — a small rotating, crossfading set of
// purely ambient/decorative images per active category tab (not tied to
// any specific menu item). Mirrors the Story section's photo treatment
// (.soft-fade-img — see style.css) so the two asymmetric sections read as
// one system, just on opposite sides.
//
// There's no dedicated photography per category yet, so each set below
// reuses existing images/dishes/ photos as filler — loosely on-theme, not
// claiming to depict a specific dish in that category (see README's
// "Known gaps"). Categories with no photo that would look right at all
// (Desserts — none of the existing photos are dessert-appropriate, and
// showing a savory dish there would actively mislead rather than just
// look generic) fall back to the same radial-glow ambient treatment
// .section-ambient uses elsewhere, instead of a wrong-looking photo.

const CATEGORY_IMAGES = {
  lunch: ["pork-chili-ancho-bowl.jpg", "frijoles-con-veneno.jpg"],
  starters: ["tuna-poke.jpg", "kuha-ceviche.jpg"],
  tacos: ["quesabirria-1.jpg", "quesabirria-2.jpg", "pork-chili-ancho-bowl.jpg"],
  chilaquiles: ["frijoles-con-veneno.jpg"],
  desserts: [],
  drinks: ["tommys-margarita.jpg"]
};

const ROTATE_MS = 4000;

let rotateTimer = null;

/**
 * @param {HTMLElement} container
 * @returns {{ setCategory(categoryId: string): void }}
 */
export function renderMenuPhoto(container) {
  container.innerHTML = `
    <div class="menu-photo-frame">
      <div class="menu-photo-ambient"></div>
      <div class="menu-photo-wash soft-fade-img"></div>
    </div>
  `;
  return { setCategory: (categoryId) => showCategory(container, categoryId) };
}

function showCategory(container, categoryId) {
  clearInterval(rotateTimer);
  const frame = container.querySelector(".menu-photo-frame");
  const images = CATEGORY_IMAGES[categoryId] || [];

  frame.querySelectorAll(".menu-photo-img").forEach((el) => el.remove());
  frame.classList.toggle("menu-photo-frame--ambient-only", images.length === 0);
  if (images.length === 0) return;

  images.forEach((file, i) => {
    const img = document.createElement("img");
    img.className = i === 0 ? "menu-photo-img soft-fade-img menu-photo-img--active" : "menu-photo-img soft-fade-img";
    img.src = `images/dishes/${file}`;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    frame.appendChild(img);
  });

  if (images.length > 1) {
    let index = 0;
    rotateTimer = setInterval(() => {
      const imgs = frame.querySelectorAll(".menu-photo-img");
      imgs[index].classList.remove("menu-photo-img--active");
      index = (index + 1) % imgs.length;
      imgs[index].classList.add("menu-photo-img--active");
    }, ROTATE_MS);
  }
}
