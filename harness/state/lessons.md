# Lessons

One line per lesson: symptom | cause | fix | evidence. Promote here only when the same failure appears a second time (first occurrence stays in the history entry variance line).

- floor data assumed from context/memory | agent trusted its own earlier reads over disk while floors changed between turns (user edits in app UI) | EVERY action starts with a fresh disk read of blueprint-data.json (or target file) - not just writes; reads too. Never reuse remembered object/asset/zone state from context, even one turn old | 2026-09-19 user standing order x3: "ทุกการกระทำจะดูข้อมูลจาก floor ใหม่เสมอ อย่าจำจาก context" - applies to reads, writes, edits, reports about floors
