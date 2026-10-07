// La machine des Windows 95 et 98 : séquences de démarrage (BIOS, ScanDisk,
// logo), extinction sauvage par le bouton du boîtier, fausses manœuvres qui
// finissent en écran bleu. Chaque séquence devient caduque dès qu'une autre
// commence (on peut appuyer sur le bouton en plein démarrage).

import { createTube, bootHtml, splashHtml, bios, scandisk, bsod } from './system.js';

export function createMachine(root, ctx, opts) {
  const { audio } = ctx;
  const { variant, tower, led } = opts;
  const view = createTube(root);
  const skip = { skippable: true };
  let state = 'boot';
  let gen = 0;
  let streak = 0;
  let pendingBsod = false;

  const machine = {
    view,
    get state() {
      return state;
    },
    set state(value) {
      state = value;
    },

    // Nouvelle séquence : renvoie un test « suis-je encore d'actualité ? »
    flow() {
      const id = ++gen;
      return () => id !== gen;
    },

    stop() {
      gen += 1;
    },

    // Fausse manœuvre : erreur pour le moteur d'indices, écran bleu à la troisième
    wrong() {
      ctx.error();
      streak += 1;
      if (streak >= 3) pendingBsod = true;
    },

    async maybeBsod() {
      if (!pendingBsod || state !== 'desktop') return;
      pendingBsod = false;
      streak = 0;
      await machine.bsod(opts.bsodLines);
    },

    async bsod(lines) {
      const before = state;
      state = 'bsod';
      opts.onBsod?.();
      audio.beep(330, 0.12);
      const done = await bsod(view, ctx, { lines });
      if (done && state === 'bsod') state = before === 'bsod' ? 'desktop' : before;
      return done;
    },

    // powerOn : l'écran était éteint ; post : test du BIOS ; scan : ScanDisk ;
    // after : remplace la fenêtre d'accueil une fois le bureau affiché.
    async boot({ powerOn = false, post = false, scan = false, after = null } = {}) {
      const stale = machine.flow();
      state = 'boot';
      opts.onDestroy?.();
      tower?.setOn(true);
      led?.standby(false);
      if (post || powerOn) {
        view.show('', 'is-text');
        if (view.off) await view.powerOn(ctx);
        if (stale()) return;
        await bios(view, ctx, { variant });
        if (stale()) return;
      }
      if (scan) {
        tower?.disk(1);
        await scandisk(view, ctx);
        if (stale()) return;
      }
      view.show(bootHtml(`Démarrage de Windows ${variant}...`), 'is-text');
      tower?.disk(1.2);
      audio.hdd(1);
      await ctx.wait(1100, skip);
      if (stale()) return;
      view.show(splashHtml(variant), 'is-splash');
      tower?.disk(2.6);
      audio.hdd(2.2);
      await ctx.wait(2700, skip);
      if (stale()) return;
      const shell = opts.onBuild();
      view.hide();
      shell?.busy(900, 'working');
      audio.chime(variant === '98' ? 'win98' : 'win95');
      state = 'desktop';
      await ctx.wait(600);
      if (stale()) return;
      if (after) await after();
      else opts.onReady?.();
      if (stale()) return;
      machine.maybeBsod();
    },

    // Extinction sauvage : l'écran s'éteint, l'ordinateur redémarre tout seul
    // et ScanDisk vérifie le disque. reset : bouton Reset, sans extinction.
    async unclean({ reset = false } = {}) {
      const stale = machine.flow();
      state = 'unclean';
      machine.wrong();
      opts.onPowerLoss?.();
      tower?.setOn(false);
      if (reset) {
        view.blackout(true);
        audio.crtOff();
        await ctx.wait(500);
      } else {
        await view.powerOff(ctx);
        if (stale()) return;
        led?.standby(true);
        await ctx.wait(1500);
      }
      if (stale()) return;
      opts.onDestroy?.();
      machine.boot({ powerOn: true, scan: true });
    },

    // Couper le courant sans risque (mode MS-DOS) : simple redémarrage.
    async powerCycle() {
      const stale = machine.flow();
      state = 'unclean';
      opts.onPowerLoss?.();
      tower?.setOn(false);
      await view.powerOff(ctx);
      if (stale()) return;
      led?.standby(true);
      await ctx.wait(1300);
      if (stale()) return;
      machine.boot({ powerOn: true });
    },

    destroy() {
      gen += 1;
      view.hide();
    },
  };
  return machine;
}
