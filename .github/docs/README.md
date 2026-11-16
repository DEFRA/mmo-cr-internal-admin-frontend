# Standardised Copilot agent workflow

## Overview

AI adoption has become an increasingly important part of modern software delivery, especially for coding
and engineering workflows using GitHub Copilot. To improve the experience of developers, QA engineers and
DevOps engineers, a standardised agent setup is applied across repositories to provide accurate context,
clear responsibilities and consistent guidance.

This document describes the standardised Copilot agent workflow applied across service repositories. It
covers the `.github` directory structure, the working framework, each agent's role and boundaries, each
skill's purpose, and how the components fit together in practice.

Each repository uses the same four-agent orchestrated workflow, driven by a single working framework
defined in `copilot-instructions.md`. The design separates responsibilities cleanly:

- **Orchestrator** — coordinates the workflow and never modifies code.
- **Planner** — plans and researches but never modifies code (used for **Complex** work only).
- **Developer** — implements changes, and writes and runs code after a plan is approved.
- **Reviewer** — performs read-only reviews and reports findings by severity (**optional, on-request**).

Alongside these four agents, a small set of skills provides specialist guidance that agents load at the
appropriate point in the workflow.

> **Recent changes reflected in this document:** a three-tier triage (Trivial / Standard / Complex), a
> **single** risk-scoped research pass (no separate plan-validation round), **opt-in** code review, a
> **manual triage override**, Figma design-fidelity with a GOV.UK Design System (GDS) deviation register,
> a **screenshot/PNG fallback** for reading a design when the Figma API is unavailable, **vertical rhythm /
> spacing** as a first-class Design-Spec requirement, and mandatory in-browser visual verification for UI
> changes.

## `.github` directory structure

```text
.github/
├── copilot-instructions.md          # Primary context file, loaded automatically for every chat
├── agents/
│   ├── <prefix>-orchestrator.agent.md
│   ├── <prefix>-planner.agent.md
│   ├── <prefix>-developer.agent.md
│   └── <prefix>-reviewer.agent.md
├── instructions/
│   └── *.instructions.md            # Auto-applied rules scoped by file glob using applyTo
├── prompts/
│   └── *.prompt.md                  # Reusable, user-invocable prompt templates
└── skills/
    ├── deep-research-defra-alignment/
    │   └── SKILL.md
    └── */
        └── SKILL.md
```

Some repositories may include additional skills or agents specific to that service. These can remain
alongside the standardised workflow where required.

## `copilot-instructions.md`

The primary context file is loaded automatically whenever a chat or agent session starts in the workspace
folder. It contains the following sections.

| Section | Purpose |
| --- | --- |
| Project overview and architecture | Repository-specific context such as the technology stack, key directories, commands and integrations. |
| Standards precedence | Resolves conflicts using the defined standards hierarchy. Any DEFRA deviation requires a governance exception. |
| Working framework | The single source of truth for the working loop. |
| Workflow agents | Links the four agents and identifies the skill used for the research stage. |
| Skills, Prompts | Points developers to user-invocable pieces of work. |
| DEFRA standards and governance | Defines quality gates, security and PII rules, dependency policy, logging conventions and licence requirements. |

The framework and governance sections are referenced most often by agents. The remaining sections provide
repository-specific context that agents use to understand the codebase before acting.

## Working framework

The framework is the single source of truth for how work is carried out. Agents must reference it rather
than restating or creating alternative versions of the workflow. The guiding principle is **match effort to
risk**: do the least work that still delivers the change safely and to standard.

### Triage first — three gears

Every request is classified into one of three gears.

| Gear | What it is | How to proceed |
| --- | --- | --- |
| **Trivial** | A typo, copy/comment/doc tweak, or a small localised change with no impact on architecture, routing, sessions/caching, auth, security or accessibility. | Fast path: **Read → Implement → Test → Summarise**. Skip the Planner, research and review. No approval gate. |
| **Standard** | A normal feature, page, route or fix with **no** new architecture, auth, session/cache strategy or security surface. | **Lightweight inline plan** (Objective · Plan · Files · Validation · Risks) — no heavyweight Planner. Get approval, implement and test. A single research pass runs only if something is genuinely uncertain. Review is not run by default. |
| **Complex** | New architecture, routing/session/cache strategy, external integration, auth, a security surface, or multi-item delivery (e.g. a JIRA epic). | Full loop with the **Planner** and its full plan → approval → implement → test. Review still opt-in. |

#### Examples — what triggers each gear

**Trivial**

- Fixing a typo in a Nunjucks page, comment, `README` or ADR.
- Changing a single copy string or label.
- Adding a missing test for behaviour that already exists and is understood.
- Bumping one constant or config default with no behavioural impact.
- A one-line CSS tweak with no layout/component change.

**Standard**

- Adding a new GOV.UK-pattern page/route from an approved Figma design or acceptance criteria (no new
  architecture).
- Adding a form field with validation to an existing page.
- Building a new Nunjucks component/partial, view-context builder or filter.
- A localised bug fix in a controller/helper where cause and fix are understood.
- Wiring an existing helper into a new view.

**Complex**

- Introducing or changing a session/cache strategy (e.g. Catbox/Redis), auth, or CSRF handling.
- A new external API/service integration or persistence layer.
- Anything touching a security surface, secrets handling, or PII.
- A new routing/architecture pattern, or work that spans many components that must change together.
- Delivering a JIRA epic and its child stories/spikes/bugs in sequence.

### Manual triage override — force a gear

Automatic triage is only the default. **You can force a gear** — an explicit instruction wins over the
automatic classification.

| To force… | Say something like… |
| --- | --- |
| **Trivial** fast path | "Treat this as trivial", "just make the change, no plan needed". |
| **Standard** inline plan | "Do a lightweight/standard plan", "skip the planner, just a short plan". |
| **Complex** full plan | "Force the full plan", "use the planner", "run a full plan and review". |
| **A review** | "Review this", or answer **Yes** to the end-of-work review offer. |

Rules the agents follow:

- **Escalation is always honoured** — you can ask for *more* rigour on anything.
- **De-escalation is honoured with a caveat** — if you ask for a *lighter* path than the risk warrants, the
  agent complies but first flags the risk in one line. It will **not** drop the approval gate, WCAG 2.2 AA
  or security for a change that genuinely touches architecture, auth, sessions/caching, data correctness or
  a security surface.
- The agent echoes back which gear it is running so you can correct it.

### The loop (Standard and Complex)

```text
1. Read       - Read the relevant files/config. Never assume; verify.
2. Research   - A SINGLE risk-scoped pass, only when something is genuinely
                uncertain, via the deep-research-defra-alignment skill.
                Cite sources. There is NO separate validation-research round.
3. Clarify    - Ask targeted questions when requirements are ambiguous.
4. Plan       - Complex : delegate to the Planner (full plan, sources cited).
                Standard: produce a lightweight inline plan directly.
                Check the risky steps are covered/cited; revise only on a gap.
5. Approval   - Present the plan and ask a single Yes/No question. Stop and
                wait. Cap the plan -> approve -> implement cycle at 3 attempts.
6. Implement  - Execute the approved plan one phase at a time; no scope creep.
                Create ADRs first when architecture is established/altered.
                For Figma pages, build AS DESIGNED and record GDS deviations.
7. Test       - Run build, tests and lint; confirm green before proceeding.
                For UI changes, VISUALLY VERIFY in the browser vs the design.
8. Iterate    - Refine until the user is satisfied.
9. Summarise  - Executive summary: what changed, why, how it was validated,
                any GDS deviations recorded, and follow-ups or risks.
```

**Code review is optional and on-request.** It is **not** part of the default loop. At the end of
implementation, if no review has been run, the agent offers one with a single Yes/No question and invokes
the Reviewer only on **Yes**.

## Agents

All four agents are scoped to a single service repository. The `name` field in frontmatter follows the
pattern `<Role> - <Service Name>` (for example, `Orchestrator - Frontend`). This is how VS Code identifies
agents in agent mode and how agents refer to one another.

### Orchestrator

| Property | Value |
| --- | --- |
| File | `<prefix>-orchestrator.agent.md` |
| Tools | Read, search, todo, agent. **No** edit or execute access. |
| When to invoke | Complex, multi-step work needing planning, coordination and a formal approval gate; or JIRA epic / multi-ticket delivery. |

**Responsibilities**

- Triages the request into Trivial / Standard / Complex (honouring any manual override) and echoes the
  chosen gear.
- Gathers enough workspace context (using the Explore subagent where useful) to write a clear brief.
- **Standard work:** briefs the Developer to produce a lightweight inline plan — the Planner is not used.
- **Complex work:** delegates planning and the single research pass to the Planner, then checks the plan
  covers the risky steps and cites sources.
- Presents the plan to the user and owns the mandatory Yes/No approval gate.
- Delegates the approved plan to the Developer one phase at a time.
- **Offers an optional review at the end** (single Yes/No); delegates to the Reviewer only on **Yes** and
  sends Blocking findings back to the Developer.
- Closes with an executive summary, including any GDS deviations recorded.

**Hard boundaries**

- Does not implement or edit files, or run build/test/deploy commands.
- Does not begin implementation before explicit user approval.
- Does not run a code review by default — only on request or a Yes to the end-of-work offer.
- Does not perform open research itself — it delegates the single research pass.

### Planner

| Property | Value |
| --- | --- |
| File | `<prefix>-planner.agent.md` |
| Tools | Read, search, web, agent. **No** edit or execute access. |
| When to invoke | Called by the Orchestrator for **Complex** work. Not normally invoked directly, and not used for Standard/Trivial work. |

**Responsibilities**

- Converts the brief into a clear objective and scope boundary.
- Performs the **single, risk-scoped** research pass via the `deep-research-defra-alignment` skill and cites
  sources. There is no separate plan-validation round.
- Produces an implementation plan (phase sequence, parallelisation, impacted files, validation strategy,
  required tests, risks, sources).
- Scales its output: a **short-form** plan for Standard work it is asked to plan, the **full** contract for
  Complex/architectural work.
- Returns the plan to the Orchestrator, not directly to the user.

**Hard boundaries**

- Does not implement code or edit files.
- Does not ask the user for approval — the Orchestrator owns the gate.

**Output contract — full (Complex work)**

Objective · Scope · Assumptions and Open Questions · Implementation Plan · File/Component Impact ·
Validation Plan · Risks and Mitigations · Research and Sources · Approval Checklist.

**Output contract — short-form (Standard work)**

Objective · Implementation Plan · File/Component Impact · Validation Plan · Risks, Assumptions and Sources.

Parallel steps are clearly labelled in the Implementation Plan.

### Developer

| Property | Value |
| --- | --- |
| File | `<prefix>-developer.agent.md` |
| Tools | Full implementation toolset: edit, execute, VS Code, browser, web, search, todo. |
| When to invoke | To implement a feature, fix or refactor — ideally from an already-approved plan; or directly for Trivial/Standard work. |

**Responsibilities**

- Owns the implementation, testing and iteration stages, and the single research pass when it plans
  Standard work itself.
- Triages when invoked directly (honouring any manual override):
  - **Trivial** — proceeds directly (Read → Implement → Test → Summarise).
  - **Standard** — authors a lightweight inline plan itself, gets approval, then implements.
  - **Complex** — delegates planning to the Planner and gets approval before coding.
- Implements an approved plan directly, one phase at a time, without replanning it.
- Runs build/test/lint after each phase and reports results; ships tests alongside code.
- **For UI changes: runs the app and visually verifies each page in the built-in browser against the Figma
  design / Design Spec** (or the screenshot target when the Figma API fallback was used), checking **vertical
  rhythm/spacing** and the spec's **visual acceptance criteria**, plus responsive and JavaScript-disabled
  states.
- Builds Figma pages **as designed**, recording every GDS deviation for the summary (accessibility and
  security still override the design).

**Hard boundaries**

- Does not author a heavyweight plan for Complex work — that is the Planner's job.
- Does not implement Standard/Complex work before user approval.
- Does not expand scope beyond the approved plan.

### Reviewer

| Property | Value |
| --- | --- |
| File | `<prefix>-reviewer.agent.md` |
| Tools | Read, search, web, todo, agent. **No** edit or execute access. |
| When to invoke | **Optional and on-request only** — when you ask for a review, or answer Yes to the end-of-work offer. Never a default step. |

**Responsibilities**

- Performs a systematic read-only review against DEFRA standards, security and PII rules, testing/coverage,
  accessibility and repository conventions.
- Reports findings at three severities:
  - **Blocking** — must fix before merge (security issues, exposed secrets, incorrect behaviour,
    failing/missing tests, accessibility AA failures, standards breaches).
  - **Recommended** — improves quality; discuss with the author.
  - **Nit** — minor or optional preference.
- On Figma pages, treats a **documented** GDS deviation that follows the design as acceptable, but flags
  undocumented deviations and any deviation that breaks WCAG 2.2 AA or security as **Blocking**.
- Checks **visual fidelity, including vertical rhythm/spacing**, against the Design Spec — a crowded or
  compressed layout that departs from the design is a finding (Blocking where the spec set spacing as an
  acceptance criterion).
- Ends with a count by severity and a clear ready-to-merge verdict; cites sources for version- or
  policy-sensitive assertions.

**Hard boundaries**

- Does not edit files or run build/test/deploy commands.
- Does not approve or merge on the author's behalf.
- Does not silently accept a DEFRA-standard deviation — flags it and recommends a governance exception.

## Skills

Skills are loadable knowledge files used by agents at the appropriate point in the workflow. They
complement `copilot-instructions.md` rather than duplicating it. New skills can be added for repeatable
pieces of Dev/QA work.

### deep-research-defra-alignment

| Property | Value |
| --- | --- |
| User-invocable | No. Used internally by the Planner (Complex) and Developer (Standard). |
| When used | The **single** research pass of the working framework. |

Turns an open question or flagged plan step into a sourced recommendation aligned with DEFRA/GDS standards.

**Procedure**

1. Frame the concrete decision and the affected constraint.
2. Research current authoritative sources (DEFRA/GDS standards, framework/library docs, OWASP where
   relevant).
3. Align findings with the standards precedence and flag any governance exception.
4. Return a structured brief: Question · Findings (with cited URLs) · Recommendation · DEFRA alignment
   result · Risks and alternatives · Sources.

This is the **only** research round — there is no separate validation pass; the plan is checked against
these same cited sources. The three-iteration cap on plan → approve → implement still applies.

Other, repository-specific skills sit alongside this one — for example design-to-code, accessibility-audit
and unit-test skills — and are loaded by the Developer when relevant.

## How the pieces fit together

```text
User in chat or agent mode
       │
       ▼
Orchestrator                         Coordinates; does not modify code
  │
  ├─ Triage → Trivial / Standard / Complex   (manual override wins)
  │
  ├─ Standard: Developer writes a lightweight inline plan
  ├─ Complex : Delegates planning ──► Planner
  │                                     └─ single research pass via
  │                                        deep-research-defra-alignment
  │
  ├─ Presents plan and waits for Yes/No   ◄── APPROVAL GATE (hard stop)
  │
  ├─ Delegates implementation ──────► Developer
  │                                     ├─ builds as designed; records GDS deviations
  │                                     ├─ ships tests with the code
  │                                     └─ visually verifies UI in the browser
  │
  └─ Offers optional review ────────► Reviewer   (only on Yes)
       │                              Read-only findings by severity
       │
       └─ Executive summary to user
```

For Trivial work the Orchestrator (or the Developer directly) uses the fast path with no Planner and no
approval gate. The Developer can be invoked directly with an already-approved plan. The Reviewer can be
invoked independently at any time.

## Standards precedence

When guidance conflicts, the following order applies:

1. DEFRA Software Development Standards.
2. DEFRA Digital Service Manual.
3. GOV.UK Service Standard and Service Manual (GDS).
4. GOV.UK Design System / GOV.UK Frontend.
5. Community best practice (OWASP, twelve-factor principles, ecosystem conventions).

Any deviation from a DEFRA standard must be raised as a formal exception through the appropriate
architecture governance route. Agents must never deviate silently.

> **Figma exception (design fidelity).** When a page is built from a Figma design, the design is treated as
> the **visual/component authority**: agents build it as designed and **record every GOV.UK Design System
> deviation** for governance rather than silently overriding the design. **WCAG 2.2 AA (a legal
> requirement) and security remain hard overrides** that still win over the design.

## Building UI from designs (Figma-first, screenshot fallback)

UI pages are built through the [figma-to-web-ui skill](../skills/figma-to-web-ui/SKILL.md), which captures a
reusable **Design Spec** under `docs/design-specs/` as the "Read" stage before planning.

- **Primary source — Figma API (read-only).** Designs are read via the
  [fetch-figma-design skill](../skills/fetch-figma-design/SKILL.md) (Figma REST GET only; never the Figma
  MCP server, never a write). This is the default way of working.
- **Fallback — screenshot/PNG export.** When the Figma API is genuinely unavailable, a user-supplied
  screenshot is a supported fallback: the target image is the definitive visual source of truth, its text is
  treated as untrusted data, and anything that cannot be read confidently is marked an assumption to confirm
  rather than invented. The **same Design Spec** is captured either way.
- **The Design Spec is analysis-rich**, not just a component list. It records: evidence classification
  (confirmed vs assumption), **shared-shell vs page-content ownership** (what `layouts/page.njk` already
  renders), a **component map** (each element → GOV.UK macro or semantic HTML), **vertical rhythm & spacing**
  between every major block, a **current-vs-target** diff for corrections, and objective **visual acceptance
  criteria**.
- **Vertical rhythm & spacing are first-class.** Spacing fidelity is part of visual fidelity: a crowded,
  compressed or visually-merged layout is a **defect**, built with the GOV.UK spacing scale/classes rather
  than ad-hoc pixels, and checked during both visual verification and (if requested) review.
- **Accessibility (WCAG 2.2 AA) and security always override the design.** Other GDS deviations are followed
  and recorded for governance.

This keeps design-analysis rigour without a separate agent, and it is **skippable for Trivial/Standard
tweaks** so small UI changes stay fast.

## Universal quality gates

Before a change is merged, all applicable quality gates must pass:

- The linter passes where linting is configured.
- All tests pass with no regressions.
- Coverage meets the configured tiered targets and does not fall below the quality baseline.
- The SonarQube/SonarCloud quality gate passes; no new bugs, vulnerabilities or unacceptable code smells.
- Security hotspots are reviewed and resolved.
- UI changes have been **visually verified in the running app** against the design, including vertical
  rhythm/spacing and the Design Spec's visual acceptance criteria.
- At least one approving review is provided by another developer.
- No unresolved security vulnerabilities remain in dependencies.

## Usage guidance for developers

### Which agent should I use?

The decision comes down to one question: **does this work need a plan approved before anyone writes code?**
You can also force the answer with a manual override (see below).

#### Use the Orchestrator when

Select `Orchestrator - <Service Name>` in VS Code agent mode. Use it for **Complex** work where an
incorrect design would be costly to fix, or work spanning multiple files/components/systems.

| Scenario | Why use the Orchestrator |
| --- | --- |
| New feature or significant behaviour change | Needs decomposition, dependency ordering and a reviewable plan. |
| Change to architecture, persistence or external integrations | Higher blast radius — research and an approval gate are essential. |
| Security-relevant change (auth, secrets, input validation, PII) | Needs careful planning, validation and comprehensive testing. |
| Work spanning multiple files or components | The Planner sequences phases and identifies components that change together. |
| A formal written plan is needed for team review | The Planner produces a structured, approval-ready document. |
| The correct approach is uncertain | The workflow researches options and clarifies requirements first. |
| A JIRA epic with child tickets | The Orchestrator sequences and delivers one ticket at a time. |

**How it works**

1. Open a chat and select `Orchestrator - <Service Name>`.
2. Describe the outcome in plain language — you need not prescribe the approach.
3. The Orchestrator triages, gathers context, and (Complex) delegates planning/research, then presents a
   plan.
4. Review the plan and answer **Yes** to proceed or **No** with revision comments.
5. Only after **Yes** does it delegate implementation to the Developer.
6. At the end it **offers** a review; on **Yes** the Reviewer runs and Blocking findings go back to the
   Developer.

#### Use the Developer directly when

Select `Developer - <Service Name>` in VS Code agent mode, or use `/develop`. Use it for Trivial or Standard
changes where the scope is clear.

| Scenario | Gear |
| --- | --- |
| Typo, wording fix or comment update | Trivial |
| Single config value, constant or env-variable reference | Trivial |
| Missing test for behaviour already implemented and understood | Trivial |
| Failing test with a known root cause | Trivial |
| A new page/field/component/filter with no new architecture | Standard |
| A localised bug fix where cause and solution are understood | Standard |
| An incremental change following an established local pattern | Standard |

**How it works**

1. Open a chat and select `Developer - <Service Name>`, or use `/develop`.
2. Describe the change.
3. Trivial → Read → Implement → Test → Summarise. Standard → the Developer writes a lightweight inline plan,
   gets your approval, then implements. If it turns out to be Complex, it delegates planning to the Planner
   and gets approval before coding.

### Forcing a specific flow (manual override)

Triage is automatic by default, but you can **force** any gear in your prompt — the instruction wins over
the automatic classification:

| To force… | Say something like… |
| --- | --- |
| **Trivial** fast path | "Treat this as trivial", "just make the change, no plan needed". |
| **Standard** inline plan | "Do a lightweight/standard plan", "skip the planner, just a short plan". |
| **Complex** full plan | "Force the full plan", "use the planner", "run a full plan and review". |
| **A review** | "Review this", or answer **Yes** to the end-of-work review offer. |

Notes:

- You can always ask for **more** rigour.
- If you ask for **less** than the risk warrants, the agent complies but flags the risk first, and will not
  skip the approval gate, WCAG 2.2 AA or security for genuinely risky changes (architecture, auth,
  sessions/caching, data correctness, security surface).
- The agent echoes back which gear it is running so you can correct it.

### Decision guide

```text
Do you want to force a specific flow?
  ├─ Yes ─► State it in your prompt (see "Forcing a specific flow").
  └─ No  ─► Automatic triage applies:

Is the change trivial?
  (typo, doc, single config value, obvious small fix, missing test for known behaviour)
        │
       Yes ──► Developer directly — Read → Implement → Test → Summarise
        │
        No
        │
Does it affect architecture, security, integrations, persistence,
or multiple files/components?
        │
       Yes ──► Orchestrator — Plan → Approval → Implement → (optional) Review
        │
        No  ──► Developer directly (Standard: lightweight inline plan → approval → implement).
                The Developer re-triages and delegates to the Planner if it turns out riskier.
```

### Using the Reviewer independently

The Reviewer is **optional and on-request**. It needs no plan or approval gate. Point it at the work to
review, for example:

- `Review the changes on branch feature/my-change.`
- `Review the files changed in the latest commit.`

Use it as a pre-pull-request sanity check, a second opinion, a structured review (Blocking / Recommended /
Nit), or a readiness assessment before requesting human review.

### Repository-specific notes

| Repository | Notable differences |
| --- | --- |
| _(add per service)_ | _(e.g. extra skills, prompts or agents specific to the service)_ |
