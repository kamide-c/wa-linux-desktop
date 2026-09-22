const path = require('node:path');
const fs = require('fs-extra');
const { MakerRpm, rpmArch } = require('@electron-forge/maker-rpm');

const renameRpm = (dest) => path.join(dest, '<%= name %>-<%= version %>-<%= revision %>.<%= arch === "aarch64" ? "arm64" : arch %>.rpm');

/**
 * Fedora 44's rpm-build enters a generated %mkbuilddir directory before
 * running %install. electron-installer-redhat 3.4.0 still assumes the old
 * working directory when copying its staged usr tree.
 */
class FedoraRpmMaker extends MakerRpm {
  async make({ dir, makeDir, targetArch }) {
    const installerModule = require('electron-installer-redhat');
    const outDir = path.resolve(makeDir, 'rpm', targetArch);
    await this.ensureDirectory(outDir);

    const installer = new installerModule.Installer({
      ...this.config,
      arch: rpmArch(targetArch),
      src: dir,
      dest: outDir,
      rename: renameRpm,
      logger: () => {},
    });

    await installer.generateDefaults();
    await installer.generateOptions();
    await installer.generateScripts();
    await installer.createStagingDir();
    await installer.createContents();

    const specPath = path.join(installer.stagingDir, 'SPECS', `${installer.options.name}.spec`);
    const spec = await fs.readFile(specPath, 'utf8');
    await fs.writeFile(specPath, spec.replace('cp -r usr/*', 'cp -r %{_topdir}/BUILD/usr/*'));

    await installer.createPackage();
    await installer.movePackage();
    return installer.options.packagePaths;
  }
}

module.exports = { FedoraRpmMaker };
