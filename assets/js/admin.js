(function () {
  const storageKey = "kgrs-site-data";
  let data = null;

  const form = document.getElementById("content-form");
  const programmeEditor = document.getElementById("programme-editor");
  const galleryEditor = document.getElementById("gallery-editor");
  const status = document.getElementById("admin-status");
  const preview = document.getElementById("site-preview");

  function getPath(source, path) {
    return path.split(".").reduce((value, key) => value && value[key], source);
  }

  function setPath(target, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const parent = keys.reduce((object, key) => {
      object[key] = object[key] || {};
      return object[key];
    }, target);
    parent[last] = value;
  }

  async function loadData() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    const response = await fetch("assets/data/site-data.json", { cache: "no-store" });
    return response.json();
  }

  function fillForm() {
    form.querySelectorAll("[name]").forEach((input) => {
      input.value = getPath(data, input.name) || "";
    });
    renderProgrammes();
    renderGallery();
  }

  function collectForm() {
    form.querySelectorAll("[name]").forEach((input) => {
      setPath(data, input.name, input.value.trim());
    });
  }

  function renderProgrammes() {
    programmeEditor.innerHTML = "";
    data.programmes = data.programmes || [];
    data.programmes.forEach((programme, index) => {
      const item = document.createElement("div");
      item.className = "repeat-item";
      item.innerHTML = `
        <div class="repeat-head">
          <strong>Programme ${index + 1}</strong>
          <button class="remove-button" type="button">Remove</button>
        </div>
        <label>Title <input value=""></label>
        <label>Description <textarea rows="3"></textarea></label>
      `;
      const title = item.querySelector("input");
      const text = item.querySelector("textarea");
      title.value = programme.title || "";
      text.value = programme.text || "";
      title.addEventListener("input", () => {
        programme.title = title.value;
      });
      text.addEventListener("input", () => {
        programme.text = text.value;
      });
      item.querySelector("button").addEventListener("click", () => {
        data.programmes.splice(index, 1);
        renderProgrammes();
      });
      programmeEditor.appendChild(item);
    });
  }

  function renderGallery() {
    galleryEditor.innerHTML = "";
    data.gallery = data.gallery || [];
    data.gallery.forEach((image, index) => {
      const item = document.createElement("div");
      item.className = "repeat-item";
      item.innerHTML = `
        <div class="repeat-head">
          <strong>Image ${index + 1}</strong>
          <button class="remove-button" type="button">Remove</button>
        </div>
        <label>Image Path <input class="image-src" value=""></label>
        <label>Caption / Alt Text <input class="image-alt" value=""></label>
        <label>Preview Upload <input class="image-file" type="file" accept="image/*"></label>
      `;
      const src = item.querySelector(".image-src");
      const alt = item.querySelector(".image-alt");
      const file = item.querySelector(".image-file");
      src.value = image.src || "";
      alt.value = image.alt || "";
      src.addEventListener("input", () => {
        image.src = src.value;
      });
      alt.addEventListener("input", () => {
        image.alt = alt.value;
      });
      file.addEventListener("change", () => {
        const selected = file.files[0];
        if (!selected) return;
        const reader = new FileReader();
        reader.onload = () => {
          image.src = reader.result;
          src.value = reader.result;
          status.textContent = "Image added to this browser preview. Upload the actual image file to GoDaddy for public publishing.";
        };
        reader.readAsDataURL(selected);
      });
      item.querySelector("button").addEventListener("click", () => {
        data.gallery.splice(index, 1);
        renderGallery();
      });
      galleryEditor.appendChild(item);
    });
  }

  function savePreview() {
    collectForm();
    localStorage.setItem(storageKey, JSON.stringify(data));
    status.textContent = "Saved preview in this browser.";
    preview.src = `index.html?preview=${Date.now()}`;
  }

  function downloadJson() {
    collectForm();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "site-data.json";
    link.click();
    URL.revokeObjectURL(url);
    status.textContent = "Exported site-data.json.";
  }

  document.getElementById("add-programme").addEventListener("click", () => {
    data.programmes.push({ title: "New Programme", text: "Programme details" });
    renderProgrammes();
  });

  document.getElementById("add-gallery").addEventListener("click", () => {
    data.gallery.push({ src: "assets/images/new-photo.jpeg", alt: "New activity photo" });
    renderGallery();
  });

  document.getElementById("export-data").addEventListener("click", downloadJson);

  document.getElementById("reset-data").addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    status.textContent = "Preview reset. Reloading original site data.";
    setTimeout(() => window.location.reload(), 400);
  });

  document.getElementById("import-data").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        data = JSON.parse(reader.result);
        fillForm();
        status.textContent = "Imported JSON. Use Save Preview to apply it here.";
      } catch (error) {
        status.textContent = "Could not import JSON. Please check the file format.";
      }
    };
    reader.readAsText(file);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    savePreview();
  });

  loadData().then((loaded) => {
    data = loaded;
    fillForm();
  }).catch(() => {
    status.textContent = "Could not load assets/data/site-data.json.";
  });
})();
