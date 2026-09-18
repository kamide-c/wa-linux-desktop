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
    ],
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
};

export default config;
