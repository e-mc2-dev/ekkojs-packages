// SPDX: MIT. Adapted from microsoft/monaco-editor (c) Microsoft Corporation,
// src/languages/definitions/dockerfile. Monarch grammar for asgard SyntaxColor:
// the LanguageConfiguration (conf) is stripped and the definition is typed to asgard's MonarchLanguage.
import type { MonarchLanguage } from '../types';

export const dockerfileLanguage: MonarchLanguage = {
	defaultToken: '',
	tokenPostfix: '.dockerfile',

	variable: /\${?[\w]+}?/,

	tokenizer: {
		root: [
			{ include: '@whitespace' },
			{ include: '@comment' },

			[/(ONBUILD)(\s+)/, ['keyword', '']],
			[/(ENV)(\s+)([\w]+)/, ['keyword', '', { token: 'variable', next: '@arguments' }]],
			[
				/(FROM|MAINTAINER|RUN|EXPOSE|ENV|ADD|ARG|VOLUME|LABEL|USER|WORKDIR|COPY|CMD|STOPSIGNAL|SHELL|HEALTHCHECK|ENTRYPOINT)/,
				{ token: 'keyword', next: '@arguments' }
			]
		],

		arguments: [
			{ include: '@whitespace' },
			{ include: '@strings' },

			[
				/(@variable)/,
				{
					cases: {
						'@eos': { token: 'variable', next: '@popall' },
						'@default': 'variable'
					}
				}
			],
			[
				/\\/,
				{
					cases: {
						'@eos': '',
						'@default': ''
					}
				}
			],
			[
				/./,
				{
					cases: {
						'@eos': { token: '', next: '@popall' },
						'@default': ''
					}
				}
			]
		],

		// Deal with white space, including comments
		whitespace: [
			[
				/\s+/,
				{
					cases: {
						'@eos': { token: '', next: '@popall' },
						'@default': ''
					}
				}
			]
		],

		comment: [[/(^#.*$)/, 'comment', '@popall']],

		// Recognize strings, including those broken across lines with \ (but not without)
		strings: [
			[/\\'$/, '', '@popall'], // \' leaves @arguments at eol
			[/\\'/, ''], // \' is not a string
			[/'$/, 'string', '@popall'],
			[/'/, 'string', '@stringBody'],
			[/"$/, 'string', '@popall'],
			[/"/, 'string', '@dblStringBody']
		],
		stringBody: [
			[
				/[^\\\$']/,
				{
					cases: {
						'@eos': { token: 'string', next: '@popall' },
						'@default': 'string'
					}
				}
			],

			[/\\./, 'string.escape'],
			[/'$/, 'string', '@popall'],
			[/'/, 'string', '@pop'],
			[/(@variable)/, 'variable'],

			[/\\$/, 'string'],
			[/$/, 'string', '@popall']
		],
		dblStringBody: [
			[
				/[^\\\$"]/,
				{
					cases: {
						'@eos': { token: 'string', next: '@popall' },
						'@default': 'string'
					}
				}
			],

			[/\\./, 'string.escape'],
			[/"$/, 'string', '@popall'],
			[/"/, 'string', '@pop'],
			[/(@variable)/, 'variable'],

			[/\\$/, 'string'],
			[/$/, 'string', '@popall']
		]
	}
};
