#!/usr/bin/env python3
"""Build a local macOS app using a compatible existing app as the bundle template."""
import argparse, json, platform, plistlib, shutil, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--template', type=Path, default=Path('/Applications/En Croissant.app'))
a = p.parse_args()
if platform.system() != 'Darwin':
    p.error('The app packaging helper currently supports macOS only')
meta = json.loads((ROOT / 'upstream.json').read_text())
info = plistlib.loads((a.template / 'Contents/Info.plist').read_bytes())
if info.get('CFBundleIdentifier') != 'org.encroissant.app' or info.get('CFBundleShortVersionString') != meta['version']:
    p.error('Use an En Croissant ' + meta['version'] + ' app bundle as the template')
build = ROOT / '.build/upstream'
if not (build / '.neo-croissant-ready').exists():
    p.error('Run scripts/prepare.py first')
for cmd in [['pnpm','install','--frozen-lockfile'], ['pnpm','exec','vitest','run','src/chessground/animation.test.ts','src/chessground/appMotion.test.ts','tests/dynamicMotion.test.ts'], ['pnpm','build']]:
    subprocess.run(cmd, cwd=build, check=True)
out = ROOT / '.build/En Croissant.app'
if out.exists():
    p.error('Build output already exists; move it before creating another bundle')
subprocess.run(['ditto',str(a.template),str(out)],check=True)
shutil.copy2(build / 'src-tauri/target/release/en-croissant', out / 'Contents/MacOS' / info['CFBundleExecutable'])
shutil.copytree(build / 'sound', out / 'Contents/Resources/sound', dirs_exist_ok=True)
subprocess.run(['codesign','--force','--deep','--sign','-',str(out)],check=True)
subprocess.run(['codesign','--verify','--deep','--strict',str(out)],check=True)
print('Built (not installed):', out)
