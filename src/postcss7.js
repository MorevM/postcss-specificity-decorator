import postcss from 'postcss';
import { DEFAULTS, processComment, processRule } from './shared.js';

export default postcss.plugin('postcss-increase-specificity', (options = {}) => {
	const settings = { ...DEFAULTS, ...options };
	const mediaStack = [];

	return (css) => {
		css.walk(node => {
			if (node.type === 'rule') processRule(node, settings, mediaStack);
			if (node.type === 'comment') processComment(node, settings, mediaStack);
		});
	};
});
