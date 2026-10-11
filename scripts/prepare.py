#!/usr/bin/env python3
"""Prepare a pinned upstream checkout; never modifies an installed application."""
import argparse, hashlib, json, shutil, subprocess, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / '.build/upstream'

def run(*args, cwd=None):
    subprocess.run(args, cwd=cwd, check=True)

def fetch_assets(destination):
    for item in json.loads((ROOT / 'assets.json').read_text()):
        target = destination / item['path']
        cache = ROOT / '.cache/assets' / item['sha256']
        if not cache.exists() or hashlib.sha256(cache.read_bytes()).hexdigest() != item['sha256']:
            print('Downloading', item['path'], flush=True)
            with urllib.request.urlopen(item['url'], timeout=45) as response:
                data = response.read()
            if hashlib.sha256(data).hexdigest() != item['sha256']:
                raise RuntimeError('Asset changed upstream; refusing unverified content: ' + item['path'])
            cache.parent.mkdir(parents=True, exist_ok=True)
            cache.write_bytes(data)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(cache, target)
    (ROOT / 'preview/neo').mkdir(parents=True, exist_ok=True)
    for p in (destination / 'public/pieces/neo').glob('*.png'):
        shutil.copyfile(p, ROOT / 'preview/neo' / p.name)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--upstream', help='Optional local upstream clone; still checks out the pinned commit')
    parser.add_argument('--assets-only', action='store_true', help='Fetch verified assets into an already prepared checkout')
    args = parser.parse_args()
    if args.assets_only:
        if not (BUILD / '.neo-croissant-ready').is_file():
            parser.error('Run prepare.py first')
        fetch_assets(BUILD)
        return
    if BUILD.exists():
        parser.error('.build/upstream already exists; use a fresh kit directory for a fresh build')
    meta = json.loads((ROOT / 'upstream.json').read_text())
    BUILD.parent.mkdir(parents=True, exist_ok=True)
    if args.upstream:
        run('git', 'clone', '--no-hardlinks', str(Path(args.upstream).resolve()), str(BUILD))
    else:
        run('git', 'init', str(BUILD))
        run('git', 'remote', 'add', 'origin', meta['repository'], cwd=BUILD)
        run('git', 'fetch', '--depth=1', 'origin', meta['commit'], cwd=BUILD)
    run('git', 'checkout', '--detach', meta['commit'], cwd=BUILD)
    run('git', 'apply', '--check', str(ROOT / 'patches/en-croissant.patch'), cwd=BUILD)
    run('git', 'apply', str(ROOT / 'patches/en-croissant.patch'), cwd=BUILD)
    shutil.copytree(ROOT / 'overlay', BUILD, dirs_exist_ok=True)
    fetch_assets(BUILD)
    (BUILD / '.neo-croissant-ready').write_text(meta['commit'] + '\n')
    print('Ready:', BUILD)

if __name__ == '__main__':
    main()
