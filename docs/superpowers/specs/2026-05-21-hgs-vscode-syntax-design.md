# HGS VS Code Syntax Extension Design

## Goal

Build a VS Code extension that provides syntax highlighting for HydroGeoSphere input files, including `.grok`, `.mprops`, `.etprops`, `.fprops`, `.dprops`, and `.oprops`.

## Scope

Version 1 is syntax highlighting only. It will not add autocomplete, hovers, validation, formatting, or a language server. The grammar should be organized so command data can later be reused by autocomplete without re-reading the PDF or rewriting the grammar.

## Approaches Considered

### Approach A: Package the upstream TextMate grammar as-is

This is the smallest change. It would copy `packages/hgs.tmLanguage` from `hydroclaus/hgs_grammar`, associate it with HGS file extensions, and ship it.

Tradeoff: it is fast, but it only covers the older compact grammar. It does not use the included May 7, 2026 reference PDF and misses many current commands.

### Approach B: Generated TextMate grammar from curated command data

This approach keeps a small source grammar template and a checked-in command list. A script extracts likely HGS command phrases from the local example files and the reference PDF, writes `syntaxes/hgs.tmLanguage.json`, and validation tests confirm the extension manifest and grammar compile structurally.

Tradeoff: it takes more setup than copying the old grammar, but it gives a maintainable path for adding/updating commands.

### Approach C: Full language server

This approach would parse HGS files and provide diagnostics, completions, hovers, and semantic tokens.

Tradeoff: this is the most powerful option, but it is too large for the first extension pass. It requires a command model, parser rules, and more extensive testing.

## Selected Design

Use Approach B.

The extension will contribute two closely related language ids. `hgs` handles `.grok` files with a title-block rule from the start of the file through `end title`. `hgs-properties` handles `.mprops`, `.etprops`, `.fprops`, `.dprops`, and `.oprops` with the same command, comment, file-reference, and numeric highlighting, but without the start-of-file title block. The split prevents property files without `end title` from being highlighted as one giant title comment. The initial implementation will not claim `.txt`, because that would steal too many generic text files from VS Code.

The generated TextMate grammar will highlight:

- Initial title block from file start through `end title`.
- `skip on` through `skip off` blocks as block comments.
- `!` line comments.
- HGS command phrases mined from the reference PDF and examples.
- Common section/control words such as `new`, `use`, `clear`, `choose`, `create`, `read`, and `end`.
- Domain/property phrases such as `porous media`, `surface`, `fracture`, `dual`, `channel`, `solute`, and `boundary condition`.
- File/path references ending in HGS-related extensions.
- Numeric constants, including signed decimal and scientific notation.

## File Structure

- `package.json`: VS Code extension manifest with language and grammar contributions plus local scripts.
- `language-configuration.json`: comment settings for `!` line comments and simple bracket behavior.
- `syntaxes/hgs.tmLanguage.json`: generated TextMate grammar consumed by VS Code for `.grok`.
- `syntaxes/hgs-properties.tmLanguage.json`: generated TextMate grammar consumed by VS Code for property files.
- `src/grammar/commands.json`: checked-in command phrase list used by the generator.
- `src/grammar/template.js`: grammar-building logic that converts command data into a TextMate JSON grammar.
- `scripts/extract-hgs-commands.py`: extracts candidate command phrases from `hydrosphere_ref.pdf` and `example/*`.
- `scripts/generate-grammar.js`: writes `syntaxes/hgs.tmLanguage.json` from `commands.json`.
- `test/validate-extension.js`: verifies manifest paths, grammar shape, extension associations, and representative regex behavior.
- `README.md`: extension usage and maintenance notes.

## Testing Strategy

Use local deterministic tests that do not need network access:

- `npm test` runs `node test/validate-extension.js`.
- The test checks that all contributed files exist and parse as JSON.
- The test checks that the grammar includes expected scopes for comments, title blocks, skip blocks, commands, file references, and numbers.
- The test checks representative example lines from `example/R5.grok`, `example/R5.mprops`, `example/R5.etprops`, and `example/R5.oprops` against the generated regex patterns.

Manual VS Code verification can follow by opening the workspace as an extension development host after the scaffold exists.

## Constraints

The workspace is currently not a Git repository, so the Superpowers instruction to commit the design document cannot be completed in this state. The design and implementation plan will be saved under `docs/superpowers/`.

The PDF extraction depends on `pypdf`, which is available in the bundled Codex Python runtime in this workspace.
