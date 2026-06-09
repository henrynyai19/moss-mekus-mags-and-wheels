const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
const priorityWord = document.querySelector("#priority-word");
const eventsTab = document.querySelector(".events-tab");
const revealItems = document.querySelectorAll(".reveal");
const countdownCard = document.querySelector(".countdown-card");
const countdownValues = document.querySelectorAll("#early-bird-countdown strong");

document.documentElement.classList.add("js");

const priorities = [
  "Market Access",
  "SME Growth",
  "Trusted Trade",
  "Investment Flow"
];

let priorityIndex = 0;

menuToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

eventsTab?.addEventListener("click", () => {
  window.location.hash = "wisdom-program";
  document.querySelector("#wisdom-program")?.scrollIntoView({ behavior: "smooth" });
});

window.setInterval(() => {
  priorityIndex = (priorityIndex + 1) % priorities.length;
  priorityWord.textContent = priorities[priorityIndex];
}, 2400);

const earlyBirdDeadline = new Date("2026-06-25T23:59:59+02:00").getTime();

function updateCountdown() {
  if (!countdownCard || countdownValues.length !== 4) {
    return;
  }

  const distance = earlyBirdDeadline - Date.now();

  if (distance <= 0) {
    countdownCard.classList.add("is-ended");
    countdownValues[0].textContent = "Early Bird has ended. Normal tickets are now R1100.";
    countdownValues[1].textContent = "";
    countdownValues[2].textContent = "";
    countdownValues[3].textContent = "";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  [days, hours, minutes, seconds].forEach((value, index) => {
    countdownValues[index].textContent = String(value).padStart(2, "0");
  });
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach(item => revealObserver.observe(item));
