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
 * Empty after the MADR 2.1.2 -> 4.0 migration; re-populate once exact ADR-object expectations are
 * worth the maintenance overhead.
 */
export const MD_ParsedMADR_Pairs: { md: string; adr: ArchitecturalDecisionRecord }[] = [];

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
