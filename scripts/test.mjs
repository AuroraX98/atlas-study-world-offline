import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.test-build',{recursive:true});
await build({entryPoints:['tests/state.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/state.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/state.test.mjs');
