import path from 'node:path';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FedoraRpmMaker } from './forge/fedora-rpm-maker.cjs';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  packagerConfig: {
    asar: true,
    executableName: 'wa-desktop-linux',
    icon: path.resolve(__dirname, 'src/assets/whatsapp-icon.png'),
  },
  makers: [
    new FedoraRpmMaker({
      options: {
        icon: path.resolve(__dirname, 'src/assets/whatsapp-icon.png'),
        desktopTemplate: path.resolve(__dirname, 'forge/whatsapp.desktop.ejs'),
      },
    }),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig: './webpack.main.config.ts',
      renderer: {
        config: './webpack.renderer.config.ts',
        entryPoints: [{ name: 'remote-window', js: './src/renderer/placeholder.ts' }],
      },
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
    }),
  ],
};

export default config;
