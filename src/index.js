import { DEFAULTS, processComment, processRule } from './shared.js';

export default (options = {}) => {
	const settings = { ...DEFAULTS, ...options };
	let mediaStack = [];

	return {
		postcssPlugin: 'postcss-specificity-decorator',
		OnceExit: () => (mediaStack = []),
		Rule: (rule) => processRule(rule, settings, mediaStack),
		Comment: (comment) => processComment(comment, settings, mediaStack),
	};
};

export const postcss = true;
