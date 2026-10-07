// Écran provisoire : remplacé par la vraie époque.
export default {
  id: 'win98',
  mount(root, ctx) {
    root.innerHTML = `<div style="display:grid;place-items:center;height:100%;background:#123;color:#fff;font:20px Inter,sans-serif;text-align:center">
      <div><p>${ctx.era.system} — ${ctx.era.year}</p><button type="button" class="btn btn-primary">Valider</button></div></div>`;
    root.querySelector('button').addEventListener('click', () => ctx.complete());
    return () => {};
  },
};
