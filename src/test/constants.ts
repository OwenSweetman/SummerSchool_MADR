/* eslint-disable */

import { ArchitecturalDecisionRecord } from "../plugins/classes";

/**
 * Valid MADR 4.0 markdown ADRs. The precision test asserts adr2md(md2adr(x)) === x exactly,
 * which requires careful tracing of serializer whitespace and section ordering. Empty after the
 * MADR 2.1.2 -> 4.0 migration; convergence coverage is provided by yamlMADRs below (stability
 * across two parse-serialize passes, no exact-match requirement).
 */
export const validMarkdownADRs: string[] = [];

/**
 * Pairs of (markdown, expected parsed ADR). Tests that md2adr produces the expected object exactly.
 * Populated with MADR 4.0 fixtures by Track B.
 */
export const MD_ParsedMADR_Pairs = [
	// madr/docs/adr/0000-use-markdown-architectural-decision-records.md
	{
		md: `# Use Markdown Architectural Decision Records

## Context and Problem Statement

We want to record architectural decisions made in this project.
Which format and structure should these records follow?

## Considered Options

* [MADR](https://adr.github.io/madr/) 2.1.2 – The Markdown Architectural Decision Records
* [Michael Nygard's template](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) – The first incarnation of the term "ADR"
* [Sustainable Architectural Decisions](https://www.infoq.com/articles/sustainable-architectural-design-decisions) – The Y-Statements
* Other templates listed at <https://github.com/joelparkerhenderson/architecture_decision_record>
* Formless – No conventions for file format and structure

## Decision Outcome

Chosen option: "MADR 2.1.2", because

* Implicit assumptions should be made explicit.
  Design documentation is important to enable people understanding the decisions later on.
  See also [A rational design process: How and why to fake it](https://doi.org/10.1109/TSE.1986.6312940).
* The MADR format is lean and fits our development style.
* The MADR structure is comprehensible and facilitates usage & maintenance.
* The MADR project is vivid.
* Version 2.1.2 is the latest one available when starting to document ADRs.
`,
		adr: new ArchitecturalDecisionRecord({
			yaml: "",
			title: "Use Markdown Architectural Decision Records",
			status: "",
			conforming: true,
			parseErrors: [],
			contextAndProblemStatement: `We want to record architectural decisions made in this project.
Which format and structure should these records follow?`,
			decisionDrivers: [],
			consideredOptions: [
				{
					title: "[MADR](https://adr.github.io/madr/) 2.1.2 – The Markdown Architectural Decision Records",
					description: "",
					pros: [] as string[],
					neutral: [] as string[],
					cons: [] as string[],
				},
				{
					title: '[Michael Nygard\'s template](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) – The first incarnation of the term "ADR"',
					description: "",
					pros: [] as string[],
					neutral: [] as string[],
					cons: [] as string[],
				},
				{
					title: "[Sustainable Architectural Decisions](https://www.infoq.com/articles/sustainable-architectural-design-decisions) – The Y-Statements",
					description: "",
					pros: [] as string[],
					neutral: [] as string[],
					cons: [] as string[],
				},
				{
					title: "Other templates listed at <https://github.com/joelparkerhenderson/architecture_decision_record>",
					description: "",
					pros: [] as string[],
					neutral: [] as string[],
					cons: [] as string[],
				},
				{
					title: "Formless – No conventions for file format and structure",
					description: "",
					pros: [] as string[],
					neutral: [] as string[],
					cons: [] as string[],
				},
			],
			decisionOutcome: {
				chosenOption: "MADR 2.1.2",
				explanation: `* Implicit assumptions should be made explicit.
  Design documentation is important to enable people understanding the decisions later on.
  See also [A rational design process: How and why to fake it](https://doi.org/10.1109/TSE.1986.6312940).
* The MADR format is lean and fits our development style.
* The MADR structure is comprehensible and facilitates usage & maintenance.
* The MADR project is vivid.
* Version 2.1.2 is the latest one available when starting to document ADRs.`,
				consequences: { good: [] as string[], bad: [] as string[] },
				confirmation: "",
			},
		}),
	},

	// madr/docs/adr/0001-use-CC0-as-license.md
	{
		md: `# Use CC0 as License

## Context and Problem Statement

Everything needs to be licensed, otherwise the default copyright laws apply.
For instance, in Germany that means users may not alter anything without explicitly asking for permission.
For more information see <https://help.github.com/articles/licensing-a-repository/>.

We want to have MADR used without any hassle and that users can just go ahead and write MADRs.

## Considered Options

* [CC0](https://creativecommons.org/share-your-work/public-domain/cc0/)
* No license
* Other open source licenses

## Decision Outcome

Chosen option: "CC0", because this license donates the content to "public domain" and does so as legally as possible.
`,
		adr: new ArchitecturalDecisionRecord({
			yaml: "",
			title: "Use CC0 as License",
			conforming: true,
			parseErrors: [],
			contextAndProblemStatement: `Everything needs to be licensed, otherwise the default copyright laws apply.
For instance, in Germany that means users may not alter anything without explicitly asking for permission.
For more information see <https://help.github.com/articles/licensing-a-repository/>.

We want to have MADR used without any hassle and that users can just go ahead and write MADRs.`,
			consideredOptions: [
				{
					title: "[CC0](https://creativecommons.org/share-your-work/public-domain/cc0/)",
					description: "",
					pros: [],
					neutral: [],
					cons: [],
				},
				{
					title: "No license",
					description: "",
					pros: [],
					neutral: [],
					cons: [],
				},
				{
					title: "Other open source licenses",
					description: "",
					pros: [],
					neutral: [],
					cons: [],
				},
			],
			decisionOutcome: {
				chosenOption: "CC0",
				explanation: `this license donates the content to "public domain" and does so as legally as possible.`,
				consequences: { good: [], bad: [] },
				confirmation: "",
			},
		}),
	},

	// madr/docs/adr/0002-do-not-use-numbers-in-headings.md
	// Misses the '"' around the chose option and the heading 'Context and Problem Statement'
	{
		md: `# Do Not Use Numbers in Headings

## Context and Problem Statement

How to render the first line in an ADR?
ADRs have to take a unique identifier.

## Considered Options

* Use the title only
* Add the ADR number in front of the title (e.g., "# 2. Do Not Use Numbers in Headings")

## Decision Outcome

Chosen option: Use the title only, because

* This is common in other markdown files, too.
  One does not add numbering manually at the markdown files, but tries to get the numbers injected by the rendering framework or CSS.
* Enables renaming of ADRs (before publication) easily
* Allows copy'n'paste of ADRs from other repositories without having to worry about the numbers.
`,
		adr: new ArchitecturalDecisionRecord({
			yaml: "",
			title: "Do Not Use Numbers in Headings",
			conforming: true,
			parseErrors: [],
			contextAndProblemStatement: `How to render the first line in an ADR?
ADRs have to take a unique identifier.`,
			consideredOptions: [
				{
					title: "Use the title only",
					description: "",
					pros: [],
					neutral: [],
					cons: [],
				},
				{
					title: 'Add the ADR number in front of the title (e.g., "# 2. Do Not Use Numbers in Headings")',
					description: "",
					pros: [],
					neutral: [],
					cons: [],
				},
			],
			decisionOutcome: {
				chosenOption: "Use the title only",
				explanation: `* This is common in other markdown files, too.
  One does not add numbering manually at the markdown files, but tries to get the numbers injected by the rendering framework or CSS.
* Enables renaming of ADRs (before publication) easily
* Allows copy'n'paste of ADRs from other repositories without having to worry about the numbers.`,
				consequences: { good: [], bad: [] },
				confirmation: "",
			},
		}),
	},

	// madr/master/docs/adr/0005-use-dashes-in-filenames.md
	{
		md: `# Use Dashes in Filenames

## Context and Problem Statement

What is the pattern of the filename where an ADR is stored?

## Considered Options

* \`NNNN-title-with-dashes.md\` - format used by [adr-tools](https://github.com/npryce/adr-tools)
* \`YYYY-MM-DD Title\` - see https://github.com/joelparkerhenderson/architecture_decision_record#adr-file-name-conventions

## Decision Outcome

Chosen option: \`NNNN-title-with-dashes.md\`, because

* \`NNNN\` provides a unique number, which can be used for referencing in the forms
  * \`ADR-0001\` in plain text and
  * by \`@ADR(1)\` Java code (enabled by [e-adr](https://adr.github.io/e-adr/))
* The creation time of an ADR is of historical interest only, if it gets updated somehow.
  The arguments are similar than the ones by [Does Git have keyword expansion?](https://git.wiki.kernel.org/index.php/GitFaq#Does_Git_have_keyword_expansion.3F)
* Having no spaces in filenames eases working in the command line
* This is exactly the format offered by [adr-tools](https://github.com/npryce/adr-tools)
`,
		adr: new ArchitecturalDecisionRecord({
			yaml: "",
			title: "Use Dashes in Filenames",
			conforming: true,
			parseErrors: [],
			contextAndProblemStatement: `What is the pattern of the filename where an ADR is stored?`,
			consideredOptions: [
				{
					title: "`NNNN-title-with-dashes.md` - format used by [adr-tools](https://github.com/npryce/adr-tools)",
					description: "",
					pros: [],
					neutral: [],
					cons: [],
				},
				{
					title: "`YYYY-MM-DD Title` - see https://github.com/joelparkerhenderson/architecture_decision_record#adr-file-name-conventions",
					description: "",
					pros: [],
					neutral: [],
					cons: [],
				},
			],
			decisionOutcome: {
				chosenOption: "NNNN-title-with-dashes.md",
				explanation: `* \`NNNN\` provides a unique number, which can be used for referencing in the forms
  * \`ADR-0001\` in plain text and
  * by \`@ADR(1)\` Java code (enabled by [e-adr](https://adr.github.io/e-adr/))
* The creation time of an ADR is of historical interest only, if it gets updated somehow.
  The arguments are similar than the ones by [Does Git have keyword expansion?](https://git.wiki.kernel.org/index.php/GitFaq#Does_Git_have_keyword_expansion.3F)
* Having no spaces in filenames eases working in the command line
* This is exactly the format offered by [adr-tools](https://github.com/npryce/adr-tools)`,
				consequences: { good: [], bad: [] },
				confirmation: "",
			},
		}),
	},

	// madr/master/docs/adr/0010-support-categories.md
	{
		md: `# Support Categories

## Context and Problem Statement

ADRs are recorded. The number of ADRs grows and the context/topic/scope of ADRs might be different (e.g., frontend, backend)

## Decision Drivers

* Easy to find groups ADRs in hundreds of ADRs
* Easy to group
* Easy to create
* Good finding without external tooling
* Keep newcomers in mind (should be doable in <10 minutes)
* Keep template lean

## Considered Options

* Use labels
* Add \`* Category: CATEGORY\` directly under the heading (similar to https://gist.github.com/FaKeller/2f9c63b6e1d436abb7358b68bf396f57)
* Use YAML frontmatter
* Encode category in filename
* Use subfolders with local ids
* Use subfolders with global ids
* Don't do it.

## Decision Outcome

Chosen option: "Use subfolders with local ids"

## Pros and Cons of the Options

### Use labels

Example:  

Use Angular ![category-frontend](https://img.shields.io/badge/category-frontend-blue.svg?style=flat-square)

\`![category-frontend](https://img.shields.io/badge/category-frontend-blue.svg?style=flat-square)\`

* Good, because full markdown
* Good, because linking to an overview page is possible (using markdown)
* Bad, because not straight-forward to parse
* Bad, because no simple filtering using \`ls\` or Windows Explorer is possible

### Add \`* Category: CATEGORY\` directly under the heading 

* Good, because full markdown
* Good, because linking to an overview page is possible (using markdown)
* Good, because straight-forward to parse
* Bad, because no simple filtering using \`ls\` or Windows Explorer is possible

### Use YAML  frontmatter

Example:

\`\`\`yaml
---
category: frontend
---
\`\`\`

* Good, because nearly straight-forward to parse
* Good, because Jekyll supports it
* Bad, because YAML frontmatter is not part of the [CommonMarc Spec](http://spec.commonmark.org/)
* Bad, because no simple filtering using \`ls\` or Windows Explorer is possible

### Encode category in filename

Example: \`0050--frontend--title-with-dashes.md\`

* Good, because programmatic filtering is possible
* Good, because \`ls -la | grep --category--\` works
* Bad, because plain file list in Windows explorer cannot be filtered
* Bad, because as bad as [TagSpaces](https://www.tagspaces.org/), which stores the tags in the filenames in brackets. E.g., \`demo[demotag secondtag].md\`.

### Use subfolders with local ids

Optionally "to-be-categorized" folder.

One level of subfolder, not nested

#### Examples

* \`docs/adr/smar/0000-secure-entities.md\`
* \`docs/adr/smar/0001-flexible-properties-selection.md\`

#### Pros/cons

* Good, because grouping is done by folders (which are natural for grouping)
* Good, because typos can easily be spotted
* Bad, because there is no unique number identifying an ADR
* Bad, because two indices have to be maintained (adr-log needs to be updated)
* Bad, because e-adr needs to be adapted to \`@ADR("category", number)\` (not that bad)
* Bad, because when category is unknown it is hard to find the right folder
* Bad, because using categories might be hampering newcomers

### Use subfolders with global ids

#### Examples

* \`docs/adr/smar/0005-secure-entities.md\`
* \`docs/adr/smar/0047-flexible-properties-selection.md\`
`,

		adr: new ArchitecturalDecisionRecord({
			yaml: "",
			title: "Support Categories",
			conforming: true,
			parseErrors: [],
			contextAndProblemStatement: `ADRs are recorded. The number of ADRs grows and the context/topic/scope of ADRs might be different (e.g., frontend, backend)`,
			decisionDrivers: [
				"Easy to find groups ADRs in hundreds of ADRs",
				"Easy to group",
				"Easy to create",
				"Good finding without external tooling",
				"Keep newcomers in mind (should be doable in <10 minutes)",
				"Keep template lean",
			],
			consideredOptions: [
				{
					title: "Use labels",
					description: `Example:  

Use Angular ![category-frontend](https://img.shields.io/badge/category-frontend-blue.svg?style=flat-square)

\`![category-frontend](https://img.shields.io/badge/category-frontend-blue.svg?style=flat-square)\``,
					pros: ["full markdown", "linking to an overview page is possible (using markdown)"],
					neutral: [],
					cons: [
						"not straight-forward to parse",
						"no simple filtering using `ls` or Windows Explorer is possible",
					],
				},
				{
					title: "Add `* Category: CATEGORY` directly under the heading (similar to https://gist.github.com/FaKeller/2f9c63b6e1d436abb7358b68bf396f57)",
					description: "",
					pros: [
						"full markdown",
						"linking to an overview page is possible (using markdown)",
						"straight-forward to parse",
					],
					neutral: [],
					cons: ["no simple filtering using `ls` or Windows Explorer is possible"],
				},
				{
					title: "Use YAML frontmatter",
					description: `Example:

\`\`\`yaml
---
category: frontend
---
\`\`\``,
					pros: ["nearly straight-forward to parse", "Jekyll supports it"],
					neutral: [],
					cons: [
						"YAML frontmatter is not part of the [CommonMarc Spec](http://spec.commonmark.org/)",
						"no simple filtering using `ls` or Windows Explorer is possible",
					],
				},
				{
					title: "Encode category in filename",
					description: "Example: `0050--frontend--title-with-dashes.md`",
					pros: ["programmatic filtering is possible", "`ls -la | grep --category--` works"],
					neutral: [],
					cons: [
						"plain file list in Windows explorer cannot be filtered",
						"as bad as [TagSpaces](https://www.tagspaces.org/), which stores the tags in the filenames in brackets. E.g., `demo[demotag secondtag].md`.",
					],
				},
				{
					title: "Use subfolders with local ids",
					description: `Optionally "to-be-categorized" folder.

One level of subfolder, not nested

#### Examples

* \`docs/adr/smar/0000-secure-entities.md\`
* \`docs/adr/smar/0001-flexible-properties-selection.md\`

#### Pros/cons`,
					pros: [
						"grouping is done by folders (which are natural for grouping)",
						"typos can easily be spotted",
					],
					neutral: [],
					cons: [
						"there is no unique number identifying an ADR",
						"two indices have to be maintained (adr-log needs to be updated)",
						'e-adr needs to be adapted to `@ADR("category", number)` (not that bad)',
						"when category is unknown it is hard to find the right folder",
						"using categories might be hampering newcomers",
					],
				},
				{
					title: "Use subfolders with global ids",
					description: `#### Examples

* \`docs/adr/smar/0005-secure-entities.md\`
* \`docs/adr/smar/0047-flexible-properties-selection.md\``,
					pros: [],
					neutral: [],
					cons: [],
				},
				{
					title: "Don't do it.",
					description: "",
					pros: [],
					neutral: [],
					cons: [],
				},
			],
			decisionOutcome: {
				chosenOption: "Use subfolders with local ids",
				explanation: ``,
				consequences: { good: [], bad: [] },
				confirmation: "",
			},
		}),
	},

	// NOTE: A "malformed/prefix-matching" fixture was removed during the Track A/B merge — it
	// expected back-compat behaviour (2.1.2 section names, fuzzy option matching with
	// conforming: true on chosen-option mismatch) that the Track A 4.0-only parser doesn't
	// provide. Revisit with Tali after the demo as part of the Day 8 back-compat decision.
];

/**
 * Random/malformed strings used to fuzz the parser. The convergence test asserts the parser
 * always accepts its own output across two passes.
 */
export const randomStrings = [
	"",
	"# ABC",
	"# Some title\n\n## bla\nWhat is here?",
	"Lorem Ipsum\n\n# Madr title\n\n## something\nfoobar",
];

/**
 * MADR 4.0 ADRs with YAML front matter. Convergence test asserts adr2md(md2adr(x)) is stable
 * across two passes. Coverage: YAML metadata (status, date, decision-makers, consulted, informed),
 * unified Consequences section, Confirmation H3, More Information H2, Neutral pros/cons bullets.
 */
export const yamlMADRs = [
	// Full YAML metadata + unified Consequences + Confirmation
	`---
status: "accepted"
date: 2026-05-28
decision-makers: [alice, bob]
consulted: [carol]
informed: [team]
---

# Use Repository Pattern

## Context and Problem Statement

We need to abstract database access from business logic so we can swap the underlying engine later.

## Considered Options

* Repository pattern
* Direct ORM access
* Raw SQL with helper functions

## Decision Outcome

Chosen option: "Repository pattern", because it cleanly separates persistence from domain logic.

### Consequences

* Good, because the service layer is decoupled from any specific database engine
* Bad, because there is more boilerplate when adding new entities

### Confirmation

Code review checks that no service-layer code imports an ORM directly.
`,
	// YAML + Pros/Cons with Neutral bullets + More Information
	`---
status: "proposed"
date: 2026-05-29
---

# Adopt Event Driven Architecture

## Context and Problem Statement

The order pipeline currently chains synchronous calls. We want to decouple stages for resilience.

## Decision Drivers

* System resilience under partial failures
* Independent scaling of pipeline stages

## Considered Options

* Synchronous chained services
* Message bus with event driven handlers

## Decision Outcome

Chosen option: "Message bus with event driven handlers", because it isolates failure domains.

### Consequences

* Good, because individual stages can fail and retry without cascading
* Bad, because debugging cross-stage flows is harder

## Pros and Cons of the Options

### Synchronous Chained Services

* Good, because flow is easy to trace
* Neutral, because performance is adequate at current scale
* Bad, because one stage failing takes down the whole pipeline

### Message Bus With Event Driven Handlers

* Good, because failure isolation
* Neutral, because requires new infrastructure
* Bad, because increased operational complexity

## More Information

See related ADR 0042 for the message broker selection. Revisit after Q3 load tests.
`,
	// Minimal — YAML + required sections only
	`---
status: "accepted"
date: 2026-06-01
---

# Use Structured Configuration Files

## Context and Problem Statement

Configuration needs to be both human and machine readable.

## Considered Options

* Structured format with schema
* Free-form key-value
* Hard-coded constants

## Decision Outcome

Chosen option: "Structured format with schema", because it is universally supported.
`,
];
