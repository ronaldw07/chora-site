// Fades each .reveal element up into place the first time it scrolls into
// view. Siblings that arrive together are staggered slightly.

const STAGGER_MS = 70;

const observer = new IntersectionObserver(
  (entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry, index) => {
        entry.target.style.transitionDelay = `${index * STAGGER_MS}ms`;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
  },
  { rootMargin: "0px 0px -60px 0px" }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
