// Écran 2 — MS-DOS : lire l'aide, comprendre qu'on est sur la disquette,
// passer au disque dur avec C: et lancer Windows avec WIN.

import { createTerminal } from '../ui/terminal.js';

const n = (value) => value.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

const DIRS = {
  'A:\\': {
    label: 'n’a pas de nom',
    serial: '1A2B-3C4D',
    free: 1_345_024,
    entries: [['LISEZMOI', 'TXT', 112, '12/03/93', '10:42']],
  },
  'C:\\': {
    label: 's’appelle DISQUE_DUR',
    serial: '2F11-09C1',
    free: 87_654_400,
    entries: [
      ['DOS', null, 0, '12/03/93', '10:00'],
      ['WINDOWS', null, 0, '12/03/93', '10:05'],
      ['JEUX', null, 0, '02/04/93', '18:22'],
      ['AUTOEXEC', 'BAT', 128, '12/03/93', '10:07'],
      ['CONFIG', 'SYS', 96, '12/03/93', '10:07'],
      ['COMMAND', 'COM', 54_645, '31/05/94', '6:22'],
    ],
  },
  'C:\\DOS': {
    label: 's’appelle DISQUE_DUR',
    serial: '2F11-09C1',
    free: 87_654_400,
    entries: [
      ['.', null, 0, '12/03/93', '10:00'],
      ['..', null, 0, '12/03/93', '10:00'],
      ['EDIT', 'COM', 413, '31/05/94', '6:22'],
      ['FORMAT', 'COM', 22_974, '31/05/94', '6:22'],
      ['HIMEM', 'SYS', 29_136, '31/05/94', '6:22'],
      ['MEM', 'EXE', 32_502, '31/05/94', '6:22'],
    ],
  },
  'C:\\WINDOWS': {
    label: 's’appelle DISQUE_DUR',
    serial: '2F11-09C1',
    free: 87_654_400,
    entries: [
      ['.', null, 0, '12/03/93', '10:05'],
      ['..', null, 0, '12/03/93', '10:05'],
      ['SYSTEM', null, 0, '12/03/93', '10:05'],
      ['WIN', 'COM', 44_170, '10/03/92', '3:10'],
      ['WIN', 'INI', 3_612, '12/03/93', '10:09'],
      ['PROGMAN', 'EXE', 115_312, '10/03/92', '3:10'],
      ['SAUT', 'EXE', 19_920, '01/01/92', '0:00'],
      ['LISEZMOI', 'TXT', 64, '12/03/93', '10:05'],
    ],
  },
  'C:\\JEUX': {
    label: 's’appelle DISQUE_DUR',
    serial: '2F11-09C1',
    free: 87_654_400,
    entries: [
      ['.', null, 0, '02/04/93', '18:22'],
      ['..', null, 0, '02/04/93', '18:22'],
      ['LISEZMOI', 'TXT', 48, '02/04/93', '18:22'],
    ],
  },
};

const TEXTS = {
  'A:\\LISEZMOI.TXT': 'Windows est installé sur le disque dur, pas sur cette disquette.',
  'C:\\AUTOEXEC.BAT': '@ECHO OFF\nPROMPT $P$G\nPATH C:\\DOS;C:\\WINDOWS\nSET TEMP=C:\\WINDOWS\\TEMP',
  'C:\\CONFIG.SYS': 'DEVICE=C:\\DOS\\HIMEM.SYS\nDOS=HIGH\nFILES=30\nBUFFERS=20',
  'C:\\WINDOWS\\LISEZMOI.TXT': 'Pour lancer Windows, tapez WIN.',
  'C:\\WINDOWS\\WIN.INI': '[windows]\nload=\nrun=SAUT.EXE ?\n\n[Desktop]\nWallpaper=(aucun)',
  'C:\\JEUX\\LISEZMOI.TXT': 'Pas le temps de jouer : Windows vous attend !',
};

const HELP = [
  'Commandes disponibles :',
  '',
  '  DIR      Affiche la liste des fichiers et des répertoires.',
  '  CD       Affiche ou change le répertoire courant.',
  '  TYPE     Affiche le contenu d’un fichier texte.',
  '  CLS      Efface l’écran.',
  '  VER      Affiche la version de MS-DOS.',
  '  DATE     Affiche ou modifie la date.',
  '  WIN      Lance Microsoft Windows.',
  '',
].join('\n');

const ANACHRONISMS = {
  ls: 'On n’est pas sous Unix ici ! Sous DOS, on tape DIR.',
  cat: 'cat ? Ici, pour lire un fichier, c’est TYPE.',
  grep: 'grep ? Nous sommes chez DOS : pas de pipe magique, juste DIR et TYPE.',
  pwd: 'Le répertoire courant s’affiche dans l’invite, juste avant le >.',
  clear: 'CLEAR ? Sous DOS, on efface l’écran avec CLS.',
  sudo: 'SUDO ? Sous DOS, tout le monde est administrateur… ce n’est pas toujours une bonne idée.',
  man: 'MAN ? Ici, on tape HELP.',
  exit: 'Vous êtes déjà dans MS-DOS : rien à quitter.',
  start: 'Le menu Démarrer n’arrivera qu’en 1995. Patience !',
  internet: 'Internet ? Il faudra un modem et quelques années de patience.',
  windows: 'Presque ! Sous DOS, Windows se lance avec une commande de trois lettres.',
};

const CHIPS = [[], ['HELP', 'DIR', 'TYPE LISEZMOI.TXT'], ['DIR', 'TYPE LISEZMOI.TXT', 'C:'], ['C:', 'WIN']];

export default {
  id: 'dos',
  era: 'MS-DOS',
  year: 1981,

  mount(root, ctx) {
    const { audio } = ctx;
    const shell = { drive: 'A', cwd: { A: '\\', C: '\\' }, launched: false, booting: false };
    const seen = new Set();
    const path = () => `${shell.drive}:${shell.cwd[shell.drive]}`;

    const wrap = document.createElement('div');
    wrap.className = 'dos phosphor';
    root.append(wrap);

    const term = createTerminal(wrap, {
      prompt: () => `${path()}>`,
      caseSensitive: false,
      cursor: 'underline',
      speed: 1400,
      label: 'MS-DOS',
      className: 'dos-term',
      onKey: () => audio.key(),
      onLine: (raw) => run(raw),
    });

    const firstTime = (name) => {
      if (seen.has(name)) return false;
      seen.add(name);
      ctx.progress();
      return true;
    };

    // ——— Système de fichiers ———

    const dirKey = (drive, cwd) => (cwd === '\\' ? `${drive}:\\` : `${drive}:${cwd}`);
    const currentDir = () => DIRS[dirKey(shell.drive, shell.cwd[shell.drive])];

    function dir() {
      const d = currentDir();
      const where = dirKey(shell.drive, shell.cwd[shell.drive]);
      const lines = [
        ` Le volume dans le lecteur ${shell.drive} ${d.label}`,
        ` Le numéro de série du volume est ${d.serial}`,
        ` Répertoire de ${where}`,
        '',
      ];
      let files = 0;
      let bytes = 0;
      for (const [name, ext, size, date, time] of d.entries) {
        const isDir = ext === null;
        if (!isDir) {
          files += 1;
          bytes += size;
        }
        const sizeText = isDir ? '<REP>'.padEnd(13) : n(size).padStart(13);
        lines.push(`${name.padEnd(8)} ${(ext ?? '').padEnd(3)} ${sizeText} ${date}  ${time.padStart(5)}`);
      }
      lines.push(`${String(files).padStart(9)} fichier(s)${n(bytes).padStart(16)} octets`);
      lines.push(`${n(d.free).padStart(36)} octets libres`);
      lines.push('');
      if (shell.drive === 'A' && firstTime('dir-a')) ctx.progress();
      return lines.join('\n');
    }

    function resolveFile(arg) {
      if (!arg) return null;
      let target = arg.toUpperCase().replace(/\//g, '\\');
      let drive = shell.drive;
      const m = /^([A-Z]):(.*)$/.exec(target);
      if (m) {
        drive = m[1];
        target = m[2];
      }
      const base = target.startsWith('\\') ? '' : shell.cwd[drive] === '\\' ? '' : shell.cwd[drive];
      const full = `${drive}:${base}\\${target.replace(/^\\/, '')}`;
      if (TEXTS[full]) return full;
      // Tolérance : LISEZMOI sans extension
      const guess = Object.keys(TEXTS).find((k) => k.startsWith(`${full}.`));
      return guess ?? null;
    }

    function type(args) {
      if (!args.length) return 'Paramètre requis manquant';
      const file = resolveFile(args.join(' '));
      if (!file) return `Fichier introuvable - ${args[0].toUpperCase()}`;
      if (file === 'A:\\LISEZMOI.TXT' && firstTime('type')) ctx.progress();
      return `${TEXTS[file]}\n`;
    }

    function cd(args) {
      const arg = args.join(' ').toUpperCase().replace(/\//g, '\\');
      if (!arg) return `${dirKey(shell.drive, shell.cwd[shell.drive])}\n`;
      if (arg === '\\') {
        shell.cwd[shell.drive] = '\\';
        return null;
      }
      if (arg === '..') {
        shell.cwd[shell.drive] = '\\';
        return null;
      }
      if (arg === '.') return null;
      const name = arg.replace(/^\\/, '').replace(/\\$/, '');
      const candidate = `${shell.drive}:\\${name}`;
      const fromHere = shell.cwd[shell.drive] === '\\' || arg.startsWith('\\') ? candidate : null;
      if (fromHere && DIRS[fromHere]) {
        shell.cwd[shell.drive] = `\\${name}`;
        return null;
      }
      return 'Répertoire non valide';
    }

    async function switchDrive(letter) {
      if (letter === 'A' || letter === 'C') {
        shell.drive = letter;
        if (letter === 'C' && firstTime('drive-c')) ctx.progress();
        return null;
      }
      if (letter === 'B') {
        audio.floppy();
        await term.print('');
        await term.print('Lecteur non prêt, lecture impossible sur le lecteur B');
        for (;;) {
          const answer = ((await term.ask('Abandon, Reprise, Échec ? ')) ?? 'a').trim().toLowerCase();
          if (answer.startsWith('r')) {
            audio.floppy();
            await term.print('Lecteur non prêt, lecture impossible sur le lecteur B');
            continue;
          }
          if (answer.startsWith('e') || answer.startsWith('é')) await term.print('Lecteur actuel non valide');
          break;
        }
        return '';
      }
      return 'Spécification de lecteur non valide';
    }

    async function date() {
      await term.print('La date du jour est : mar 12/03/1993');
      await term.ask('Entrez la nouvelle date (jj-mm-aa) : ');
      return '';
    }

    async function time() {
      await term.print('L’heure actuelle est 10:42:07,15');
      await term.ask('Entrez la nouvelle heure : ');
      return '';
    }

    async function format(args) {
      const drive = (args[0] ?? '').toUpperCase().replace(':', '') || '?';
      if (drive === '?') return 'Paramètre requis manquant';
      await term.print(`ATTENTION : TOUTES LES DONNÉES DU DISQUE ${drive}: SERONT PERDUES !`);
      const answer = (await term.ask('Continuer le formatage (O/N) ? ')) ?? '';
      return answer.trim().toLowerCase().startsWith('o')
        ? 'Formatage annulé : le voyage temporel a besoin de ce disque !\n'
        : '';
    }

    function mem() {
      return [
        '',
        'Type de mémoire       Total    Utilisée    Libre',
        '----------------  --------  ----------  --------',
        'Conventionnelle       640K        41K       599K',
        'Étendue (XMS)       3 456K       128K     3 328K',
        '',
        'Taille maximale d’un programme exécutable : 599K',
        '',
      ].join('\n');
    }

    async function launchWindows() {
      if (shell.drive !== 'C') {
        ctx.error();
        return 'Commande ou nom de fichier incorrect';
      }
      shell.launched = true;
      term.setBusy(true);
      ctx.note('C: puis WIN', { key: 'dos-win', label: 'Lancer Windows' });
      audio.hdd(1.4);
      await ctx.wait(350);
      term.clear();
      wrap.classList.add('dos-launching');
      await ctx.wait(1200);
      ctx.complete();
      return null;
    }

    // ——— Interpréteur ———

    async function run(raw) {
      let line = raw.trim().replace(/^cd(\.\.|\\)/i, 'cd $1');
      if (!line) return null;
      const lower = line.toLowerCase();
      const [first, ...args] = line.split(/\s+/);
      const name = first.toLowerCase();

      if (/^[a-z]:$/.test(name)) return switchDrive(name[0].toUpperCase());

      // Lancer un programme par son chemin : C:WIN, C:\WINDOWS\WIN.COM…
      const program = name.replace(/^[a-z]:/, '').replace(/^\\?(windows\\)?/, '');
      const onC = /^c:/.test(name) || shell.drive === 'C';
      if (['win', 'win.com', 'progman', 'progman.exe'].includes(program) && (onC || /^c:/.test(name))) {
        if (/^c:/.test(name)) shell.drive = 'C';
        return launchWindows();
      }
      if (program === 'saut' || program === 'saut.exe') {
        return 'Ce programme nécessite Microsoft Windows.';
      }

      switch (name) {
        case 'help':
        case 'aide':
        case '?':
          firstTime('help');
          return HELP;
        case 'dir':
          return dir(args);
        case 'cd':
        case 'chdir':
          return cd(args);
        case 'type':
          return type(args);
        case 'cls':
          term.clear();
          return null;
        case 'ver':
          return '\nMS-DOS version 6.22\n';
        case 'date':
          return date();
        case 'time':
          return time();
        case 'echo':
          return line.slice(5) || 'ECHO est actif';
        case 'mem':
          return mem();
        case 'format':
          return format(args);
        case 'edit':
          return 'L’éditeur n’est pas sur cette disquette. Et puis, vous avez un voyage à poursuivre !';
        case 'win':
          return launchWindows();
        default:
          break;
      }

      if (ANACHRONISMS[name]) return ANACHRONISMS[name];
      if (lower.startsWith('www') || lower.includes('http')) return ANACHRONISMS.internet;
      ctx.error();
      return 'Commande ou nom de fichier incorrect';
    }

    // ——— Démarrage : BIOS, mémoire, disquette ———

    async function boot() {
      shell.booting = true;
      shell.drive = 'A';
      shell.cwd = { A: '\\', C: '\\' };
      term.setBusy(true);
      term.clear();
      wrap.classList.remove('dos-launching');
      const skip = { skippable: true };
      await ctx.wait(350, skip);
      await term.print('BIOS 386 v1.10  (C) 1991', { speed: 0, cls: 'dos-bright' });
      await term.print('Processeur 80386DX à 33 MHz\n', { speed: 0 });
      const memRow = term.row('Test mémoire :      0 Ko');
      for (let k = 0; k <= 640; k += 32) {
        memRow.textContent = `Test mémoire : ${String(k).padStart(6)} Ko`;
        await ctx.wait(26, skip);
      }
      memRow.textContent += ' OK';
      audio.beep(1050, 0.07);
      await ctx.wait(300, skip);
      await term.print('\nLecteur A: 1,44 Mo  3½"\nDisque fixe C: 120 Mo\n', { speed: 0 });
      await ctx.wait(500, skip);
      await term.print('Démarrage depuis la disquette...', { speed: 0 });
      audio.floppy();
      await ctx.wait(1300, skip);
      term.clear();
      await term.print('Démarrage de MS-DOS...', { speed: 0 });
      await ctx.wait(800, skip);
      await term.print('\nMS-DOS version 6.22\n(C)Copyright Microsoft Corp 1981-1994.\n', { speed: 0 });
      await term.print('Tapez HELP pour obtenir la liste des commandes.\n', { speed: 0 });
      shell.booting = false;
      term.setBusy(false);
      if (!ctx.touch) term.focus();
    }

    // Ctrl+Alt+Suppr redémarre la machine et ramène à A:\>
    ctx.on(window, 'keydown', (event) => {
      if (event.ctrlKey && event.altKey && (event.key === 'Delete' || event.key === 'Del')) {
        event.preventDefault();
        if (!shell.booting && !shell.launched) boot().catch(() => {});
      }
    });

    term.setChips(CHIPS[ctx.hints.level] ?? []);
    ctx.hints.onReveal((level) => term.setChips(CHIPS[level] ?? CHIPS.at(-1)));

    boot().catch(() => {});

    return () => term.destroy();
  },
};
