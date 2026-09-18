import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  packagerConfig: {
    asar: true,
  },
  plugins: [
    new WebpackPlugin({
      mainConfig: './webpack.main.config.ts',
      renderer: {
        config: './webpack.renderer.config.ts',
        entryPoints: [],
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
