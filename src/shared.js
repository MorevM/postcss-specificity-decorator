const ROOT = `:not(#\\9)`;

export const DEFAULTS = {
	keyword: '@specificity',
	sourceType: 'css',
};

export const increaseSpecificityOfRule = (rule, settings) => {
	rule.selectors = rule.selectors.map(selector => {
		// Apply to the root if the selector is a `root` level component or includes it
		// `html:not(#\\9)`
		if (['html', ':root', ':host'].some(s => selector.startsWith(s))) {
			const [root, ...rest] = selector.split(' ');
			return [root + ROOT.repeat(settings.repeat), ...rest].join(' ');
		}

		// Otherwise make it a descendant (this is what will happen most of the time)
		// `:not(#\9) .foo`
		return [ROOT.repeat(settings.repeat), selector].join(' ');
	});
};

export const processComment = (comment, settings, mediaStack) => {
	const isImportantComment = comment.text.startsWith('!');
	const text = isImportantComment ? comment.text.replace(/^!\s*/, '') : comment.text;
	if (!text.startsWith(settings.keyword)) return;

	const isDecoratorInside = settings.sourceType === 'scss';

	const rule = isDecoratorInside ? comment.parent : comment.next();
	if (!rule || rule.type !== 'rule') {
		!isImportantComment && comment.remove();
		return;
	}
	const repeat = parseInt(comment.text.replace(settings.keyword, '').trim(), 10) || 1;
	isDecoratorInside && mediaStack.push({ selector: rule.selector, repeat });

	increaseSpecificityOfRule(rule, { ...settings, repeat });
	!isImportantComment && comment.remove();
};

export const processRule = (rule, settings, mediaStack) => {
	const m = mediaStack.find(i => i.selector === rule.selector);
	if (!m) return;
	if (rule.parent.type === 'atrule' && rule.parent.name === 'media') {
		increaseSpecificityOfRule(rule, { ...settings, repeat: m.repeat });
	}
};
