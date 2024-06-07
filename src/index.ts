import type { Comment, Rule } from 'postcss';
import { DEFAULTS, processComment, processRule } from './shared.js';
import type { _MediaStackItem, PluginOptions } from './types.js';

const plugin = (options: Partial<PluginOptions> = {}) => {
	const settings = { ...DEFAULTS, ...options };
	let mediaStack: _MediaStackItem[] = [];

	return {
		postcssPlugin: 'postcss-specificity-decorator',
		OnceExit: () => { mediaStack = []; },
		Rule: (rule: Rule) => processRule(rule, settings, mediaStack),
		Comment: (comment: Comment) => processComment(comment, settings, mediaStack),
	};
};

plugin.postcss = true;
export default plugin;
