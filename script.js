const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

document.querySelectorAll("img").forEach((image) => {
  const originalPath = image.getAttribute("src");

  if (!originalPath || !originalPath.includes("assets/")) {
    return;
  }

  const filename = originalPath.split("/").pop().split("?")[0];
  const fallbackPaths = [
    `assets/${filename}`,
    `./assets/${filename}`,
    `/assets/${filename}`,
    `public/assets/${filename}`,
    `./public/assets/${filename}`,
    `/public/assets/${filename}`,
  ];
  let fallbackIndex = fallbackPaths.indexOf(originalPath) + 1;

  image.addEventListener("error", () => {
    const nextPath = fallbackPaths[fallbackIndex];
    fallbackIndex += 1;

    if (nextPath) {
      image.src = nextPath;
    }
  });
});

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (siteNav) {
  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      siteNav.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
}

const serviceTabs = document.querySelectorAll("[data-service-tab]");
const servicePanels = document.querySelectorAll("[data-service-panel]");

serviceTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const selected = tab.dataset.serviceTab;

    serviceTabs.forEach((button) => {
      const isActive = button === tab;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    servicePanels.forEach((panel) => {
      const isActive = panel.dataset.servicePanel === selected;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  });
});

const inventoryKey = "mossMekusInventory";
const adminUsersKey = "mossMekusAdmins";
const adminSessionKey = "mossMekusAdminSession";
const seededAdmins = [
  {
    email: "henrynyai19@gmail.com",
    passwordHash: "a67e5813a65dbbb71bc584c25ea4dbb2d41616a7c4b016c86db94992cf36b4c4",
  },
  {
    email: "munosunamatrust92@gmail.com",
    passwordHash: "347a9e97375ee352d5f2028c111157e041d22078d8987d7f5f1c67a4b66be522",
  },
  {
    email: "danielchijindu3@gmail.com",
    passwordHash: "7144ddd1c151bb3ce728aa871d76e80fd5ce24ca43d55c291b6a91678f43deb9",
  },
];
const shopGrid = document.querySelector("#shop-grid");
const shopEmpty = document.querySelector("#shop-empty");
const adminList = document.querySelector("#admin-list");
const inventoryForm = document.querySelector("#inventory-form");
const adminAuth = document.querySelector("#admin-auth");
const adminDashboard = document.querySelector("#admin-dashboard");
const adminRegisterForm = document.querySelector("#admin-register-form");
const adminLoginForm = document.querySelector("#admin-login-form");
const adminRegisterNote = document.querySelector("#admin-register-note");
const adminLoginNote = document.querySelector("#admin-login-note");
const adminLogout = document.querySelector("#admin-logout");
const inventoryFormTitle = document.querySelector("#inventory-form-title");
const inventorySubmit = document.querySelector("#inventory-submit");
const inventoryCancel = document.querySelector("#inventory-cancel");
const inventoryFormNote = document.querySelector("#inventory-form-note");
const shopFilters = document.querySelectorAll("[data-shop-filter]");
const galleryModal = document.querySelector("#gallery-modal");
const galleryImage = document.querySelector("#gallery-image");
const galleryCaption = document.querySelector("#gallery-caption");
const adminDatabaseWarning = document.querySelector("#admin-database-warning");
let activeShopFilter = "all";
let editingInventoryId = "";
let activeGalleryItemId = "";
let activeGalleryIndex = 0;
let localInventorySyncPromise = null;
let supabaseInventoryLoaded = false;

const supabaseConfig = window.MOSS_SUPABASE || {};
const supabaseUrl = String(supabaseConfig.url || "").replace(/\/$/, "");
const supabaseAnonKey = String(supabaseConfig.anonKey || "");
const supabaseBucket = supabaseConfig.bucket || "product-images";
const supabaseTable = supabaseConfig.table || "inventory_items";
const isSupabaseConfigured =
  supabaseUrl.startsWith("https://") &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("PASTE_") &&
  !supabaseAnonKey.includes("PASTE_");

const supabaseHeaders = (extraHeaders = {}) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  ...extraHeaders,
});

const starterInventory = [
  {
    id: "rim-set-17",
    name: "17 Inch Mag Rim Set",
    category: "Rims",
    price: "Contact for price",
    details: "Clean used rim set. Confirm PCD and vehicle fitment with the workshop.",
    status: "available",
    image: "",
    image_urls: [],
  },
  {
    id: "all-size-tyres",
    name: "Tyres In All Sizes",
    category: "Tyres",
    price: "From budget to premium",
    details: "Ask for availability by tyre size. Fitment and balancing available.",
    status: "available",
    image: "",
    image_urls: [],
  },
  {
    id: "wheel-supplies",
    name: "Wheel Accessories & Supplies",
    category: "Supplies",
    price: "Contact for price",
    details: "Valves, caps, selected wheel accessories, and workshop supplies.",
    status: "available",
    image: "",
    image_urls: [],
  },
];

const loadInventory = () => {
  if (isSupabaseConfigured) {
    return starterInventory;
  }

  const savedInventory = localStorage.getItem(inventoryKey);
  return savedInventory ? JSON.parse(savedInventory) : starterInventory;
};

let inventory = loadInventory();

const saveInventory = () => {
  if (isSupabaseConfigured) {
    return;
  }

  localStorage.setItem(inventoryKey, JSON.stringify(inventory));
};

const loadAdmins = () => {
  const savedAdmins = JSON.parse(localStorage.getItem(adminUsersKey) || "[]");

  if (savedAdmins.length >= 3) {
    return savedAdmins;
  }

  localStorage.setItem(adminUsersKey, JSON.stringify(seededAdmins));
  return seededAdmins;
};

const saveAdmins = (admins) => {
  localStorage.setItem(adminUsersKey, JSON.stringify(admins));
};

const getAdminSession = () => localStorage.getItem(adminSessionKey);

const setAdminSession = (email) => {
  localStorage.setItem(adminSessionKey, email);
};

const clearAdminSession = () => {
  localStorage.removeItem(adminSessionKey);
};

const hashPassword = async (password) => {
  const encodedPassword = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedPassword);
  return [...new Uint8Array(hashBuffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });

const normalizeImageList = (item) => {
  const imageUrls = Array.isArray(item.image_urls) ? item.image_urls : [];
  return [...imageUrls, item.image_url, item.image].filter(Boolean);
};

const normalizeInventoryItem = (item) => {
  const images = normalizeImageList(item);

  return {
    id: item.id,
    name: item.name || "",
    category: item.category || "Supplies",
    price: item.price || "Contact for price",
    details: item.details || "",
    status: item.status || "available",
    image: images[0] || "",
    image_url: images[0] || "",
    image_urls: images,
  };
};

const handleSupabaseResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Supabase request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const fetchSupabaseInventory = async () => {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${supabaseTable}?select=*&order=created_at.desc`,
    {
      headers: supabaseHeaders(),
    },
  );
  const items = await handleSupabaseResponse(response);
  inventory = items.map(normalizeInventoryItem);
  supabaseInventoryLoaded = true;
  renderInventory();
};

const createSupabaseItem = async (item) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${supabaseTable}`, {
    method: "POST",
    headers: supabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify({
      name: item.name,
      category: item.category,
      price: item.price,
      details: item.details,
      status: item.status,
      image_url: item.image_url || item.image || "",
      image_urls: item.image_urls || [],
    }),
  });
  const createdItems = await handleSupabaseResponse(response);
  return normalizeInventoryItem(createdItems[0]);
};

const updateSupabaseItem = async (itemId, updates) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${supabaseTable}?id=eq.${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    headers: supabaseHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(updates),
  });
  await handleSupabaseResponse(response);
};

const deleteSupabaseItem = async (itemId) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${supabaseTable}?id=eq.${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    headers: supabaseHeaders(),
  });
  await handleSupabaseResponse(response);
};

const uploadSupabaseImage = async (file) => {
  if (!file || !file.name) {
    return "";
  }

  const extension = file.name.split(".").pop() || "jpg";
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const imagePath = `listings/${Date.now()}-${safeName || "product"}.${extension}`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${supabaseBucket}/${imagePath}`, {
    method: "POST",
    headers: supabaseHeaders({
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    }),
    body: file,
  });
  await handleSupabaseResponse(response);
  return `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${imagePath}`;
};

const uploadSupabaseImages = async (files) => Promise.all(files.map((file) => uploadSupabaseImage(file)));

const uploadSupabaseDataUrl = async (dataUrl, itemName, index) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const extension =
    {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    }[mimeType] || "jpg";
  const safeName = `${itemName || "product"}-${index + 1}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const file = new File([blob], `${safeName || "product"}.${extension}`, { type: mimeType });
  return uploadSupabaseImage(file);
};

const loadLocalInventoryBackup = () => {
  try {
    const savedInventory = JSON.parse(localStorage.getItem(inventoryKey) || "[]");
    return Array.isArray(savedInventory) ? savedInventory : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const isStarterInventoryItem = (item) => starterInventory.some((starterItem) => starterItem.id === item.id);

const hasMatchingRemoteItem = (localItem) =>
  inventory.some(
    (remoteItem) =>
      remoteItem.name === localItem.name &&
      remoteItem.price === localItem.price &&
      remoteItem.details === localItem.details &&
      remoteItem.category === localItem.category,
  );

const normalizeMigratedImages = async (item) => {
  const images = normalizeImageList(item);
  return Promise.all(
    images.map((image, index) =>
      String(image).startsWith("data:") ? uploadSupabaseDataUrl(image, item.name, index) : image,
    ),
  );
};

const syncLocalInventoryToSupabase = async () => {
  if (!isSupabaseConfigured || !inventoryForm || !getAdminSession() || !supabaseInventoryLoaded) {
    return;
  }

  if (localInventorySyncPromise) {
    return localInventorySyncPromise;
  }

  localInventorySyncPromise = (async () => {
    const localItems = loadLocalInventoryBackup().filter(
      (item) => item?.name && !isStarterInventoryItem(item) && !hasMatchingRemoteItem(item),
    );

    if (localItems.length === 0) {
      return;
    }

    inventoryFormNote.textContent = "Syncing saved listings to Supabase so clients can see them...";

    for (const localItem of localItems) {
      const uploadedImages = await normalizeMigratedImages(localItem);
      const createdItem = await createSupabaseItem({
        name: localItem.name,
        category: localItem.category || "Supplies",
        price: localItem.price || "Contact for price",
        details: localItem.details || "",
        status: localItem.status || "available",
        image: uploadedImages[0] || "",
        image_url: uploadedImages[0] || "",
        image_urls: uploadedImages,
      });
      inventory = [createdItem, ...inventory];
    }

    localStorage.removeItem(inventoryKey);
    renderInventory();
    inventoryFormNote.textContent = `${localItems.length} saved listing${
      localItems.length === 1 ? "" : "s"
    } synced to the client shop.`;
  })().catch((error) => {
    console.error(error);
    inventoryFormNote.textContent =
      "Some saved listings could not sync. Please refresh and try adding the listing again.";
  });

  return localInventorySyncPromise;
};

const itemImageMarkup = (item) => {
  const images = normalizeImageList(item);
  const imageSource = images[0];

  if (imageSource) {
    return `
      <button class="stock-image-button" type="button" data-gallery-item="${escapeHtml(item.id)}" data-gallery-index="0" aria-label="View larger photos of ${escapeHtml(item.name)}">
        <img src="${escapeHtml(imageSource)}" alt="${escapeHtml(item.name)}" loading="lazy" />
      </button>
      ${
        images.length > 1
          ? `<div class="stock-thumbs" aria-label="${escapeHtml(item.name)} image gallery">
              ${images
                .slice(0, 4)
                .map(
                  (image, index) => `
                    <button type="button" data-gallery-item="${escapeHtml(item.id)}" data-gallery-index="${index}" aria-label="View ${escapeHtml(item.name)} photo ${index + 1}">
                      <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)} photo ${index + 1}" loading="lazy" />
                    </button>
                  `,
                )
                .join("")}
              ${images.length > 4 ? `<span>+${images.length - 4}</span>` : ""}
            </div>`
          : ""
      }
    `;
  }

  return `<div class="item-placeholder">${escapeHtml(item.category)}</div>`;
};

const renderShop = () => {
  if (!shopGrid || !shopEmpty) {
    return;
  }

  const visibleItems = inventory.filter((item) => {
    const matchesFilter = activeShopFilter === "all" || item.category === activeShopFilter;
    return matchesFilter;
  });

  shopGrid.innerHTML = visibleItems
    .map(
      (item) => `
        <article class="stock-card ${item.status === "sold" ? "is-sold" : ""}">
          <div class="stock-media">
            ${itemImageMarkup(item)}
            <span class="stock-status">${item.status === "sold" ? "Sold" : "Available"}</span>
          </div>
          <div class="stock-body">
            <span class="stock-category">${escapeHtml(item.category)}</span>
            <h3>${escapeHtml(item.name)}</h3>
            <strong>${escapeHtml(item.price)}</strong>
            <p>${escapeHtml(item.details)}</p>
            <a href="https://wa.me/27681656964?text=${encodeURIComponent(`Hello MOSS MEKUS, I am interested in: ${item.name}`)}" target="_blank" rel="noopener">Enquire on WhatsApp</a>
          </div>
        </article>
      `,
    )
    .join("");

  shopEmpty.hidden = visibleItems.length > 0;
};

const renderAdmin = () => {
  if (!adminList) {
    return;
  }

  if (!getAdminSession()) {
    adminList.innerHTML = "";
    return;
  }

  adminList.innerHTML = inventory
    .map(
      (item) => `
        <article class="admin-item">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.category)} · ${escapeHtml(item.price)} · ${item.status === "sold" ? "Sold" : "Available"}</span>
            <p>${escapeHtml(item.details)}</p>
          </div>
          <div class="admin-actions">
            <button type="button" data-inventory-action="edit" data-item-id="${item.id}">Edit</button>
            <button type="button" data-inventory-action="toggle" data-item-id="${item.id}">
              ${item.status === "sold" ? "Mark Available" : "Mark Sold"}
            </button>
            <button type="button" class="danger-action" data-inventory-action="remove" data-item-id="${item.id}">Delete Listing</button>
          </div>
        </article>
      `,
    )
    .join("");
};

const renderInventory = () => {
  renderShop();
  renderAdmin();
};

const updateDatabaseStatus = () => {
  if (adminDatabaseWarning) {
    adminDatabaseWarning.hidden = isSupabaseConfigured;
  }

  if (inventoryForm && adminDashboard) {
    inventoryForm.classList.toggle("is-disabled", !isSupabaseConfigured);
    inventoryFormNote.textContent = isSupabaseConfigured
      ? "Select one or more photos. Photos upload to Supabase and appear on the client shop."
      : "Listings cannot be published yet because Supabase is not connected. Ask the site owner to add the Supabase URL and anon key.";
  }
};

const renderGallery = () => {
  if (!galleryModal || !galleryImage || !galleryCaption) {
    return;
  }

  const item = inventory.find((inventoryItem) => inventoryItem.id === activeGalleryItemId);
  const images = item ? normalizeImageList(item) : [];

  if (!item || images.length === 0) {
    galleryModal.hidden = true;
    document.body.classList.remove("gallery-open");
    return;
  }

  activeGalleryIndex = (activeGalleryIndex + images.length) % images.length;
  galleryImage.src = images[activeGalleryIndex];
  galleryImage.alt = `${item.name} photo ${activeGalleryIndex + 1}`;
  galleryCaption.textContent = `${item.name} - photo ${activeGalleryIndex + 1} of ${images.length}`;
};

const openGallery = (itemId, imageIndex = 0) => {
  if (!galleryModal) {
    return;
  }

  activeGalleryItemId = itemId;
  activeGalleryIndex = imageIndex;
  galleryModal.hidden = false;
  document.body.classList.add("gallery-open");
  renderGallery();
};

const closeGallery = () => {
  if (!galleryModal) {
    return;
  }

  galleryModal.hidden = true;
  document.body.classList.remove("gallery-open");
};

const moveGallery = (step) => {
  activeGalleryIndex += step;
  renderGallery();
};

const updateAdminAccessView = () => {
  if (!adminAuth || !adminDashboard) {
    return;
  }

  const admins = loadAdmins();
  const activeAdmin = getAdminSession();
  const registrationClosed = admins.length >= 3;

  adminAuth.hidden = Boolean(activeAdmin);
  adminDashboard.hidden = !activeAdmin;

  if (adminRegisterForm && adminRegisterNote) {
    adminRegisterForm.hidden = registrationClosed;
    adminRegisterNote.textContent = registrationClosed
      ? "Admin registration is closed. The maximum of 3 admins has been reached."
      : `${3 - admins.length} admin registration ${3 - admins.length === 1 ? "slot" : "slots"} remaining.`;
  }

  if (activeAdmin) {
    renderAdmin();
    syncLocalInventoryToSupabase();
  }

  updateDatabaseStatus();
};

const setInventoryFormMode = (item = null) => {
  if (!inventoryForm) {
    return;
  }

  editingInventoryId = item?.id || "";
  inventoryForm.elements["item-id"].value = editingInventoryId;

  if (item) {
    inventoryForm.elements.name.value = item.name || "";
    inventoryForm.elements.category.value = item.category || "Rims";
    inventoryForm.elements.price.value = item.price || "";
    inventoryForm.elements.details.value = item.details || "";
    inventoryForm.elements.image.value = "";
    inventoryFormTitle.textContent = "Edit Listing";
    inventorySubmit.textContent = "Save Changes";
    inventoryCancel.hidden = false;
    inventoryFormNote.textContent = `Leave photos empty to keep the current ${normalizeImageList(item).length || 0} listing photo(s). Selecting new photos replaces the gallery.`;
    inventoryForm.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  inventoryForm.reset();
  inventoryFormTitle.textContent = "Add New Listing";
  inventorySubmit.textContent = "Add Item";
  inventoryCancel.hidden = true;
  inventoryFormNote.textContent =
    "Photos upload to Supabase when connected. Until then, listings use this browser for preview.";
};

const readImageFile = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.readAsDataURL(file);
  });

const readImageFiles = async (files) => Promise.all(files.map((file) => readImageFile(file)));

shopFilters.forEach((button) => {
  button.addEventListener("click", () => {
    activeShopFilter = button.dataset.shopFilter;
    shopFilters.forEach((filterButton) => {
      filterButton.classList.toggle("is-active", filterButton === button);
    });
    renderShop();
  });
});

if (shopGrid) {
  shopGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-gallery-item]");

    if (!button) {
      return;
    }

    openGallery(button.dataset.galleryItem, Number(button.dataset.galleryIndex || 0));
  });
}

if (galleryModal) {
  galleryModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-gallery-close]")) {
      closeGallery();
    }

    if (event.target.closest("[data-gallery-prev]")) {
      moveGallery(-1);
    }

    if (event.target.closest("[data-gallery-next]")) {
      moveGallery(1);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (galleryModal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeGallery();
    }

    if (event.key === "ArrowLeft") {
      moveGallery(-1);
    }

    if (event.key === "ArrowRight") {
      moveGallery(1);
    }
  });
}

if (inventoryForm) {
  inventoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!getAdminSession()) {
      return;
    }

    if (!isSupabaseConfigured) {
      updateDatabaseStatus();
      alert("Listings cannot be published to clients yet because Supabase is not connected.");
      return;
    }

    const formData = new FormData(inventoryForm);

    try {
      const imageFiles = formData.getAll("image").filter((file) => file && file.name);
      const selectedItem = inventory.find((item) => item.id === editingInventoryId);
      const selectedImages = selectedItem ? normalizeImageList(selectedItem) : [];
      const hasNewImages = imageFiles.length > 0;
      const uploadedImages = hasNewImages
        ? isSupabaseConfigured
          ? await uploadSupabaseImages(imageFiles)
          : await readImageFiles(imageFiles)
        : selectedImages;
      const item = {
        id: editingInventoryId || `item-${Date.now()}`,
        name: formData.get("name"),
        category: formData.get("category"),
        price: formData.get("price"),
        details: formData.get("details"),
        status: selectedItem?.status || "available",
        image: uploadedImages[0] || "",
        image_url: uploadedImages[0] || "",
        image_urls: uploadedImages,
      };

      if (editingInventoryId) {
        if (isSupabaseConfigured) {
          await updateSupabaseItem(editingInventoryId, {
            name: item.name,
            category: item.category,
            price: item.price,
            details: item.details,
            status: item.status,
            image_url: item.image_url,
            image_urls: item.image_urls,
          });
        }

        inventory = inventory.map((inventoryItem) => (inventoryItem.id === editingInventoryId ? item : inventoryItem));
        saveInventory();
      } else if (isSupabaseConfigured) {
        const createdItem = await createSupabaseItem(item);
        inventory = [createdItem, ...inventory];
      }

      if (isSupabaseConfigured) {
        await fetchSupabaseInventory();
      }

      renderInventory();
      setInventoryFormMode();
      inventoryFormNote.textContent = "Listing saved to the client shop.";
    } catch (error) {
      console.error(error);
      alert("The listing could not be saved. Please check the image and try again.");
    }
  });
}

if (adminRegisterForm) {
  adminRegisterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
  const admins = loadAdmins();
  const formData = new FormData(adminRegisterForm);
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));

  if (admins.length >= 3) {
    adminRegisterNote.textContent = "Admin registration is closed. The maximum of 3 admins has been reached.";
    adminRegisterForm.hidden = true;
    return;
  }

  if (admins.some((admin) => admin.email === email)) {
    adminRegisterNote.textContent = "This email is already registered as an admin.";
    return;
  }

  const passwordHash = await hashPassword(password);
  const updatedAdmins = [...admins, { email, passwordHash }];
  saveAdmins(updatedAdmins);
  setAdminSession(email);
  adminRegisterForm.reset();
  adminRegisterNote.textContent = "";
  updateAdminAccessView();
  });
}

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
  const admins = loadAdmins();
  const formData = new FormData(adminLoginForm);
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  const passwordHash = await hashPassword(password);
  const admin = admins.find((adminUser) => adminUser.email === email);

  if (!admin || admin.passwordHash !== passwordHash) {
    adminLoginNote.textContent = "Login failed. Use one of the registered admin emails.";
    return;
  }

  setAdminSession(email);
  adminLoginForm.reset();
  adminLoginNote.textContent = "";
  updateAdminAccessView();
  });
}

if (adminLogout) {
  adminLogout.addEventListener("click", () => {
    clearAdminSession();
    updateAdminAccessView();
  });
}

if (inventoryCancel) {
  inventoryCancel.addEventListener("click", () => {
    setInventoryFormMode();
  });
}

if (adminList) {
  adminList.addEventListener("click", async (event) => {
    if (!getAdminSession()) {
      return;
    }

    const button = event.target.closest("button[data-inventory-action]");
    if (!button) {
      return;
    }

    const itemId = button.dataset.itemId;
    const action = button.dataset.inventoryAction;

    try {
      if (action === "edit") {
        const selectedItem = inventory.find((item) => item.id === itemId);

        if (selectedItem) {
          setInventoryFormMode(selectedItem);
        }

        return;
      }

      if (action === "toggle") {
        const selectedItem = inventory.find((item) => item.id === itemId);
        const nextStatus = selectedItem?.status === "sold" ? "available" : "sold";

        if (isSupabaseConfigured) {
          await updateSupabaseItem(itemId, { status: nextStatus });
        }

        inventory = inventory.map((item) => (item.id === itemId ? { ...item, status: nextStatus } : item));
      }

      if (action === "remove") {
        const selectedItem = inventory.find((item) => item.id === itemId);
        const shouldDelete = confirm(`Delete ${selectedItem?.name || "this listing"} from the public shop?`);

        if (!shouldDelete) {
          return;
        }

        if (isSupabaseConfigured) {
          await deleteSupabaseItem(itemId);
        }

        inventory = inventory.filter((item) => item.id !== itemId);

        if (editingInventoryId === itemId) {
          setInventoryFormMode();
        }
      }

      saveInventory();
      renderInventory();
    } catch (error) {
      console.error(error);
      alert("The listing could not be updated. Please try again.");
    }
  });
}

renderInventory();
updateAdminAccessView();
updateDatabaseStatus();

if (isSupabaseConfigured) {
  fetchSupabaseInventory().catch((error) => {
    console.error(error);
    if (shopEmpty && inventory.length === 0) {
      shopEmpty.hidden = false;
      shopEmpty.textContent = "Stock could not load right now. Please contact us on WhatsApp.";
    }
  }).then(() => syncLocalInventoryToSupabase());
}

document.querySelector(".quote-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = formData.get("name") || "Customer";
  const phone = formData.get("phone") || "Not provided";
  const service = formData.get("service") || "General enquiry";
  const message = formData.get("message") || "Please contact me about your services.";
  const whatsappNumber = "27681656964";
  const whatsappMessage = [
    "Hello MOSS MEKUS MAG WHEEL & TYRES,",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Service needed: ${service}`,
    `Message: ${message}`,
  ].join("\n");

  window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
});
