// The deliberate way into Labs (docs/CLOUDFLARE.md#labs): typing "labs" on the home page opens
// the hidden Labs index. Labs is never linked from public pages.
const SEQUENCE = "labs";
let typed = "";

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
  typed = (typed + event.key.toLowerCase()).slice(-SEQUENCE.length);
  if (typed === SEQUENCE) window.location.assign("/labs/");
});
