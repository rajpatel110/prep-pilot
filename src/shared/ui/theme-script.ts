export const themeInitialization = `(() => {
  const key = "preppilot-theme";
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = null;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === "light" || saved === "dark") preference = saved;
  } catch {}
  function apply() {
    document.documentElement.dataset.theme = preference || (media.matches ? "dark" : "light");
    window.dispatchEvent(new Event("preppilot-theme-change"));
  }
  window.addEventListener("preppilot-theme-select", (event) => {
    if (event.detail !== "light" && event.detail !== "dark") return;
    preference = event.detail;
    try { window.localStorage.setItem(key, preference); } catch {}
    apply();
  });
  media.addEventListener("change", () => { if (!preference) apply(); });
  window.addEventListener("storage", (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = event.newValue === "light" || event.newValue === "dark" ? event.newValue : null;
    apply();
  });
  apply();
})();`;
