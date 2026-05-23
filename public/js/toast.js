const el = document.getElementById('toast');
let timer = null;

export function showToast(message, opts = {}) {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('error', Boolean(opts.error));
  el.hidden = false;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    el.hidden = true;
  }, opts.duration ?? 4000);
}
