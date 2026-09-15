---
name: wire-paths
description: Keep path references consistent across a move, rename, or structural change. Apply before moving or renaming a referenced file, and again after.
---

# Wire Paths

A moved file with stale references is a broken harness. Every path lives in two places: on disk and in the heads of its consumers (docs, pointers, scripts, gates). Move one without the other and the next agent follows a dead link.

## Rules

- **Move tracked files with `git mv`** (force only on explicit order when unstaged edits block it). Untracked files move with the filesystem, then get staged.
- **Grep both the old path AND the old basename repo-wide.** Consumers reference either form; one grep is half the job.
- **Update every consumer in the same change**: docs, agent pointers, scripts (path constants, messages, comments), scaffold templates, and the skill gate itself.
- **Never rewrite dated logs.** History entries record the paths as they were - they are evidence, not wiring.
- **One move, one verification.** After rewiring, run the check command plus whatever suite the touched files route to.

## Done-check

Search the repo for the old path and the old basename. The only acceptable survivors are dated log entries. Everything else must point at the new home.
