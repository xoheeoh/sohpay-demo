module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.web.tsx', '.web.ts', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@screens': './src/screens',
            '@components': './src/components',
            '@utils': './src/utils',
            '@styles': './src/styles',
            '@typ': './src/types',
            '@contexts': './src/svc/contexts',
            '@images': './assets/images',
            '@apis': './src/svc/apis',
            '@storages': './src/svc/storages',
            '@dt': './src/svc/data',
            '@env': './src/shims/env',
            // 원본은 react-native-linear-gradient 를 쓴다. Expo 에서는 같은 API 의 expo-linear-gradient 로 연결.
            'react-native-linear-gradient': './src/shims/linear-gradient',
            // 웹에는 WebView 구현이 없어 iframe 대역으로 연결한다 (하위 경로 import 는 원본 패키지로 간다)
            '^react-native-webview$': './src/shims/webview',
          },
        },
      ],
    ],
  };
};
