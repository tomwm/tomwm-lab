# Local content packs

JSON packs in this folder are loaded automatically by the app (dev and local
builds). They are **gitignored**: imported official papers are for personal use
only and must never be committed or deployed. Because Vercel builds from git,
a deploy cannot pick them up.

Build one with `scripts/import_paper.py` (see its docstring).
