# Skill authoring

How to write the guardrails in `skills/`. Keep this note current with the models the
project actually runs - guidance that helps a weaker model can overconstrain a stronger
one, and repository skills steer other contributors' agents too.

Source (re-read when a new model lands): "Rethinking skills and prompts for GPT-6 Astra" -
https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra

## Rules

- Descriptions short and narrow. State when to use the skill, not everything it touches.
  A broad trigger makes the model load guidance that does not fit the task.
- Progressive disclosure. The root doc is a minimal router; push detail to supporting
  docs/scripts. Reading a skill spends context and moves the session toward compaction.
- No itineraries or recipes. Capable models handle nuance and ambiguity; overly specific
  step lists now hinder more than they help.
- One idea once. Restating the same guidance in several sections or skills dilutes signal.
- Contextual, not exhaustive, in `AGENTS.md`. "Read architecture/db/deploy before every
  edit" burns context and slows a typo fix; point to a doc only for the task that needs it.
- Capable models check their own work. Do not demand unnecessary testing, but grant
  explicit permission for known-safe suites so work is not blocked on approval each step.
- State boundaries once, then trust. Over-strong ask-first language makes a well-aligned
  model stop where the user wanted it to continue.
- Define completion up front. Otherwise a capable model returns after the first draft
  instead of running, inspecting and fixing to done.

## Applied here

- `skills/*/SKILL.md` descriptions stay one line, trigger-narrow.
- `HARNESS.md` is the router; this note is not in the read chain until skills are authored.
- Variance tracking stays in the history entries - never a second tracking file.
