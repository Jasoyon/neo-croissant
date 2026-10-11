import importlib.util, plistlib, shutil, subprocess, sys, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('installer',ROOT/'scripts/install_macos.py')
installer=importlib.util.module_from_spec(spec);spec.loader.exec_module(installer)

@unittest.skipUnless(sys.platform=='darwin','macOS bundle/signature test')
class InstallerTests(unittest.TestCase):
    def test_backup_install_restore_and_reject_invalid(self):
        with tempfile.TemporaryDirectory() as t:
            base=Path(t);dest=base/'Applications/En Croissant.app';new=base/'candidate.app';backups=base/'backups'
            sentinel=base/'personal-games.pgn';sentinel.write_text('untouched game')
            for app,marker in [(dest,'original'),(new,'replacement')]:
                (app/'Contents/MacOS').mkdir(parents=True);(app/'Contents/Resources').mkdir()
                (app/'Contents/Info.plist').write_bytes(plistlib.dumps({'CFBundleIdentifier':'org.encroissant.app','CFBundleExecutable':'en-croissant','CFBundleName':'En Croissant','CFBundleVersion':'0.15.0','CFBundlePackageType':'APPL'}))
                shutil.copyfile('/usr/bin/true',app/'Contents/MacOS/en-croissant')
                (app/'Contents/MacOS/en-croissant').chmod(0o755)
                (app/'Contents/Resources/marker').write_text(marker)
                subprocess.run(['codesign','--force','--deep','--sign','-',str(app)],check=True,capture_output=True)
            installer.install(new,dest,backups)
            self.assertEqual((dest/'Contents/Resources/marker').read_text(),'replacement')
            first=next(backups.glob('*.zip'))
            subprocess.run([sys.executable,str(ROOT/'scripts/install_macos.py'),'--restore',str(first),'--destination',str(dest),'--backups',str(backups)],check=True)
            self.assertEqual((dest/'Contents/Resources/marker').read_text(),'original')
            self.assertEqual(sentinel.read_text(),'untouched game')
            self.assertEqual(len(list(backups.glob('*.zip'))),2)
            invalid=base/'invalid.app';invalid.mkdir()
            with self.assertRaises(ValueError):installer.install(invalid,dest,backups)
            self.assertEqual((dest/'Contents/Resources/marker').read_text(),'original')

if __name__=='__main__':unittest.main()
