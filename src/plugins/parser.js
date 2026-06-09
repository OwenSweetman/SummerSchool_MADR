import { cloneDeep, concat, replace } from "lodash";
import { load as yamlLoad, dump as yamlDump } from "js-yaml";

import antlr4 from "antlr4";
import MADRLexer from "./parser/MADRLexer.js";
import MADRParser from "./parser/MADRParser.js";
import MADRListener from "./parser/MADRListener.js";
import { ArchitecturalDecisionRecord } from "./classes";
import { createShortTitle, naturalCase2titleCase } from "./utils.ts";
import { stringify } from "querystring";

/**
 * Creates an ADR from a ParseTree by listening to a ParseTreeWalker.
 *
 * Use with '''antlr4.tree.ParseTreeWalker.DEFAULT.walk(generator, parseTree);'''
 * The parsed ADR is saved in the attribute 'adr'.
 *
 * Local variables:
 *
 * - currentOption: The current option, either the considered one or the current one handled at "Pros and Cons of the Options"
 */
class MADRGenerator extends MADRListener {
	constructor() {
		super();
		this.adr = new ArchitecturalDecisionRecord();
	}

	enterYaml(ctx) {
		const rawYaml = ctx.getText();
		this.adr.yaml = rawYaml;
		this.parseYamlMetadata(rawYaml);
	}

	enterTitle(ctx) {
		this.adr.title = naturalCase2titleCase(ctx.getText());
	}

	enterContextAndProblemStatement(ctx) {
		this.adr.contextAndProblemStatement = ctx.getText();
	}

	enterDecisionDrivers(ctx) {
		this.addListItemsFromListToList(ctx.children[0], this.adr.decisionDrivers);
	}

	enterConsideredOptions(ctx) {
		let tmpOptionList = [];
		this.addListItemsFromListToList(ctx.children[0], tmpOptionList);
		tmpOptionList.forEach((opt) => {
			if (opt.trim() !== "") {
				this.adr.addOption({ title: opt });
			}
		});
	}

	/**
	 * Handles "Decision outcome"
	 */
	enterChosenOptionAndExplanation(ctx) {
		let rawDecisionOutcome = ctx.getText();

		if (rawDecisionOutcome.startsWith("Chosen option: ")) {
			rawDecisionOutcome = rawDecisionOutcome.split(/, because */);
			rawDecisionOutcome[0] = rawDecisionOutcome[0].substring("Chosen option: ".length).trim(); // Remove 'Chosen option: '
			let delim = rawDecisionOutcome[0].charAt(0);
			let chosenOption = "";

			if (delim === rawDecisionOutcome[0].charAt(rawDecisionOutcome[0].length - 1)) {
				chosenOption = rawDecisionOutcome[0].substring(1, rawDecisionOutcome[0].length - 1);
			} else {
				chosenOption = rawDecisionOutcome[0];
			}
			let explanation = rawDecisionOutcome.slice(1).join();
			this.adr.decisionOutcome.chosenOption = chosenOption;
			this.adr.decisionOutcome.explanation = explanation.trim();
		} else {
			console.log("Couldn't find chosen option.");
		}
	}

	/**
	 * Handles "### Consequences" — bullets prefixed "Good, because " / "Bad, because " in one list.
	 */
	enterConsequences(ctx) {
		// The ANTLR adaptive prediction does not reliably produce textLine children
		// for the consequences list, so bullet text is extracted via parseConsequencesFromMd
		// called after the walk (see md2adr). This handler is intentionally left as a no-op.
	}

	/**
	 * Handles "### Confirmation" — free-form prose under Decision Outcome.
	 */
	enterConfirmation(ctx) {
		// No-op: confirmation is extracted via parseConfirmationFromMd after the walk.
		// ANTLR tokenizes 'Good, because ' etc. as special tokens that multilineText
		// cannot consume, so regex extraction is used instead.
	}

	/**
	 * Header after "Pros and Cons of the Options"
	 */
	enterOptionTitle(ctx) {
		let title = ctx.getText();
		this.currentOption = this.getMostSimilarOptionTo(title);
		if (!this.currentOption) {
			// No matching option found?
			// Create a new one (otherwise the content of the pro/con list will get missing)
			this.currentOption = this.adr.addOption({ title: title });
		}
	}

	enterOptionDescription(ctx) {
		if (this.currentOption) {
			this.currentOption.description = ctx.getText();
		}
	}

	/**
	 * Handles the mixed Good/Neutral/Bad argument list under each option.
	 * The grammar consumes the prefix literal, so we walk children to recover which kind each bullet is.
	 */
	enterArgumentList(ctx) {
		if (!this.currentOption) return;
		let currentKind = null;
		const textLineRuleIndex = MADRParser.ruleNames.indexOf("textLine");
		for (const child of ctx.children || []) {
			const text = typeof child.getText === "function" ? child.getText() : "";
			if (text === "Good, because ") {
				currentKind = "good";
			} else if (text === "Neutral, because ") {
				currentKind = "neutral";
			} else if (text === "Bad, because ") {
				currentKind = "bad";
			} else if (currentKind != null && child.ruleIndex === textLineRuleIndex) {
				const argText = text.trim();
				if (argText) {
					if (currentKind === "good") this.currentOption.pros.push(argText);
					else if (currentKind === "neutral") this.currentOption.neutral.push(argText);
					else if (currentKind === "bad") this.currentOption.cons.push(argText);
				}
				currentKind = null;
			}
		}
	}

	enterMoreInformation(ctx) {
		this.adr.moreInformation = ctx.getText();
	}

	/**
	 * Minimal YAML parser for MADR 4.0 metadata. Handles:
	 *   key: scalar           — populates a string field
	 *   key: [a, b, c]        — populates a string[] field
	 *   key: a, b, c          — populates a string[] field
	 *   "quoted scalar"       — quotes stripped
	 *   # comment lines       — skipped
	 * For richer YAML (nested structures, block lists, multiline) use js-yaml in Track B.
	 *
	 * @param {string} yamlText the raw "---\n...\n---" block from the grammar
	 */
	parseYamlMetadata(yamlText) {
		const inner = yamlText.replace(/^---\s*\n/, "").replace(/\n---\s*$/, "");
		const lines = inner.split("\n");
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const colonIdx = trimmed.indexOf(":");
			if (colonIdx === -1) continue;
			const key = trimmed.substring(0, colonIdx).trim();
			let value = trimmed.substring(colonIdx + 1).trim();
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.substring(1, value.length - 1);
			}
			switch (key) {
				case "status":
					this.adr.status = value;
					break;
				case "date":
					this.adr.date = value;
					break;
				case "decision-makers":
					this.adr.decisionMakers = this.parseYamlList(value);
					break;
				case "consulted":
					this.adr.consulted = this.parseYamlList(value);
					break;
				case "informed":
					this.adr.informed = this.parseYamlList(value);
					break;
			}
		}
	}

	parseYamlList(value) {
		let inner = value.trim();
		if (inner.startsWith("[") && inner.endsWith("]")) {
			inner = inner.substring(1, inner.length - 1);
		}
		return inner
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s !== "");
	}

	/**
	 *
	 * @param {string} optTitle the title in the "Chosen option" part
	 */
	getMostSimilarOptionTo(optTitle) {
		// Find the option with a very similar title.
		let opt = this.adr.consideredOptions.find(function (opt) {
			return this.matchOptionTitleAlmostExactly(opt.title, optTitle);
		}, this);
		if (opt) {
			// If a fitting option was found, return it.
			return opt;
		}
		// Else check if there is another (less) similar title.
		opt = this.adr.consideredOptions.find(function (opt) {
			return matchOptionTitleMoreRelaxed(opt.title, optTitle);
		}, this);
		if (opt) {
			// If a fitting option was found, return it.
			return opt;
		}
		// just set the option to not found
		return null;
	}

	/**
	 * Option titles are similar, iff they are equal after
	 *  (1) removing all white spaces
	 *  (2) lower-casing them.
	 *
	 * @param {string} optTitle1
	 * @param {string} optTitle2
	 * @returns {boolean} True, iff the option titles are very similar.
	 */
	matchOptionTitleAlmostExactly(optTitle1, optTitle2) {
		let trimmed1 = optTitle1.replace(/ /g, "").toLowerCase(); // Remove whitespaces and lower-case heading
		let trimmed2 = optTitle2.replace(/ /g, "").toLowerCase();
		return trimmed1 === trimmed2;
	}

	/**
	 *
	 * @param {} parseTreeList - a list node in the parse tree.
	 * @param {string[]} targetList - a js array, where each list entry is copied into.
	 */
	addListItemsFromListToList(parseTreeList, targetList) {
		for (let i = 0; i < parseTreeList.children.length; i++) {
			if (
				parseTreeList.children[i].ruleIndex === MADRParser.ruleNames.indexOf("textLine") && // if it is a text line
				parseTreeList.children[i].getText().trim() !== ""
			) {
				targetList.push(parseTreeList.children[i].getText());
			}
		}
	}
}

/**
 * Error listener that counts the number of parsing errors during ADR parsing
 */
class MADRErrorListener extends antlr4.error.ErrorListener {
	constructor() {
		super();
		this.syntaxErrors = [];
	}

	syntaxError(recognizer, offendingSymbol, line, charPositionInLine, msg, exception) {
		this.syntaxErrors.push({
			message: msg,
			line: line,
			charPosition: charPositionInLine,
		});
	}
}

/**
 * Strips the opening and closing --- fences from a raw YAML frontmatter string.
 * @param {string} yaml
 * @returns {string}
 */
function stripYamlFences(yaml) {
	return yaml.replace(/^---\n?/, "").replace(/\n?---\n?$/, "");
}

/**
 * Extracts TC annotation fields from the raw YAML frontmatter string stored in adr.yaml
 * and populates adr.tc. Does nothing if no TC fields are present.
 * @param {ArchitecturalDecisionRecord} adr
 */
function parseTcFromYaml(adr) {
	if (!adr.yaml) return;
	const raw = stripYamlFences(adr.yaml);
	let parsed;
	try {
		parsed = yamlLoad(raw);
	} catch (e) {
		return;
	}
	// Require at least one tc-* key to be present before populating adr.tc
	if (!parsed || typeof parsed !== "object") return;
	const hasTcFields = Object.keys(parsed).some((k) => k.startsWith("tc-"));
	if (!hasTcFields) return;
	adr.tc = {
		benefit: parsed["tc-benefit"],
		category: parsed["tc-category"],
		conditions: parsed["tc-conditions"] ?? "",
		signals: {
			tags: parsed["tc-signals"] ?? [],
			note: parsed["tc-signals-note"],
		},
		confidence: parsed["tc-confidence"],
		status: parsed["tc-status"],
		related: parsed["tc-related"],
	};
}

/**
 * Writes a pro-only TC field into the parsed YAML object, or deletes it if not in professional mode.
 * @param {object} parsed
 * @param {string} key
 * @param {'basic'|'professional'} mode
 * @param {*} value
 */
function writeProOnly(parsed, key, mode, value) {
	if (mode === 'professional' && value !== undefined) {
		parsed[key] = value;
	} else {
		delete parsed[key];
	}
}

/**
 * Merges the current adr.tc values back into the YAML frontmatter string (adr.yaml).
 * Creates a new YAML block if one does not exist. Strips tc-* keys if adr.tc is undefined.
 * Pro-only fields (tc-status, tc-related) are only written when mode === 'professional'.
 * @param {ArchitecturalDecisionRecord} adr
 * @param {'basic'|'professional'} mode
 */
function serializeTcToYaml(adr, mode = 'professional') {
	// Determine whether we need a YAML block at all.
	const hasMetadata = adr.status || adr.date ||
		(adr.decisionMakers && adr.decisionMakers.length > 0) ||
		(adr.consulted && adr.consulted.length > 0) ||
		(adr.informed && adr.informed.length > 0);
	const hasTc = !!adr.tc;
	const hasExistingTcKeys = adr.yaml && adr.yaml.includes("tc-");

	if (!hasMetadata && !hasTc && !hasExistingTcKeys) return;

	const raw = adr.yaml ? stripYamlFences(adr.yaml) : "";
	let parsed;
	try {
		parsed = yamlLoad(raw) ?? {};
	} catch (e) {
		parsed = {};
	}
	if (typeof parsed !== "object") parsed = {};

	// Write MADR 4.0 structured metadata fields so they always appear in the
	// YAML frontmatter even when adr.yaml is already set (TC-only block).
	if (adr.status) {
		parsed["status"] = adr.status;
	} else {
		delete parsed["status"];
	}
	if (adr.date) {
		parsed["date"] = adr.date;
	} else {
		delete parsed["date"];
	}
	if (adr.decisionMakers && adr.decisionMakers.length > 0) {
		parsed["decision-makers"] = adr.decisionMakers;
	} else {
		delete parsed["decision-makers"];
	}
	if (adr.consulted && adr.consulted.length > 0) {
		parsed["consulted"] = adr.consulted;
	} else {
		delete parsed["consulted"];
	}
	if (adr.informed && adr.informed.length > 0) {
		parsed["informed"] = adr.informed;
	} else {
		delete parsed["informed"];
	}

	// TC annotation fields.
	if (adr.tc) {
		parsed["tc-schema-version"] = 1;
		parsed["tc-benefit"] = adr.tc.benefit;
		parsed["tc-category"] = adr.tc.category;
		parsed["tc-conditions"] = adr.tc.conditions;
		parsed["tc-signals"] = adr.tc.signals.tags;
		if (adr.tc.signals.note) {
			parsed["tc-signals-note"] = adr.tc.signals.note;
		} else {
			delete parsed["tc-signals-note"];
		}
		parsed["tc-confidence"] = adr.tc.confidence;
		writeProOnly(parsed, "tc-status",  mode, adr.tc.status !== undefined ? adr.tc.status : undefined);
		writeProOnly(parsed, "tc-related", mode, adr.tc.related?.length ? adr.tc.related : undefined);
	} else {
		Object.keys(parsed).filter((k) => k.startsWith("tc-")).forEach((k) => delete parsed[k]);
	}

	let yamlOutput = yamlDump(parsed, { sortKeys: false, flowLevel: 1 });
	// Remove unnecessary quotes from date-like strings (js-yaml quotes them
	// for safety but MADR files use bare date values e.g. date: 2020-12-03)
	yamlOutput = yamlOutput.replace(/^([\w-]+): ['"](\d{4}-\d{2}-\d{2})['"]/gm, '$1: $2');
	adr.yaml = "---\n" + yamlOutput.trimEnd() + "\n---\n";
}

/**
 * Extracts Good/Bad consequence bullets from the raw markdown string.
 * The ANTLR adaptive prediction skips textLine in the consequences list context,
 * so this regex pass is needed to reliably populate consequences after the walk.
 * @param {string} md
 * @param {ArchitecturalDecisionRecord} adr
 */
function parseConsequencesFromMd(md, adr) {
	const match = md.match(/###\s+Consequences\s*\n([\s\S]*?)(?=\n##|\n###|$)/i);
	if (!match) return;
	const bullets = match[1].split(/\n/).map((l) => l.replace(/^[*\-]\s+/, "").trim()).filter(Boolean);
	bullets.forEach((text) => {
		if (text.startsWith("Good, because ")) {
			adr.decisionOutcome.consequences.good.push(text.substring("Good, because ".length));
		} else if (text.startsWith("Bad, because ")) {
			adr.decisionOutcome.consequences.bad.push(text.substring("Bad, because ".length));
		}
	});
}

/**
 * Extracts confirmation text via regex, bypassing ANTLR.
 * ANTLR tokenizes 'Good, because ', 'Neutral, because ', 'Bad, because ' as special
 * tokens that multilineText cannot consume, causing parse failures when they appear
 * in the Confirmation section. Regex extraction avoids this entirely.
 * @param {string} md
 * @param {ArchitecturalDecisionRecord} adr
 */
function parseConfirmationFromMd(md, adr) {
	const match = md.match(/###\s+Confirmation\s*\n([\s\S]*?)(?=\n##|\n###|$)/i);
	if (!match) return;
	const content = match[1].trim();
	if (content) {
		adr.decisionOutcome.confirmation = content;
	}
}

/**
 * Extracts moreInformation and links from the ## More Information section.
 * Links were appended as bullet items during serialization — this restores them
 * as separate items in adr.links so the Links UI is populated on reload.
 * @param {string} md
 * @param {ArchitecturalDecisionRecord} adr
 */
function parseMoreInformationFromMd(md, adr) {
	const match = md.match(/##\s+More Information\s*\n([\s\S]*?)(?=\n##|$)/i);
	if (!match) return;
	const body = match[1];
	const lines = body.split(/\n/);
	const textLines = [];
	const linkLines = [];
	let inLinks = false;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) {
			// blank line — keep tracking context
			if (!inLinks) textLines.push(line);
			continue;
		}
		if (/^[*\-]\s+/.test(trimmed)) {
			// bullet item — treat as a link
			inLinks = true;
			linkLines.push(trimmed.replace(/^[*\-]\s+/, "").trim());
		} else {
			textLines.push(line);
		}
	}

	const moreInfoText = textLines.join("\n").trim();
	if (moreInfoText) {
		adr.moreInformation = moreInfoText;
	}
	if (linkLines.length > 0) {
		adr.links = linkLines;
	}
}

/**
 * Converts a markdown into a MADR object.
 * @param {string} md
 * @returns {ArchitecturalDecisionRecord}
 */
export function md2adr(md) {
	// Keep original for regex-based extraction passes that run after the ANTLR walk.
	const originalMd = md;

	// Strip ### Consequences, ### Confirmation, and ## More Information content
	// before handing to ANTLR. All three sections are extracted via regex on
	// originalMd after the walk, so ANTLR never needs to parse their content.
	// This prevents 'Good, because ' / 'Neutral, because ' / 'Bad, because '
	// from being tokenized as special argumentList literals in these sections,
	// which would cause "mismatched input" parse failures.
	md = md.replace(/\n###\s+Consequences\s*\n[\s\S]*?(?=\n###|\n##|$)/gi, '');
	md = md.replace(/\n###\s+Confirmation\s*\n[\s\S]*?(?=\n###|\n##|$)/gi, '');
	md = md.replace(/\n##\s+More Information\s*\n[\s\S]*?(?=\n##|$)/gi, '');

	const chars = new antlr4.InputStream(md);
	const lexer = new MADRLexer(chars);
	const tokens = new antlr4.CommonTokenStream(lexer);
	const parser = new MADRParser(tokens);
	const errorListener = new MADRErrorListener();
	parser.buildParseTrees = true;
	parser.removeErrorListeners();
	parser.addErrorListener(errorListener);
	const tree = parser.start(); // 'start' is the name of the starting rule.
	// console.log('Created Parse Tree! ', tree)
	const printer = new MADRGenerator();
	antlr4.tree.ParseTreeWalker.DEFAULT.walk(printer, tree);
	//console.log("Result ADR ", printer.adr);
	printer.adr.cleanUp();
	if (errorListener.syntaxErrors.length > 0) {
		printer.adr.conforming = false;
	}
	printer.adr.parseErrors = errorListener.syntaxErrors;
	parseTcFromYaml(printer.adr);
	parseConsequencesFromMd(originalMd, printer.adr);
	parseConfirmationFromMd(originalMd, printer.adr);
	parseMoreInformationFromMd(originalMd, printer.adr);
	return printer.adr;
}

export function adr2md(adrToParse, mode = 'professional') {
	let adr = cloneDeep(adrToParse);
	adr.cleanUp();
	serializeTcToYaml(adr, mode);
	var md;

	// YAML frontmatter — serializeTcToYaml writes ALL fields (metadata + TC)
	// into adr.yaml. If it produced a block, use it. Otherwise no frontmatter.
	if (adr.yaml) {
		md = adr.yaml + "\n# " + naturalCase2titleCase(adr.title) + "\n";
	} else {
		md = "# " + naturalCase2titleCase(adr.title) + "\n";
	}

	if (adr.contextAndProblemStatement !== "") {
		md = md.concat("\n## Context and Problem Statement\n\n" + adr.contextAndProblemStatement + "\n");
	}

	if (adr.decisionDrivers.length > 0) {
		md = md.concat("\n## Decision Drivers\n\n");
		for (let i in adr.decisionDrivers) {
			md = md.concat("* " + adr.decisionDrivers[i] + "\n");
		}
	}

	if (adr.consideredOptions.length > 0) {
		md = md.concat("\n## Considered Options\n\n");
		md = adr.consideredOptions.reduce((total, opt) => total + "* " + opt.title + "\n", md);
	}

	md = md.concat(
		'\n## Decision Outcome\n\nChosen option: "' +
			createShortTitle(adr.decisionOutcome.chosenOption.replaceAll('"', "'"))
	);

	if (adr.decisionOutcome.explanation.trim() !== "") {
		let isList = adr.decisionOutcome.explanation.trim().match(/^[*-+]/);
		if (isList) {
			md = md.concat('", because\n\n' + adr.decisionOutcome.explanation + "\n");
		} else {
			md = md.concat('", because ' + adr.decisionOutcome.explanation + "\n");
		}
	} else {
		md = md.concat('"\n');
	}

	// MADR 4.0: unified Consequences section (Good then Bad bullets in one list)
	if (adr.decisionOutcome.consequences.good.length > 0 || adr.decisionOutcome.consequences.bad.length > 0) {
		md = md.concat("\n### Consequences\n\n");
		md = adr.decisionOutcome.consequences.good.reduce(
			(total, c) => total + "* Good, because " + c + "\n",
			md
		);
		md = adr.decisionOutcome.consequences.bad.reduce(
			(total, c) => total + "* Bad, because " + c + "\n",
			md
		);
	}

	// MADR 4.0: Confirmation — H3 under Decision Outcome
	if (adr.decisionOutcome.confirmation !== "") {
		md = md.concat("\n### Confirmation\n\n" + adr.decisionOutcome.confirmation + "\n");
	}

	if (
		adr.consideredOptions.some(
			(opt) => opt.description !== "" || opt.pros.length > 0 || opt.neutral.length > 0 || opt.cons.length > 0
		)
	) {
		md = md.concat("\n## Pros and Cons of the Options\n");
		md = adr.consideredOptions.reduce((total, opt) => {
			if (opt.description !== "" || opt.pros.length > 0 || opt.neutral.length > 0 || opt.cons.length > 0) {
				let res = total.concat("\n### " + createShortTitle(opt.title) + "\n");
				if (opt.description !== "") {
					res = res.concat("\n" + opt.description + "\n");
				}
				res = opt.pros.reduce((t, arg) => t.concat("\n* Good, because " + arg), res);
				res = opt.neutral.reduce((t, arg) => t.concat("\n* Neutral, because " + arg), res);
				res = opt.cons.reduce((t, arg) => t.concat("\n* Bad, because " + arg), res);
				if (opt.pros.length > 0 || opt.neutral.length > 0 || opt.cons.length > 0) {
					// insert final new line
					res = res + "\n";
				}
				return res;
			} else {
				return total;
			}
		}, md);
	}

	// MADR 4.0: More Information — top-level H2 at the end (replaces 2.x Links section).
	// Links are appended as bullet items within this section so nothing is lost.
	const hasMoreInfo = adr.moreInformation !== "";
	const hasLinks = adr.links && adr.links.length > 0;
	if (hasMoreInfo || hasLinks) {
		md = md.concat("\n## More Information\n\n");
		if (hasMoreInfo) {
			md = md.concat(adr.moreInformation + "\n");
		}
		if (hasLinks) {
			if (hasMoreInfo) md = md.concat("\n");
			md = adr.links.reduce((total, link) => total + "* " + link + "\n", md);
		}
	}

	return md;
}

/**
 * Converts an string in snake case into an natural-language-like string.
 *
 * Example: '0001-add-status-field' is converted to '0001 Add Status Field'
 *
 * @param {string} snake
 */
export function snakeCase2naturalCase(snake) {
	return snake.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace("-", " ").replace("_", " "));
}

/**
 * Converts an string in natural case into an snake case string.
 *
 * Can be used to generate a file name from the title of an ADR.
 *
 * Example: 'Add status Field' is converted to 'add-status-field'
 *
 * @param {string} snake
 */
export function naturalCase2snakeCase(natural) {
	return natural.toLowerCase().split(" ").join("-");
}

/**
 * Option titles are similar, iff
 *  a) they are equal after
 *    (1) removing all white spaces
 *    (2) lower-casing them
 * or
 *   b) one of these normalized titles is a prefix of the other title.
 * or
 *   c) the chosen option is a sub title of the given option
 *
 * @param {string} titleFromOptionList
 * @param {string} titleFromChosenOption
 * @returns {boolean} True, iff the option titles are similar
 */
export function matchOptionTitleMoreRelaxed(titleFromOptionList, titleFromChosenOption) {
	let trimmedTitleFromOptionList = titleFromOptionList.replace(/ /g, "").toLowerCase(); // Remove whitespaces and lower-case heading
	let trimmedTitleFromChosenOption = titleFromChosenOption.replace(/ /g, "").toLowerCase();
	let res =
		trimmedTitleFromOptionList === trimmedTitleFromChosenOption ||
		trimmedTitleFromOptionList.startsWith(trimmedTitleFromChosenOption) ||
		trimmedTitleFromChosenOption.startsWith(trimmedTitleFromOptionList) ||
		titleFromChosenOption === createShortTitle(titleFromOptionList) ||
		// in case we have issues with the short title generation, we at least check for a match of the first letters
		// Example: "Include in [adr-tools](https://github.com/npryce/adr-tools), 924 stars as of 2018-06-14", we currently don't strip ", ..."
		createShortTitle(titleFromOptionList).startsWith(titleFromChosenOption);
	return res;
}
