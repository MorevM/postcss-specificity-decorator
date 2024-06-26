import fs from 'node:fs';
import { join } from 'node:path';
import commonjsVariables from 'commonjs-variables-for-esmodules';
import postcss from 'postcss';
import CleanCSS from 'clean-css';
import * as sass from 'sass';
import specificityDecorator from '../src/index';
import type { PluginOptions } from '../src/types';

const clean = new CleanCSS({ format: 'beautify' });

const { __dirname } = commonjsVariables(import.meta);

const testPluginFactory = (
	context: 'scss' | 'css',
	scss = false,
) => (
	directory: string,
	options: Partial<PluginOptions> = {},
) => {
	const extension = scss ? '.scss' : '.css';
	const getContents = (file: string) => fs.readFileSync(
		join(__dirname, 'fixtures', context, directory, `${file}${extension}`),
		{ encoding: 'utf8' },
	);

	const source = scss ? sass.compileString(getContents('input')).css : getContents('input');
	scss && (options.sourceType = 'scss');

	const input = clean.minify(
		postcss([specificityDecorator(options)]).process(source).css,
	).styles;

	return [input, clean.minify(getContents('expected')).styles];
};

let testPlugin: ReturnType<typeof testPluginFactory>;

describe('postcss-specificity-decorator', () => {
	describe(`sourceType === 'css'`, () => {
		beforeAll(() => {
			testPlugin = testPluginFactory('css');
		});

		it(`Does nothing if there is no specificity decorators`, () => {
			const [input, expected] = testPlugin('nothing');

			expect(input).toBe(expected);
		});

		it(`Does nothing if the decorator is in the wrong place`, () => {
			const [input, expected] = testPlugin('wrong-place');

			expect(input).toBe(expected);
		});

		it(`Increases specificity of single selector`, () => {
			const [input, expected] = testPlugin('single-selector');

			expect(input).toBe(expected);
		});

		it(`Increases specificity of multiple selectors`, () => {
			const [input, expected] = testPlugin('multiple-selectors');

			expect(input).toBe(expected);
		});

		it(`Correctly works with (mistakenly) repeated decorator`, () => {
			const [input, expected] = testPlugin('repeating-decorator');

			expect(input).toBe(expected);
		});

		it(`Respects custom 'keyword' setting`, () => {
			const [input, expected] = testPlugin('custom-keyword', {
				keyword: '+spec',
			});

			expect(input).toBe(expected);
		});

		it(`Respects custom 'root' setting`, () => {
			const [input, expected] = testPlugin('custom-root', {
				root: '#global-wrapper',
			});

			expect(input).toBe(expected);
		});

		it(`Respects 'repeat' option provided inline`, () => {
			const [input, expected] = testPlugin('custom-repeat');

			expect(input).toBe(expected);
		});

		it(`Correctly works with selectors considered root`, () => {
			const [input, expected] = testPlugin('root-selectors');

			expect(input).toBe(expected);
		});
	});

	describe(`sourceType === 'scss'`, () => {
		beforeAll(() => {
			testPlugin = testPluginFactory('scss', true);
		});

		it(`Correctly works with parent selector (BEM notation)`, () => {
			const [input, expected] = testPlugin('parent-selector-simple');

			expect(input).toBe(expected);
		});

		it(`Correctly works with deeply nested parent selector`, () => {
			const [input, expected] = testPlugin('parent-selector-nested');

			expect(input).toBe(expected);
		});

		it(`Automatically increases specificity of nested media queries`, () => {
			const [input, expected] = testPlugin('parent-selector-nested-media');

			expect(input).toBe(expected);
		});
	});
});
