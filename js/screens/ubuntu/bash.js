// Bash d'Ubuntu 6.06 : un petit système de fichiers, sudo et son mot de passe
// invisible, apt et sa barre de progression, et quelques clins d'œil à 1974.
// io fournit l'affichage (print, html, row, ask, wait…) ; events prévient l'écran.

import { JOURNAL, EXIT_LINE } from '../unix/journal.js';
import { splitPipeline, tokenize } from '../unix/shell.js';

const HOME = '/home/voyageur';
const PASSWORD = 'multics';
const NB = '\u00a0';

const TREE = {
  '/': ['bin', 'boot', 'dev', 'etc', 'home', 'lib', 'media', 'mnt', 'opt', 'proc', 'root', 'sbin', 'tmp', 'usr', 'var'],
  '/home': ['voyageur'],
  [HOME]: ['Bureau', 'Exemples', 'journal'],
  [`${HOME}/Bureau`]: [],
  [`${HOME}/Exemples`]: ['Bienvenue.odt', 'Musique libre.ogg', 'Paysage.jpg'],
  '/etc': ['apt', 'fstab', 'hostname', 'issue', 'passwd', 'sudoers'],
  '/etc/apt': ['sources.list'],
  '/bin': ['bash', 'cat', 'cp', 'dir', 'echo', 'grep', 'ls', 'mv', 'pwd', 'rm', 'su', 'uname'],
  '/boot': ['grub', 'initrd.img-2.6.15-23-386', 'vmlinuz-2.6.15-23-386'],
  '/dev': ['cdrom', 'fd0', 'hda', 'hda1', 'null', 'tty'],
  '/lib': ['modules'],
  '/media': ['cdrom', 'floppy'],
  '/mnt': [],
  '/opt': [],
  '/proc': ['cpuinfo', 'meminfo', 'version'],
  '/sbin': ['halt', 'reboot', 'shutdown'],
  '/var': ['cache', 'lib', 'log', 'mail', 'tmp'],
  '/usr': ['bin', 'games', 'include', 'lib', 'local', 'sbin', 'share', 'src'],
  '/usr/bin': ['apt-get', 'firefox', 'gedit', 'gnome-terminal', 'nautilus', 'python', 'sudo'],
  '/usr/games': ['gnometris', 'mahjongg', 'mines'],
  '/usr/include': [],
  '/usr/lib': [],
  '/usr/local': [],
  '/usr/sbin': ['synaptic'],
  '/usr/share': ['doc', 'icons', 'man', 'themes'],
  '/usr/src': [],
  '/tmp': [],
  '/root': null, // accès refusé
};

const HIDDEN = { [HOME]: ['.bash_history', '.bash_logout', '.bashrc', '.profile'] };

const FILES = {
  [`${HOME}/journal`]: JOURNAL,
  [`${HOME}/.bashrc`]: ['# ~/.bashrc : exécuté par bash pour les shells non connectés', '', 'alias ls=\'ls --color=auto\'', 'PS1=\'\\u@\\h:\\w\\$ \''],
  [`${HOME}/.profile`]: ['# ~/.profile : exécuté au démarrage de la session', 'umask 022'],
  [`${HOME}/.bash_logout`]: ['# ~/.bash_logout : exécuté à la fermeture du shell', 'clear'],
  [`${HOME}/.bash_history`]: ['ls', 'cat journal | grep sortie'],
  '/etc/hostname': ['ubuntu'],
  '/etc/issue': ['Ubuntu 6.06 LTS \\n \\l'],
  '/etc/fstab': ['# /etc/fstab : informations statiques sur les systèmes de fichiers', '/dev/hda1  /  ext3  defaults,errors=remount-ro  0  1'],
  '/etc/passwd': ['root:x:0:0:root:/root:/bin/bash', 'voyageur:x:1000:1000:Voyageur temporel,,,:/home/voyageur:/bin/bash'],
  '/etc/apt/sources.list': [
    'deb http://fr.archive.ubuntu.com/ubuntu/ dapper main restricted',
    'deb http://fr.archive.ubuntu.com/ubuntu/ dapper universe',
    'deb http://security.ubuntu.com/ubuntu dapper-security main restricted',
  ],
};

const ROOT_ONLY = { '/etc/sudoers': ['# /etc/sudoers', '#', '# Les membres du groupe admin peuvent tout faire, avec leur mot de passe', '%admin ALL=(ALL) ALL'] };

const MANUAL = {
  sudo: ['sudo - exécuter une commande en tant qu’administrateur', 'sudo commande', 'sudo exécute la commande avec les droits du superutilisateur (root). Il demande votre propre mot de passe, pas celui de root. Pendant la saisie, rien ne s’affiche : c’est voulu.'],
  apt: ['apt - gestionnaire de paquets', 'apt install|remove|update|search|show paquet', 'Télécharge et installe des logiciels depuis les dépôts. Installer ou enlever un paquet demande les droits d’administration.'],
  'apt-get': ['apt-get - gestionnaire de paquets', 'apt-get install|remove|update paquet', 'Comme apt : installer un paquet demande les droits d’administration.'],
  ls: ['ls - afficher le contenu d’un dossier', 'ls [-l] [-a] [dossier]', 'Les dossiers apparaissent en bleu.'],
  cd: ['cd - changer de dossier', 'cd [dossier]', 'Sans argument, cd ramène au dossier personnel (~).'],
  cat: ['cat - afficher le contenu de fichiers', 'cat fichier…', 'Tout le fichier défile, d’un coup.'],
  grep: ['grep - chercher un motif', 'grep motif [fichier]', 'Sans fichier, grep lit la sortie d’une autre commande : commande | grep motif.'],
  man: ['man - afficher une page du manuel', 'man commande', 'Le manuel en ligne, qui remplace l’étagère de 1974.'],
  clear: ['clear - effacer le terminal', 'clear', 'Ici, contrairement au papier, tout s’efface.'],
  exit: ['exit - fermer le shell', 'exit', 'Ferme la fenêtre du terminal. Menu Applications › Accessoires › Terminal pour en rouvrir un.'],
  sortie: ['sortie - saut temporel vers l’époque suivante', 'sortie', 'Ramène son utilisateur un an plus tard, dans un monde sans clavier.'],
};

const ANACHRONISMS = {
  win: 'win ? On n’est pas sous DOS : ici, les fenêtres sont déjà là.',
  cls: 'cls ? C’est du DOS. Sous Linux, on efface avec clear.',
  ver: 'ver ? C’est du DOS. Essayez uname -a.',
  snap: 'snap ? Pas avant 2016. En 2006, tout passe par apt.',
  flatpak: 'flatpak ? Pas avant 2015. En 2006, tout passe par apt.',
  neofetch: 'neofetch ? Il arrivera en 2015. Essayez uname -a.',
  git: 'git ? Il a tout juste un an. Pas besoin de lui pour partir.',
  docker: 'docker ? 2013. Pour l’instant, une machine, c’est une machine.',
  chatgpt: 'Pas d’assistant ici : il faudra attendre 2026 pour simplement demander.',
};

const isPassword = (value) => (value ?? '').trim().toLowerCase() === PASSWORD;
const n = (value) => value.toLocaleString('fr-FR').replace(/\u202f|\u00a0|\s/g, NB);

export function createBash(io, events) {
  const shell = { cwd: HOME, installed: false, sudo: false, launched: false };

  const label = () => (shell.cwd === HOME ? '~' : shell.cwd.startsWith(`${HOME}/`) ? `~${shell.cwd.slice(HOME.length)}` : shell.cwd);
  const prompt = () => `voyageur@ubuntu:${label()}$ `;

  function resolve(path = '') {
    if (!path || path === '~') return HOME;
    let p = path.replace(/^~(?=\/|$)/, HOME);
    if (!p.startsWith('/')) p = `${shell.cwd === '/' ? '' : shell.cwd}/${p}`;
    const parts = [];
    for (const part of p.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    return `/${parts.join('/')}`;
  }

  const isDir = (path) => Object.hasOwn(TREE, path);
  const childrenOf = (path) => TREE[path];
  const readFile = (path, root) => FILES[path] ?? (root ? ROOT_ONLY[path] : undefined);
  const exists = (path) => isDir(path) || Object.hasOwn(FILES, path) || Object.hasOwn(ROOT_ONLY, path) || nameIn(path);
  function nameIn(path) {
    const dir = path.slice(0, path.lastIndexOf('/')) || '/';
    const name = path.slice(path.lastIndexOf('/') + 1);
    return Boolean(TREE[dir]?.includes(name) || HIDDEN[dir]?.includes(name));
  }

  const say = (...lines) => io.print(lines.join('\n'));
  const dirSpan = (name) => `<span class="ub-dir">${name}</span>`;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  // ——— Fichiers et dossiers ———

  function ls(args, { color = true } = {}) {
    const flags = args.filter((a) => a.startsWith('-')).join('');
    const target = args.find((a) => !a.startsWith('-'));
    const path = resolve(target ?? '.');
    if (!exists(path)) return say(`ls: ${target} : Aucun fichier ou dossier de ce type`);
    if (!isDir(path)) return say(target);
    if (childrenOf(path) === null) return say(`ls: ${target ?? path} : Permission non accordée`);
    const all = flags.includes('a');
    const names = [...(all ? ['.', '..', ...(HIDDEN[path] ?? [])] : []), ...childrenOf(path)].sort((a, b) =>
      a.replace(/^\./, '').localeCompare(b.replace(/^\./, ''), 'fr'),
    );
    const dir = (name) => name === '.' || name === '..' || isDir(resolve(`${path}/${name}`));
    if (flags.includes('l')) {
      const lines = [`total ${names.length * 4}`];
      for (const name of names) {
        const d = dir(name);
        const size = d ? 4096 : (FILES[`${path}/${name}`]?.join('\n').length ?? 0) + 1;
        const date = name === 'journal' ? `1974-07-15 ${JOURNAL.at(-1).slice(0, 5)}` : '2006-06-01 10:41';
        const quoted = name.includes(' ') ? `'${name}'` : name;
        const shown = d && color ? dirSpan(quoted) : esc(quoted);
        lines.push(`${d ? 'drwxr-xr-x' : '-rw-r--r--'} ${d ? 2 : 1} voyageur voyageur ${String(size).padStart(5)} ${date} ${shown}`);
      }
      return io.html(lines.join('\n'));
    }
    if (!names.length) return null;
    const cells = names.map((name) => {
      const quoted = name.includes(' ') ? `'${name}'` : name;
      return dir(name) && color ? dirSpan(quoted) : esc(quoted);
    });
    return io.html(cells.join('  '));
  }

  function cd(args) {
    const target = args[0];
    const path = resolve(target ?? '~');
    if (!exists(path)) return say(`bash: cd: ${target} : Aucun fichier ou dossier de ce type`);
    if (!isDir(path)) return say(`bash: cd: ${target} : N’est pas un dossier`);
    if (childrenOf(path) === null) return say(`bash: cd: ${target} : Permission non accordée`);
    shell.cwd = path;
    events.cwd?.(label());
    return null;
  }

  // ——— Petits tubes : cat, grep, wc, sort, head, tail ———

  function stage(name, args, input, root) {
    const files = args.filter((a) => !a.startsWith('-'));
    const read = (list) => {
      const out = [];
      const err = [];
      for (const file of list) {
        const path = resolve(file);
        if (isDir(path)) err.push(`${name}: ${file}: est un dossier`);
        else if (Object.hasOwn(ROOT_ONLY, path) && !root) err.push(`${name}: ${file}: Permission non accordée`);
        else if (!readFile(path, root)) err.push(`${name}: ${file}: Aucun fichier ou dossier de ce type`);
        else out.push(...readFile(path, root));
      }
      return { out, err };
    };
    switch (name) {
      case 'cat':
      case 'less':
      case 'more':
        return files.length ? read(files) : { out: input ?? [], err: [] };
      case 'grep': {
        const flags = args.filter((a) => a.startsWith('-')).join('');
        const [pattern, ...rest] = files;
        if (!pattern) return { out: [], err: ['Usage : grep [OPTION]... MOTIF [FICHIER]...'], grep: true };
        const src = rest.length ? read(rest) : { out: input ?? [], err: input ? [] : ['grep : (entrée standard) : en attente… tapez plutôt grep motif fichier'] };
        let re;
        try {
          re = new RegExp(pattern, 'i');
        } catch {
          re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }
        const out = src.out.filter((line) => re.test(line) !== flags.includes('v'));
        return { out: flags.includes('c') ? [String(out.length)] : out, err: src.err, grep: true };
      }
      case 'wc': {
        const src = files.length ? read(files) : { out: input ?? [], err: [] };
        const lines = src.out.length;
        if (args.includes('-l')) return { out: [`${lines}${files[0] ? ` ${files[0]}` : ''}`], err: src.err };
        const words = src.out.join(' ').split(/\s+/).filter(Boolean).length;
        const bytes = new TextEncoder().encode(src.out.join('\n')).length + lines;
        return { out: [` ${lines} ${words} ${bytes}${files[0] ? ` ${files[0]}` : ''}`], err: src.err };
      }
      case 'sort': {
        const src = files.length ? read(files) : { out: input ?? [], err: [] };
        return { out: [...src.out].sort((a, b) => a.localeCompare(b, 'fr')), err: src.err };
      }
      case 'head':
      case 'tail': {
        const count = Number(args.find((a) => /^-n?\d+$/.test(a))?.replace(/^-n?/, '') ?? 10);
        const src = files.filter((f) => !/^\d+$/.test(f)).length ? read(files.filter((f) => !/^\d+$/.test(f))) : { out: input ?? [], err: [] };
        return { out: name === 'head' ? src.out.slice(0, count) : src.out.slice(-count), err: src.err };
      }
      default:
        return null;
    }
  }

  const PIPEABLE = new Set(['cat', 'less', 'more', 'grep', 'wc', 'sort', 'head', 'tail']);

  async function pipeline(line, root) {
    const parts = splitPipeline(line);
    if (parts.some((p) => !p)) return say('bash: erreur de syntaxe près du symbole inattendu « | »');
    let input = null;
    let grep = false;
    const err = [];
    for (const part of parts) {
      const [first = '', ...args] = tokenize(part);
      const name = first.toLowerCase();
      if (!PIPEABLE.has(name)) {
        events.error();
        return say(`bash: ${name} : commande introuvable`);
      }
      const res = stage(name, args, input, root);
      err.push(...res.err);
      grep ||= Boolean(res.grep);
      input = res.out;
    }
    if (grep && input.some((l) => l.includes(EXIT_LINE)) && input.length <= 12) {
      await say(...err, ...input);
      await io.wait(500);
      await io.html('<span class="ub-bonus">Toujours là depuis 1974 !</span>');
      events.bonus();
      return null;
    }
    const all = [...err, ...input];
    if (all.length) await io.print(all.join('\n'));
    return null;
  }

  // ——— sudo : le mot de passe ne s'affiche pas ———

  async function authenticate() {
    if (shell.sudo) return true;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const value = await events.askPassword('[sudo] Mot de passe de voyageur : ');
      if (value === null) return false;
      if (isPassword(value)) {
        shell.sudo = true;
        events.authenticated();
        return true;
      }
      events.error();
      await io.wait(1100);
      if (attempt < 3) await say('Désolé, essayez de nouveau.');
    }
    await say('sudo: 3 saisies de mot de passe incorrectes');
    return false;
  }

  async function sudo(args, raw) {
    if (!args.length) return say('usage: sudo -h | -K | -k | -L | -l | -V | -v', 'usage: sudo [-HPSb] [-p invite] [-u utilisateur] commande');
    if (args[0] === '-k' || args[0] === '-K') {
      shell.sudo = false;
      return null;
    }
    if (args[0] === '-h' || args[0] === '--help') return manPage('sudo');
    if (!(await authenticate())) return null;
    if (args[0] === '-v') return null;
    if (args[0] === '-l') return say('L’utilisateur voyageur peut lancer les commandes suivantes sur ubuntu :', '    (ALL) ALL');
    const [cmd, ...rest] = args;
    if (['-s', '-i', 'su', 'bash', 'sh', '-su'].includes(cmd)) {
      return say('Prudence : un shell root, c’est la meilleure façon de tout casser.', 'Restez sur sudo, une commande à la fois.');
    }
    return dispatch(cmd.toLowerCase(), rest, raw.replace(/^\s*sudo\s+/i, ''), { root: true });
  }

  async function su() {
    const value = await events.askPassword('Mot de passe : ');
    if (value === null) return null;
    await io.wait(1500);
    return say('su: Échec d’authentification', '(Sous Ubuntu, le compte root est verrouillé : on passe par sudo.)');
  }

  // ——— apt ———

  async function lockError(path = '/var/lib/dpkg/lock') {
    events.denied();
    return say(
      `E: Impossible d’ouvrir le fichier verrou ${path} - open (13: Permission non accordée)`,
      'E: Impossible de verrouiller le répertoire d’administration (/var/lib/dpkg/). Permission refusée. Êtes-vous administrateur ?',
    );
  }

  async function slowLine(text, done = 'Fait', ms = 450) {
    await io.print('');
    const el = io.lastRow();
    el.textContent = `${text}... `;
    await io.wait(ms);
    el.textContent = `${text}... ${done}`;
  }

  function bar(pct, width) {
    const inner = Math.max(10, width);
    const fill = Math.round((pct / 100) * inner);
    return `Progression : [${String(pct).padStart(3)}%] [${'#'.repeat(fill)}${'.'.repeat(inner - fill)}]`;
  }

  async function install() {
    await slowLine('Lecture des listes de paquets', 'Fait', 650);
    await slowLine('Construction de l’arbre des dépendances', 'Fait', 400);
    await slowLine('Lecture des informations d’état', 'Fait', 250);
    await say(
      'Les NOUVEAUX paquets suivants seront installés :',
      '  sortie',
      '0 mis à jour, 1 nouvellement installés, 0 à enlever et 0 non mis à jour.',
      `Il est nécessaire de prendre 2${NB}006 ko dans les archives.`,
      `Après cette opération, 1${NB}974 ko d’espace disque supplémentaires seront utilisés.`,
      `Réception de : 1 http://fr.archive.ubuntu.com dapper/universe sortie 1.0-1974 [2${NB}006 ko]`,
    );
    // Téléchargement : la ligne d'état se réécrit sur place.
    await io.print('');
    const status = io.lastRow();
    const total = 2006;
    for (let pct = 0; pct <= 100; pct += 4) {
      const got = Math.round((total * pct) / 100);
      const rate = 380 + Math.round(Math.sin(pct / 9) * 90 + pct * 3);
      status.textContent = `${String(pct).padStart(3)}% [1 sortie ${n(got)} ko/${n(total)} ko ${pct}%]   ${rate} ko/s ${Math.max(0, Math.round((total - got) / rate))}s`;
      await io.wait(70 + Math.random() * 60);
    }
    status.textContent = `${n(total)} ko réceptionnés en 3s (668 ko/s)`;
    // Installation : barre ASCII épinglée en bas, les lignes de dpkg s'insèrent au-dessus.
    await io.print('');
    const progress = io.lastRow();
    progress.classList.add('ub-apt-bar');
    const width = Math.max(10, io.cols() - 24);
    const steps = [
      [12, 'Sélection du paquet sortie précédemment désélectionné.'],
      [35, `(Lecture de la base de données... 74${NB}042 fichiers et répertoires déjà installés.)`],
      [58, 'Dépaquetage de sortie (à partir de .../sortie_1.0-1974_i386.deb) ...'],
      [84, 'Paramétrage de sortie (1.0-1974) ...'],
      [100, ' * Le saut temporel est prêt. Tapez « sortie » pour partir.'],
    ];
    let pct = 0;
    for (const [target, line] of steps) {
      while (pct < target) {
        pct = Math.min(target, pct + 2);
        progress.textContent = bar(pct, width);
        await io.wait(38);
      }
      io.insertBefore(progress, line);
      await io.wait(260);
    }
    await io.wait(300);
    progress.remove();
    shell.installed = true;
    events.installed();
    return null;
  }

  async function apt(cmd, args, root) {
    const [sub, ...pkgs] = args;
    const name = (pkgs.find((p) => !p.startsWith('-')) ?? '').toLowerCase();
    switch (sub) {
      case undefined:
        return say(`${cmd} 0.6.43.3ubuntu2 pour i386 compilé le 27 mai 2006`, `Usage : ${cmd} install|remove|update|upgrade|search|show paquet`);
      case 'install':
        if (!root) return lockError();
        if (!name) return say('0 mis à jour, 0 nouvellement installés, 0 à enlever et 0 non mis à jour.');
        if (name !== 'sortie') {
          await slowLine('Lecture des listes de paquets', 'Fait', 400);
          return say(`E: Impossible de trouver le paquet ${name}`);
        }
        if (shell.installed) {
          await slowLine('Lecture des listes de paquets', 'Fait', 300);
          return say('sortie est déjà la plus récente version.', '0 mis à jour, 0 nouvellement installés, 0 à enlever et 0 non mis à jour.');
        }
        return install();
      case 'remove':
      case 'purge':
        if (!root) return lockError();
        if (name === 'sortie' && shell.installed) return say('Désinstaller la sortie ? Pas question : 2007 vous attend.');
        return say(`Le paquet ${name || '?'} n’est pas installé, et ne peut donc être supprimé.`);
      case 'update':
        if (!root) return lockError('/var/lib/apt/lists/lock');
        await say('Atteint http://fr.archive.ubuntu.com dapper Release.gpg', 'Atteint http://fr.archive.ubuntu.com dapper Release', 'Atteint http://security.ubuntu.com dapper-security Release');
        return slowLine('Lecture des listes de paquets', 'Fait', 600);
      case 'upgrade':
        if (!root) return lockError();
        await slowLine('Lecture des listes de paquets', 'Fait', 400);
        return say('0 mis à jour, 0 nouvellement installés, 0 à enlever et 0 non mis à jour.');
      case 'search':
        return name && 'sortie'.includes(name) ? say('sortie - saut temporel vers l’époque suivante') : null;
      case 'show':
        if (name !== 'sortie') return say(`E: Impossible de trouver le paquet ${name}`);
        return say(
          'Paquet : sortie',
          'Version : 1.0-1974',
          'Section : universe/temps',
          `Mainteneur : Voyageur temporel <voyageur@ubuntu>`,
          `Taille installée : 1${NB}974 ko`,
          'Description : saut temporel vers l’époque suivante',
          ' Installe la commande « sortie », qui ramène son utilisateur',
          ' un an plus tard, dans un monde sans clavier.',
        );
      default:
        return say(`E: Opération ${sub} invalide`);
    }
  }

  // ——— Divers ———

  function manPage(name) {
    const page = MANUAL[name];
    if (!page || (name === 'sortie' && !shell.installed)) return say(`Il n’y a pas de page de manuel pour ${name}.`);
    const [title, synopsis, description] = page;
    const head = `${name.toUpperCase()}(${name === 'sudo' ? 8 : 1})`;
    return say(head, '', 'NOM', `       ${title}`, '', 'SYNOPSIS', `       ${synopsis}`, '', 'DESCRIPTION', `       ${description}`, '');
  }

  function notFound(name) {
    events.error();
    if (name === 'multics') return say('bash: multics : commande introuvable', 'C’est un mot de passe, pas une commande : sudo vous le demandera.');
    return say(`bash: ${name} : commande introuvable`);
  }

  function suggest() {
    events.suggest();
    return say('La commande « sortie » est introuvable, mais peut être installée avec :', '', 'sudo apt install sortie', '');
  }

  async function dispatch(name, args, raw, { root = false } = {}) {
    if (/[|¦]/.test(raw)) return pipeline(raw, root);
    switch (name) {
      case 'sortie':
        if (!shell.installed) return root ? say('sudo: sortie : commande introuvable') : suggest();
        shell.launched = true;
        return events.launch();
      case 'sudo':
        return sudo(args, raw);
      case 'su':
        return su();
      case 'apt':
      case 'apt-get':
      case 'aptitude':
        return apt(name, args, root);
      case 'apt-cache':
        return apt(name, args, true);
      case 'dpkg':
        return shell.installed && args.includes('sortie')
          ? say('ii  sortie   1.0-1974   saut temporel vers l’époque suivante')
          : say('Aucun paquet ne correspond à sortie.');
      case 'ls':
        return ls(args);
      case 'dir':
        await ls(args, { color: false });
        return say('(Eh oui : GNU a aussi une commande dir, pour les nostalgiques de DOS.)');
      case 'cd':
        return cd(args);
      case 'pwd':
        return say(shell.cwd);
      case 'whoami':
        return say(root ? 'root' : 'voyageur');
      case 'id':
        return root
          ? say('uid=0(root) gid=0(root) groupes=0(root)')
          : say('uid=1000(voyageur) gid=1000(voyageur) groupes=4(adm),20(dialout),24(cdrom),25(floppy),29(audio),44(video),46(plugdev),112(admin),1000(voyageur)');
      case 'groups':
        return say('voyageur adm dialout cdrom floppy audio video plugdev admin');
      case 'hostname':
        return say('ubuntu');
      case 'uname':
        return say(args.includes('-a') ? 'Linux ubuntu 2.6.15-23-386 #1 PREEMPT Tue May 23 13:49:40 UTC 2006 i686 GNU/Linux' : args.includes('-r') ? '2.6.15-23-386' : 'Linux');
      case 'lsb_release':
        return say('Distributor ID:	Ubuntu', 'Description:	Ubuntu 6.06 LTS', 'Release:	6.06', 'Codename:	dapper');
      case 'clear':
      case 'reset':
        io.clear();
        return null;
      case 'exit':
      case 'logout':
        return events.exit();
      case 'help':
        return say(
          'GNU bash, version 3.1.17(1)-release (i486-pc-linux-gnu)',
          'Commandes internes : cd, echo, exit, help, history, pwd…',
          'Pour le reste, le manuel : man commande (par exemple man sudo).',
          'Astuce : une commande introuvable est souvent proposée à l’installation.',
        );
      case 'man':
        return args[0] ? manPage(args[0].toLowerCase()) : say('Quelle page de manuel voulez-vous ?');
      case 'echo':
        return say(args.join(' '));
      case 'date': {
        const now = new Date();
        const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map((v) => String(v).padStart(2, '0')).join(':');
        return say(`jeu. juin  1 ${time} CEST 2006`);
      }
      case 'history':
        return say(...events.history().map((h, i) => `${String(i + 1).padStart(5)}  ${h}`));
      case 'who':
      case 'w':
        return say('voyageur :0           2006-06-01 10:41', 'voyageur pts/0        2006-06-01 10:42 (:0.0)');
      case 'ps':
        return say('  PID TTY          TIME CMD', ' 5821 pts/0    00:00:00 bash', ` ${5822 + events.history().length} pts/0    00:00:00 ps`);
      case 'top':
        return say('top : trop gourmand pour cette démonstration. Essayez ps.');
      case 'ed':
        return say('?');
      case 'vi':
      case 'vim':
      case 'nano':
      case 'emacs':
        return say(`${name} : pas le temps d’éditer, la sortie vous attend.${name.startsWith('vi') ? ' (Et pour quitter vi, il faut :q)' : ''}`);
      case 'gedit':
        events.openApp('gedit', args[0]);
        return null;
      case 'nautilus':
        events.openApp('nautilus');
        return null;
      case 'firefox':
        events.openApp('firefox');
        return null;
      case 'gnome-terminal':
        return say('Un terminal suffit amplement.');
      case 'ping':
        return say(`ping: unknown host ${args.at(-1) ?? ''}`.trim(), '(Pas de réseau dans la machine à remonter le temps.)');
      case 'python':
        return say('Python 2.4.3 est bien installé, mais ce n’est pas le moment de programmer.');
      case 'reboot':
      case 'shutdown':
      case 'halt':
      case 'poweroff':
        return root ? say('Pas maintenant : 2007 vous attend !') : say(`${name}: Vous devez être root pour faire ça.`);
      case 'rm':
        if (args.includes('/') || args.includes('/*')) return say('rm: refus de supprimer « / » de manière récursive. Ouf.');
        return say(`rm: impossible de supprimer « ${args.find((a) => !a.startsWith('-')) ?? '?'} » : le voyage a besoin de ce fichier.`);
      case 'mkdir':
      case 'touch':
      case 'cp':
      case 'mv':
        return say(`${name} : pas le temps de ranger, la sortie vous attend.`);
      case 'passwd':
        return say('Changer de mot de passe ? Gardez plutôt celui de 1974.');
      case 'multics':
        return notFound('multics');
      default:
        break;
    }
    if (PIPEABLE.has(name)) return pipeline(raw, root);
    if (Object.hasOwn(ANACHRONISMS, name)) return say(ANACHRONISMS[name]);
    if (/^(https?:|www\.)/.test(name)) return say(`bash: ${name} : commande introuvable`, '(Une adresse web se tape dans le navigateur, pas ici.)');
    return notFound(name);
  }

  // Exécute une ligne tapée au clavier.
  async function run(raw) {
    const line = raw.trim();
    if (!line) return null;
    const [first = '', ...args] = tokenize(line.split(/[|¦]/)[0]);
    const name = first.toLowerCase();
    if (/[<>;&]/.test(line) && !/[|¦]/.test(line)) {
      return say('Restons simples : une commande à la fois (le | est permis).');
    }
    return dispatch(name, args, line);
  }

  // Complétion (Tab) : commandes, puis fichiers du dossier courant.
  const COMMANDS = ['apt', 'apt-get', 'apt-cache', 'cat', 'cd', 'clear', 'date', 'dir', 'echo', 'exit', 'grep', 'help', 'history', 'id', 'ls', 'man', 'pwd', 'sortie', 'sudo', 'uname', 'whoami'];
  function complete(value) {
    const words = value.split(/\s+/);
    const current = words.at(-1);
    const first = words.length === 1 || words.at(-2) === '|';
    let pool;
    if (first) pool = COMMANDS;
    else if (words[0] === 'apt' || words[0] === 'apt-get' || words.at(-2) === 'install') pool = ['install', 'remove', 'update', 'search', 'show', 'sortie'];
    else pool = [...(childrenOf(shell.cwd) ?? [])].map((name) => (isDir(resolve(name)) ? `${name}/` : name));
    const matches = pool.filter((p) => p.startsWith(current));
    if (!matches.length) return null;
    let common = matches[0];
    for (const m of matches) while (!m.startsWith(common)) common = common.slice(0, -1);
    if (common.length <= current.length) return matches.length > 1 ? { list: matches } : null;
    const done = matches.length === 1 && !common.endsWith('/');
    return { value: `${value.slice(0, value.length - current.length)}${common}${done ? ' ' : ''}` };
  }

  return {
    run,
    complete,
    prompt,
    label,
    get installed() {
      return shell.installed;
    },
    get launched() {
      return shell.launched;
    },
  };
}
