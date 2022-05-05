type PluginOptions = Partial<{
	/**
	 * The keyword that triggers plugin to process the rule. \
	 * The comment SHOULD start with that keyword to run.
	 *
	 * @default '@specificity'
	 */
	keyword: string;

	/**
	 * Source file type. Affects needed decorator position. \
	 * For CSS files ('css', default) comment SHOULD be placed AHEAD of rule needed to process. \
	 * For SCSS files ('scss') comment SHOULD be placed INSIDE the rule. Details in README.md.
	 *
	 * @default 'css'
	 */
	sourceType: 'css' | 'scss';
}>;

declare const specificityDecorator: {
	(options: PluginOptions): any;
	postcss: true;
};
export default specificityDecorator;
