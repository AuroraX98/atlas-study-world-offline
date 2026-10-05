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

await build({entryPoints:['tests/gallery-draft.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/gallery-draft.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/gallery-draft.test.mjs');

await build({entryPoints:['tests/assistant-drafts.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/assistant-drafts.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/assistant-drafts.test.mjs');

await build({entryPoints:['tests/horizon-goal-draft.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/horizon-goal-draft.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/horizon-goal-draft.test.mjs');

await build({entryPoints:['tests/practice-storage.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/practice-storage.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/practice-storage.test.mjs');

await build({entryPoints:['tests/practice-content.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/practice-content.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/practice-content.test.mjs');

await build({entryPoints:['tests/practice-draft.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.test-build/practice-draft.test.mjs',packages:'external',jsx:'automatic',alias:{'@':'./src'}});
await import('../.test-build/practice-draft.test.mjs');
