/** @type {import('webpack').Configuration} */
const config = {
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
