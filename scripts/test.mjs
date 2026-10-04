import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.test-build',{recursive:true});
await build({entryPoints:['tests/state.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/state.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/state.test.mjs');

await build({entryPoints:['tests/journal-regression.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/journal-regression.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/journal-regression.test.mjs');

await build({entryPoints:['tests/navigation-search.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/navigation-search.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/navigation-search.test.mjs');

await build({entryPoints:['tests/navigation.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/navigation.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/navigation.test.mjs');
