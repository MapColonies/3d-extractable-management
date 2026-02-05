import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import jestConfig from '@map-colonies/eslint-config/jest';
import { config } from '@map-colonies/eslint-config/helpers';

export default config(jestConfig, tsBaseConfig, {
  rules: {
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/switch-exhaustiveness-check': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
  },
});
