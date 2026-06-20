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

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

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

document.querySelector(".quote-form").addEventListener("submit", (event) => {
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
