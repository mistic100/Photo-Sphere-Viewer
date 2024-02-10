import createConfig from '../../build/tsup.config';
import pkg from './package.json' assert { type: 'json' };

export default createConfig(pkg);
