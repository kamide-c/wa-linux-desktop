/** @type {import('webpack').Configuration} */
const config = {
  entry: './src/main/index.ts',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
      { test: /\.svg$/, type: 'asset/source' },
      { test: /\.png$/, type: 'asset/inline' },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
};

export default config;
