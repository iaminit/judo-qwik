#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicMedia = path.join(root, 'public', 'media');
const storage = path.join(root, 'pb_data', 'storage');
const quarantine = path.join(root, '.audit-quarantine', 'pb-storage');

const walk = (directory) => {
  if (!fs.existsSync(directory)) return [];
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(absolute));
    else if (entry.isFile()) result.push(absolute);
  }
  return result;
};

const digest = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const roots = [
  { directory: path.join(root, 'pb_data'), prefix: '', include: (relative) => !relative.includes(path.sep) },
  { directory: path.join(root, 'pb_data', 'audio'), prefix: 'audio', include: () => true },
  { directory: path.join(root, 'pb_data', 'home'), prefix: 'home', include: () => true },
  { directory: path.join(root, 'pb_data', 'icons'), prefix: 'icons', include: () => true },
  { directory: path.join(root, 'pb_data', 'media'), prefix: '', include: () => true },
];

const copied = [];
const mismatches = [];
for (const location of roots) {
  for (const source of walk(location.directory)) {
    const relative = path.relative(location.directory, source);
    if (!location.include(relative)) continue;
    if (!/\.(?:webp|png|jpe?g|gif|svg|mp3|mp4|pdf)$/i.test(relative)) continue;

    const destination = path.join(publicMedia, location.prefix, relative);
    if (fs.existsSync(destination)) {
      if (digest(source) !== digest(destination)) {
        mismatches.push({
          source: path.relative(root, source),
          destination: path.relative(root, destination),
        });
      }
      continue;
    }

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    copied.push(path.relative(root, destination));
  }
}

const moveRecoverably = (sourceRelative) => {
  const source = path.join(storage, sourceRelative);
  if (!fs.existsSync(source)) return null;
  const destination = path.join(quarantine, sourceRelative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
  return path.relative(root, destination);
};

const quarantined = [
  moveRecoverably('pbc_2106002237/eqa7m5zumn6oerg'),
  moveRecoverably('pbc_3385299895/1ocjjtsqd17xjoh'),
  moveRecoverably('pbc_611321537/6b2er0psow3nmej'),
  moveRecoverably('pbc_3385299895/qdpzfhncu0sxv6p/sandan_rlzzvpf2vg.webp'),
  moveRecoverably('pbc_3385299895/qdpzfhncu0sxv6p/sandan_rlzzvpf2vg.webp.attrs'),
].filter(Boolean);

console.log(JSON.stringify({ copiedCount: copied.length, copied, mismatches, quarantined }, null, 2));
