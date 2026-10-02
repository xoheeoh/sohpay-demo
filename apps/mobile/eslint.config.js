// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // React 컴파일러용 규칙. 이 프로젝트는 컴파일러를 쓰지 않아 동작과 무관하고,
    // 지적하는 패턴(효과 안 상태 변경, 렌더 중 ref 접근 등)은 구조를 바꿔야 고칠 수 있어 참고용 경고로 둔다
    rules: {
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);
