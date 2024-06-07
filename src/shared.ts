import type { Comment, Rule } from 'postcss';
import type { _PluginOptions, _MediaStackItem, PluginOptions } from './types';

export const DEFAULTS: PluginOptions = {
	root: ':not(#\\9)',
	keyword: '@specificity',
	sourceType: 'css',
};

export const increaseSpecificityOfRule = (rule: Rule, settings: _PluginOptions) => {
	rule.selectors = rule.selectors.map(selector => {
		// Apply to the root if the selector is a `root` level component or includes it
		// Example: `html:not(#\\9)`
		if (
			(['html', ':root', ':host', settings.root].some(s => selector.startsWith(s)))
		) {
			const [root, ...rest] = selector.split(' ');
			return [root + settings.root.repeat(settings.repeat), ...rest].join(' ');
		}

		// Otherwise make it a descendant (this is what will happen most of the time)
		// Example: `:not(#\9) .foo`
		return [settings.root.repeat(settings.repeat), selector].join(' ');
	});
};

export const processComment = (comment: Comment, settings: PluginOptions, mediaStack: _MediaStackItem[]) => {
	const isImportantComment = comment.text.startsWith('!');
	const text = isImportantComment ? comment.text.replace(/^!\s*/, '') : comment.text;
	if (!text.startsWith(settings.keyword)) return;

	const isDecoratorInside = settings.sourceType === 'scss';

	const rule = isDecoratorInside
		? comment.parent as Rule
		: comment.next() as Rule | undefined;

	if (!rule || rule.type !== 'rule') {
		!isImportantComment && comment.remove();
		return;
	}

	const repeat = parseInt(comment.text.replace(settings.keyword, '').trim(), 10) || 1;
	isDecoratorInside && mediaStack.push({ selector: rule.selector, repeat });

	increaseSpecificityOfRule(rule, { ...settings, repeat });
	!isImportantComment && comment.remove();
};

export const processRule = (rule: Rule, settings: PluginOptions, mediaStack: _MediaStackItem[]) => {
	const m = mediaStack.find(i => i.selector === rule.selector);
	if (!m) return;

	if (rule.parent?.type === 'atrule' && ('name' in rule.parent && rule.parent.name === 'media')) {
		increaseSpecificityOfRule(rule, { ...settings, repeat: m.repeat });
	}
};
