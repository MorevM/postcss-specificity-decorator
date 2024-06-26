import type { Options } from 'tsup';

export const tsup: Options = {
	sourcemap: false,
	clean: true,
	target: 'esnext',
	format: ['cjs', 'esm'],
	dts: {
		entry: 'src/index.ts',
	},
	entryPoints: [
		'src/index.ts',
		'src/postcss7.ts',
	],
	outExtension: ({ format }) => ({ js: format === 'cjs' ? `.${format}` : `.js` }),
};
