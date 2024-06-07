import type { Comment, Node, Rule } from 'postcss';
import postcss from 'postcss';
import { DEFAULTS, processComment, processRule } from './shared.js';
import type { _MediaStackItem, PluginOptions } from './types.js';

export default (postcss as any).plugin('postcss-increase-specificity', (options: Partial<PluginOptions> = {}) => {
	const settings = { ...DEFAULTS, ...options };
	const mediaStack: _MediaStackItem[] = [];

	return (css: any) => {
		css.walk((node: Node) => {
			if (node.type === 'rule') processRule(node as Rule, settings, mediaStack);
			if (node.type === 'comment') processComment(node as Comment, settings, mediaStack);
		});
	};
});
