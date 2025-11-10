import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const plugin = require('./src');

export default plugin;
