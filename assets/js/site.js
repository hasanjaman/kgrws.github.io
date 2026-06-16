(function () {
  const storageKey = "kgrs-site-data";

  function getPath(source, path) {
    return path.split(".").reduce((value, key) => value && value[key], source);
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value || "";
    });
  }

  async function loadData() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    }

    const response = await fetch("assets/data/site-data.json", { cache: "no-store" });
    return response.json();
  }

  function render(data) {
    document.querySelectorAll("[data-field]").forEach((element) => {
      element.textContent = getPath(data, element.dataset.field) || "";
    });

    const heroImage = document.getElementById("hero-image");
    if (heroImage && data.hero && data.hero.image) {
      heroImage.src = data.hero.image;
      heroImage.alt = data.hero.title || "Kumbhira Green Rural Welfare Society activity";
    }

    const programmeList = document.getElementById("programme-list");
    if (programmeList) {
      programmeList.innerHTML = "";
      (data.programmes || []).forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "programme-card";
        card.innerHTML = `<span>${index + 1}</span><h3></h3><p></p>`;
        card.querySelector("h3").textContent = item.title || "";
        card.querySelector("p").textContent = item.text || "";
        programmeList.appendChild(card);
      });
    }

    const galleryList = document.getElementById("gallery-list");
    if (galleryList) {
      galleryList.innerHTML = "";
      (data.gallery || []).forEach((item) => {
        const figure = document.createElement("figure");
        const image = document.createElement("img");
        const caption = document.createElement("figcaption");
        image.src = item.src;
        image.alt = item.alt || "NGO activity photograph";
        caption.textContent = item.alt || "";
        figure.append(image, caption);
        galleryList.appendChild(figure);
      });
    }

    const phoneLink = document.getElementById("phone-link");
    const emailLink = document.getElementById("email-link");
    if (phoneLink) {
      phoneLink.href = `tel:${(data.contact.phone || "").replace(/\D/g, "")}`;
    }
    if (emailLink) {
      emailLink.href = `mailto:${data.contact.email || ""}`;
    }
    setText("#year", new Date().getFullYear());
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  loadData().then(render).catch(() => {
    setText(".hero-content p:not(.eyebrow)", "Please check that assets/data/site-data.json is available.");
  });
})();
