// Mini shell Unix de 1974 : pipes a | b | c, grep, cat, ls, wc, echo, who, date,
// pwd, man, ed… Aucune dépendance au DOM : run(ligne) renvoie ce qu'il faut imprimer.

import { FILES, EXIT_LINE, byteSize } from './journal.js';

const HOME = '/usr/voyageur';
const FILE_NAMES = Object.keys(FILES).sort();

const DIRS = {
  '/': ['bin', 'dev', 'etc', 'lib', 'mnt', 'tmp', 'unix', 'usr'],
  '/usr': ['bin', 'dmr', 'doug', 'ken', 'lib', 'man', 'voyageur'],
  '/bin': ['cat', 'chdir', 'date', 'ed', 'grep', 'ls', 'man', 'pwd', 'sh', 'sort', 'uniq', 'wc', 'who'],
};

const MANUAL = {
  ls: ['ls - liste le contenu d’un répertoire', 'ls [-l] [-a] [répertoire]', 'Une ligne par fichier, dans l’ordre alphabétique.'],
  cat: ['cat - imprime le contenu de fichiers', 'cat fichier…', 'Attention : cat imprime tout, jusqu’à la dernière', 'ligne. Les longs fichiers coûtent cher en papier.'],
  grep: [
    'grep - cherche un motif',
    'grep [-v] [-c] [-n] motif [fichier]',
    'Imprime chaque ligne qui contient le motif.',
    'Sans fichier, grep lit l’entrée standard, par',
    'exemple la sortie d’une autre commande :',
    '     commande | grep motif',
  ],
  wc: ['wc - compte lignes, mots et caractères', 'wc [-l] [-w] [-c] [fichier]'],
  echo: ['echo - répète ses arguments', 'echo texte…'],
  who: ['who - qui est connecté ?', 'who [am i]'],
  date: ['date - imprime la date et l’heure', 'date'],
  pwd: ['pwd - imprime le répertoire courant', 'pwd'],
  sort: ['sort - trie des lignes', 'sort [fichier]', 'Sans fichier, trie l’entrée standard.'],
  uniq: ['uniq - retire les lignes répétées', 'uniq [fichier]'],
  ed: ['ed - éditeur de texte', 'ed [fichier]', 'En cas d’erreur, ed répond « ? ». Toujours.'],
  man: ['man - imprime une page du manuel', 'man commande'],
  chdir: ['chdir - change de répertoire', 'chdir répertoire'],
  sh: ['sh - interprète de commandes', 'commande | commande…', 'Le caractère | relie la sortie d’une commande', 'à l’entrée de la suivante.'],
};

// Réponses d'époque aux commandes venues d'ailleurs.
const ANACHRONISMS = {
  dir: 'dir ? MS-DOS n’existera qu’en 1981. Ici : ls.',
  cls: 'cls ? On n’efface pas du papier !',
  clear: 'clear ? Impossible d’effacer du papier. Au mieux, on le déchire.',
  help: 'help ? Pas d’aide en ligne : le manuel est imprimé, sur l’étagère. Essayez man.',
  aide: 'Pas d’aide en ligne : le manuel est imprimé, sur l’étagère. Essayez man.',
  win: 'win ? Windows n’arrive qu’en 1985. Ici, la seule fenêtre est celle du télétype.',
  windows: 'Windows ? 1985. Ici, la seule fenêtre est celle du télétype.',
  sudo: 'sudo ? Il n’apparaîtra que vers 1980. Ici, l’administrateur, c’est ken.',
  apt: 'apt ? Pas de dépôts avant 1998. En 1974, les logiciels arrivent par la poste, sur bande magnétique.',
  'apt-get': 'apt-get ? Pas de dépôts avant 1998. En 1974, les logiciels arrivent par la poste, sur bande magnétique.',
  vi: 'vi ? Bill Joy ne l’écrira qu’en 1976. Ici, l’éditeur, c’est ed.',
  vim: 'vim ? Il faudra attendre 1991. Ici, l’éditeur, c’est ed.',
  emacs: 'emacs ? Patience, il arrive en 1976. Ici, l’éditeur, c’est ed.',
  nano: 'nano ? 1999. Ici, l’éditeur, c’est ed.',
  more: 'more ? Pas avant 1978. Ici, le papier défile tout seul.',
  less: 'less ? 1984. Ici, le papier défile tout seul.',
  head: 'head ? Pas encore inventé. Pour trouver une ligne, il y a grep.',
  tail: 'tail ? Pas encore inventé. Pour trouver une ligne, il y a grep.',
  bash: 'bash ? Il naîtra en 1989. Vous êtes dans le shell de Thompson.',
  whoami: 'whoami ? Ici, on le demande poliment : who am i',
  history: 'history ? Relisez le papier : tout y est imprimé.',
  top: 'top ? Pas encore. Pour voir les processus : ps.',
  htop: 'htop ? 2004. Pour voir les processus : ps.',
  git: 'git ? Linus Torvalds l’écrira en 2005.',
  python: 'python ? 1991. Ici, on programme en C, tout neuf.',
  python3: 'python3 ? 2008. Ici, on programme en C, tout neuf.',
  node: 'node ? 2009. Ici, on programme en C, tout neuf.',
  java: 'java ? 1995. Ici, on programme en C, tout neuf.',
  ping: 'ping ? ARPANET relie à peine quelques dizaines d’ordinateurs. Pas celui-ci.',
  ssh: 'ssh ? 1995. Pour vous connecter, il y a ce télétype.',
  curl: 'curl ? Le Web naîtra en 1990. Patience.',
  wget: 'wget ? Le Web naîtra en 1990. Patience.',
  internet: 'Internet ? ARPANET relie à peine quelques dizaines d’ordinateurs. Pas celui-ci.',
  google: 'google ? 1998. En 1974, on cherche avec grep.',
  type: 'type ? C’est du DOS, en 1981. Ici, on lit un fichier avec cat.',
  ver: 'ver ? C’est du DOS, en 1981. Ici : Unix, version 5.',
  mem: 'mem ? C’est du DOS, en 1981. Ici, la mémoire est à tores de ferrite.',
  copy: 'copy ? C’est du DOS, en 1981. Ici : cp.',
  del: 'del ? C’est du DOS, en 1981. Ici : rm.',
  format: 'format ? Pas touche aux disques de la salle 2.',
  edit: 'edit ? C’est du DOS, en 1991. Ici, l’éditeur, c’est ed.',
  notepad: 'notepad ? 1985. Ici, l’éditeur, c’est ed.',
  start: 'start ? Le menu Démarrer arrivera en 1995.',
};

const QUIPS = {
  exit: 'On ne sort pas comme ça : la sortie est cachée dans le journal.',
  logout: 'On ne sort pas comme ça : la sortie est cachée dans le journal.',
  quit: 'On ne sort pas comme ça : la sortie est cachée dans le journal.',
  sortie: 'sortie ? Ce n’est pas une commande… pas encore. Cherchez-la dans le journal.',
  multics: 'multics ? Gardez ce mot précieusement : il servira plus tard.',
  unix: 'Oui, c’est bien Unix. Version 5, juin 1974.',
  cd: 'cd ? En 1974, on écrit chdir. Et rien ne sert de bouger : tout est ici.',
  chdir: 'chdir : inutile de bouger, tout est ici.',
  mail: 'Pas de courrier.',
  passwd: 'passwd : réservé aux comptes permanents. Le vôtre est temporaire.',
  su: 'su : vous n’êtes pas ken.',
  login: 'Vous êtes déjà connecté : voyageur.',
  stty: 'vitesse 110 bauds ; écho ; papier continu',
  tty: '/dev/tty3',
  kill: 'kill : rien à arrêter.',
  ed: '?',
  rm: 'rm : permission refusée. Ces fichiers appartiennent à ken.',
  mv: 'mv : permission refusée. Ces fichiers appartiennent à ken.',
  cp: 'cp : permission refusée. Pas de place sur le disque.',
  chmod: 'chmod : permission refusée. Ces fichiers appartiennent à ken.',
  mkdir: 'mkdir : permission refusée.',
};

// ——— Analyse de la ligne ———

// Découpe la ligne aux | (ou ¦) hors guillemets.
export function splitPipeline(line) {
  const parts = [''];
  let quote = null;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null;
      parts[parts.length - 1] += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      parts[parts.length - 1] += ch;
    } else if (ch === '|' || ch === '¦') {
      parts.push('');
    } else {
      parts[parts.length - 1] += ch;
    }
  }
  return parts.map((part) => part.trim());
}

// Mots d'une commande, guillemets retirés.
export function tokenize(segment) {
  const tokens = [];
  let current = '';
  let quote = null;
  let started = false;
  for (const ch of segment) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'" || ch === '«' || ch === '»') {
      quote = ch === '«' ? '»' : ch === '»' ? null : ch;
      started = true;
    } else if (/\s/.test(ch)) {
      if (started || current) tokens.push(current);
      current = '';
      started = false;
    } else {
      current += ch;
      started = true;
    }
  }
  if (started || current) tokens.push(current);
  return tokens;
}

function splitOptions(args, allowed) {
  const flags = new Set();
  const rest = [];
  let bad = null;
  for (const arg of args) {
    if (/^-[a-z]+$/i.test(arg) && !rest.length) {
      for (const f of arg.slice(1)) {
        if (allowed.includes(f.toLowerCase())) flags.add(f.toLowerCase());
        else bad ??= f;
      }
    } else {
      rest.push(arg);
    }
  }
  return { flags, rest, bad };
}

// « * » devient la liste des fichiers.
const glob = (names) => names.flatMap((name) => (name === '*' ? FILE_NAMES : [name]));
const fileOf = (name) => FILES[name.toLowerCase()] ?? null;

function patternOf(text) {
  try {
    return new RegExp(text, 'i');
  } catch {
    return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
}

const pad = (value, n) => String(value).padStart(n);

// ——— Commandes ———

export function createShell({ startedAt = Date.now() } = {}) {
  const ok = (out = []) => ({ out, err: [] });
  const fail = (...err) => ({ out: [], err, failed: true });

  function clock() {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const total = 23 * 3600 + 57 * 60 + 4 + elapsed;
    const h = Math.floor(total / 3600) % 24;
    const m = Math.floor(total / 60) % 60;
    const s = total % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
  }

  const commands = {
    ls(args) {
      const { flags, rest, bad } = splitOptions(args, ['l', 'a']);
      if (bad) return fail(`ls : option -${bad} inconnue`);
      const target = rest[0] ?? '.';
      const path = target === '.' || target === HOME || target === '~' ? HOME : target.replace(/\/$/, '') || '/';
      if (path !== HOME) {
        if (DIRS[path]) return ok(DIRS[path]);
        if (fileOf(target)) return ok([target.toLowerCase()]);
        return fail(`${target} introuvable`);
      }
      const names = [...(flags.has('a') ? ['.', '..'] : []), ...FILE_NAMES];
      if (!flags.has('l')) return ok(names);
      const blocks = FILE_NAMES.reduce((sum, name) => sum + Math.ceil(byteSize(FILES[name]) / 512), 0);
      const long = names.map((name) => {
        if (name === '.' || name === '..') return `drwxr-xr-x  2 voyageur    64 15 juil 23:56 ${name}`;
        const time = name === 'journal' ? '23:51' : '08:40';
        return `-rw-r--r--  1 ken      ${pad(byteSize(FILES[name]), 5)} 15 juil ${time} ${name}`;
      });
      return ok([`total ${blocks}`, ...long]);
    },

    cat(args, input) {
      const names = glob(args);
      if (!names.length) {
        if (input) return ok(input);
        return fail('usage : cat fichier');
      }
      const out = [];
      const err = [];
      for (const name of names) {
        const lines = fileOf(name);
        if (lines) out.push(...lines);
        else err.push(`cat : impossible d’ouvrir ${name}`);
      }
      return { out, err, failed: !out.length && err.length > 0 };
    },

    grep(args, input) {
      const { flags, rest, bad } = splitOptions(args, ['v', 'c', 'n', 'i', 'l']);
      if (bad) return fail(`grep : option -${bad} inconnue`, 'usage : grep [-v] [-c] [-n] motif [fichier]');
      const [pattern, ...files] = rest;
      if (pattern === undefined || pattern === '') return fail('usage : grep [-v] [-c] [-n] motif [fichier]');
      const names = glob(files);
      if (!names.length && !input) {
        return fail(`grep ${pattern} : dans quel fichier ?`, 'usage : grep motif fichier  ou  … | grep motif');
      }
      const re = patternOf(pattern);
      const sources = names.length ? names.map((name) => [name, fileOf(name)]) : [[null, input]];
      const out = [];
      const err = [];
      for (const [name, lines] of sources) {
        if (!lines) {
          err.push(`grep : impossible d’ouvrir ${name}`);
          continue;
        }
        const prefix = names.length > 1 ? `${name}:` : '';
        let count = 0;
        lines.forEach((line, i) => {
          if (re.test(line) === flags.has('v')) return;
          count += 1;
          if (!flags.has('c') && !flags.has('l')) out.push(`${prefix}${flags.has('n') ? `${i + 1}:` : ''}${line}`);
        });
        if (flags.has('c')) out.push(`${prefix}${count}`);
        if (flags.has('l') && count) out.push(name ?? '(entrée)');
      }
      return { out, err, grep: true };
    },

    wc(args, input) {
      const { flags, rest, bad } = splitOptions(args, ['l', 'w', 'c']);
      if (bad) return fail(`wc : option -${bad} inconnue`);
      const count = (lines) => {
        const all = !flags.size;
        const parts = [];
        if (all || flags.has('l')) parts.push(pad(lines.length, 5));
        if (all || flags.has('w')) parts.push(pad(lines.join(' ').split(/\s+/).filter(Boolean).length, 6));
        if (all || flags.has('c')) parts.push(pad(byteSize(lines), 6));
        return parts.join(' ');
      };
      const names = glob(rest);
      if (!names.length) return input ? ok([count(input)]) : fail('usage : wc [-l] fichier');
      const out = [];
      const err = [];
      for (const name of names) {
        const lines = fileOf(name);
        if (lines) out.push(`${count(lines)} ${name}`);
        else err.push(`wc : impossible d’ouvrir ${name}`);
      }
      return { out, err };
    },

    sort(args, input) {
      const lines = args.length ? glob(args).flatMap((name) => fileOf(name) ?? []) : input;
      if (!lines) return fail('usage : sort fichier');
      return ok([...lines].sort((a, b) => a.localeCompare(b, 'fr')));
    },

    uniq(args, input) {
      const lines = args.length ? glob(args).flatMap((name) => fileOf(name) ?? []) : input;
      if (!lines) return fail('usage : uniq fichier');
      return ok(lines.filter((line, i) => line !== lines[i - 1]));
    },

    echo: (args) => ok([args.join(' ')]),
    pwd: () => ok([HOME]),

    who(args) {
      const me = `voyageur tty3  15 juil 23:56`;
      if (args.join(' ').toLowerCase() === 'am i') return ok([me]);
      return ok(['ken      tty0  15 juil 08:58', 'dmr      tty1  15 juil 09:12', 'doug     tty2  15 juil 10:03', me]);
    },

    date: () => ok([`lun 15 juil 1974 ${clock()} EDT`]),

    ps: () => ok(['  PID TTY  TIME CMD', '   42   3  0:01 -sh', `  ${pad(70 + Math.floor((Date.now() - startedAt) / 9000) % 20, 3)}   3  0:00 ps`]),

    man(args) {
      const name = (args[0] ?? '').toLowerCase();
      if (!name) return fail('Quelle page ? Par exemple : man grep');
      const page = MANUAL[name === 'cd' ? 'chdir' : name];
      if (!page) return fail(`Pas de manuel pour ${name}.`);
      const [title, synopsis, ...description] = page;
      const head = `${name.toUpperCase()} (I)`;
      const gap = Math.max(2, Math.floor((46 - head.length * 2 - 7) / 2));
      return {
        out: [
          `${head}${' '.repeat(gap)}15/7/74${' '.repeat(gap)}${head}`,
          'NOM',
          `     ${title}`,
          'SYNOPSIS',
          `     ${synopsis}`,
          ...(description.length ? ['DESCRIPTION', ...description.map((line) => `     ${line}`)] : []),
        ],
        err: [],
        man: name,
      };
    },
  };

  // Exécute une ligne : renvoie { lines, unknown, grep, found, events }.
  function run(raw) {
    const line = raw.trim();
    const result = { lines: [], err: [], unknown: false, grep: false, found: false, events: [], quip: false };
    if (!line) return result;

    if (/[<>]/.test(line)) {
      result.lines = ['Pas de redirection aujourd’hui : le pipe | suffit.'];
      result.quip = true;
      return result;
    }

    const segments = splitPipeline(line);
    if (segments.some((segment) => !segment)) {
      result.err = ['| : il manque une commande de chaque côté.'];
      return result;
    }

    let input = null;
    for (let i = 0; i < segments.length; i++) {
      const [first = '', ...args] = tokenize(segments[i]);
      const name = first.toLowerCase();

      if (Object.hasOwn(commands, name)) {
        const res = commands[name](args, input);
        result.err.push(...res.err);
        if (res.grep) result.grep = true;
        if (res.man) result.events.push(`man-${res.man}`);
        result.events.push(name);
        if (res.failed) return result;
        input = res.out;
        continue;
      }

      // Une réplique d'époque arrête la chaîne.
      const web = /^(https?:|www\.)/.test(name);
      const reply = ANACHRONISMS[name] ?? QUIPS[name] ?? (web ? ANACHRONISMS.internet : null);
      if (reply) {
        result.lines = [reply];
        result.quip = true;
        result.events.push(name);
        return result;
      }
      result.lines = ['?'];
      result.unknown = true;
      return result;
    }

    result.lines = input ?? [];
    result.found = result.grep && result.lines.some((l) => l.includes(EXIT_LINE));
    return result;
  }

  return { run, files: FILE_NAMES };
}
