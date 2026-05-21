# HGS VS Code Syntax Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code syntax highlighting extension for HydroGeoSphere files using generated TextMate grammar data from local examples and the May 7, 2026 HGS reference PDF.

**Architecture:** The extension contributes `hgs` for `.grok` files and `hgs-properties` for property files. The two generated TextMate grammars share command phrase data from `src/grammar/commands.json`, so later autocomplete or hover support can reuse it without rewriting the grammar.

**Tech Stack:** VS Code extension manifest, TextMate JSON grammar, Node.js scripts/tests, Python `pypdf` extraction script.

---

## File Structure

- Create: `package.json`
  - Declares extension metadata, language associations, grammar contribution, and scripts.
- Create: `language-configuration.json`
  - Defines `!` line comments and simple bracket pairs.
- Create: `src/grammar/commands.json`
  - Stores categorized HGS phrases used by grammar generation.
- Create: `src/grammar/template.js`
  - Exports grammar-building functions and regex escaping helpers.
- Create: `scripts/extract-hgs-commands.py`
  - Reads `hydrosphere_ref.pdf` and `example/*`, extracts candidate command phrases, and writes `src/grammar/commands.json`.
- Create: `scripts/generate-grammar.js`
  - Builds `syntaxes/hgs.tmLanguage.json` from `src/grammar/commands.json`.
- Create: `syntaxes/hgs.tmLanguage.json`
  - Generated VS Code TextMate grammar for `.grok`, including title-block handling.
- Create: `syntaxes/hgs-properties.tmLanguage.json`
  - Generated VS Code TextMate grammar for property files, without title-block handling.
- Create: `test/validate-extension.js`
  - Validates package/grammar structure and representative highlighting patterns.
- Create: `README.md`
  - Documents installation, supported extensions, and grammar regeneration.
- Modify: `docs/superpowers/specs/2026-05-21-hgs-vscode-syntax-design.md`
  - Only if implementation uncovers a design mismatch.

## Task 1: Scaffold Extension Manifest

**Files:**
- Create: `package.json`
- Create: `language-configuration.json`
- Create: `README.md`
- Test: `test/validate-extension.js`

- [ ] **Step 1: Write failing manifest validation test**

Create `test/validate-extension.js` with this initial test harness:

```js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

function assertFile(relativePath) {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `${relativePath} exists`);
}

function testPackageContributions() {
  const pkg = readJson("package.json");
  assert.equal(pkg.name, "hgs-vscode-extension");
  assert.equal(pkg.publisher, "hydroclaus");
  assert.equal(pkg.engines.vscode, "^1.90.0");
  assertFile("language-configuration.json");
  assertFile("syntaxes/hgs.tmLanguage.json");

  const language = pkg.contributes.languages.find((entry) => entry.id === "hgs");
  assert.ok(language, "hgs language is contributed");
  assert.deepEqual(language.extensions, [
    ".grok",
    ".mprops",
    ".etprops",
    ".fprops",
    ".dprops",
    ".oprops",
  ]);
  assert.equal(language.configuration, "./language-configuration.json");

  const grammar = pkg.contributes.grammars.find((entry) => entry.language === "hgs");
  assert.ok(grammar, "hgs grammar is contributed");
  assert.equal(grammar.scopeName, "source.grok");
  assert.equal(grammar.path, "./syntaxes/hgs.tmLanguage.json");
}

function run() {
  testPackageContributions();
  console.log("validate-extension: all tests passed");
}

run();
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test\validate-extension.js
```

Expected: FAIL with `ENOENT` for `package.json` or a missing contributed file.

- [ ] **Step 3: Create minimal extension manifest files**

Create `package.json`:

```json
{
  "name": "hgs-vscode-extension",
  "displayName": "HydroGeoSphere Syntax",
  "description": "Syntax highlighting for HydroGeoSphere GROK and property files.",
  "version": "0.0.1",
  "publisher": "hydroclaus",
  "license": "MIT",
  "engines": {
    "vscode": "^1.90.0"
  },
  "categories": ["Programming Languages"],
  "activationEvents": [],
  "main": "",
  "contributes": {
    "languages": [
      {
        "id": "hgs",
        "aliases": ["HydroGeoSphere", "HGS", "GROK"],
        "extensions": [".grok", ".mprops", ".etprops", ".fprops", ".dprops", ".oprops"],
        "configuration": "./language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "hgs",
        "scopeName": "source.grok",
        "path": "./syntaxes/hgs.tmLanguage.json"
      }
    ]
  },
  "scripts": {
    "extract": "python scripts/extract-hgs-commands.py",
    "generate": "node scripts/generate-grammar.js",
    "test": "node test/validate-extension.js"
  }
}
```

Create `language-configuration.json`:

```json
{
  "comments": {
    "lineComment": "!"
  },
  "brackets": [
    ["(", ")"],
    ["[", "]"]
  ],
  "autoClosingPairs": [
    ["(", ")"],
    ["[", "]"],
    ["\"", "\""],
    ["'", "'"]
  ],
  "surroundingPairs": [
    ["(", ")"],
    ["[", "]"],
    ["\"", "\""],
    ["'", "'"]
  ]
}
```

Create `README.md`:

```markdown
# HydroGeoSphere Syntax

VS Code syntax highlighting for HydroGeoSphere `.grok` and property files.

Supported extensions:

- `.grok`
- `.mprops`
- `.etprops`
- `.fprops`
- `.dprops`
- `.oprops`

The grammar is generated from `src/grammar/commands.json`.

## Development

Run validation:

```powershell
npm test
```

Regenerate command data from the local PDF and examples:

```powershell
python scripts/extract-hgs-commands.py
npm run generate
```
```

Create a temporary empty `syntaxes/hgs.tmLanguage.json` so the manifest test can progress:

```json
{
  "name": "HydroGeoSphere",
  "scopeName": "source.grok",
  "patterns": []
}
```

- [ ] **Step 4: Run test to verify scaffold passes**

Run:

```powershell
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test\validate-extension.js
```

Expected: PASS with `validate-extension: all tests passed`.

## Task 2: Add Command Extraction

**Files:**
- Create: `scripts/extract-hgs-commands.py`
- Create: `src/grammar/commands.json`
- Modify: `test/validate-extension.js`

- [ ] **Step 1: Add failing command-data validation**

Append this function to `test/validate-extension.js` and call it from `run()` before the final log:

```js
function testCommandData() {
  const commands = readJson("src/grammar/commands.json");
  assert.ok(Array.isArray(commands.keywords), "keywords is an array");
  assert.ok(Array.isArray(commands.commands), "commands is an array");
  assert.ok(Array.isArray(commands.domains), "domains is an array");
  for (const expected of [
    "read algomesh 2d grid",
    "generate layers interactive",
    "boundary condition",
    "time value table",
    "evaporation depth",
    "porous media",
  ]) {
    const all = [...commands.commands, ...commands.domains, ...commands.keywords];
    assert.ok(all.includes(expected), `command data includes ${expected}`);
  }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test\validate-extension.js
```

Expected: FAIL with missing `src/grammar/commands.json`.

- [ ] **Step 3: Implement extraction script**

Create `scripts/extract-hgs-commands.py`:

```python
from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "hydrosphere_ref.pdf"
EXAMPLE_DIR = ROOT / "example"
OUTPUT_PATH = ROOT / "src" / "grammar" / "commands.json"

KEYWORDS = [
    "new",
    "use",
    "clear",
    "choose",
    "create",
    "read",
    "end",
    "skip on",
    "skip off",
]

DOMAINS = [
    "boundary condition",
    "channel",
    "discrete fracture",
    "dual continuum",
    "fracture",
    "porous media",
    "solute",
    "surface",
]

SEED_COMMANDS = [
    "base elevation",
    "canopy storage parameter",
    "choose elements am",
    "choose nodes all",
    "choose nodes top",
    "choose nodes top am",
    "coupling length",
    "create face set",
    "create node set",
    "create segment set",
    "critical depth",
    "edf quadratic decay function",
    "elevation from raster",
    "evaporation depth",
    "evaporation limiting pressure head",
    "fluid volume for chosen elements by layer",
    "fluid volume to tecplot",
    "generate layers interactive",
    "initial interception storage",
    "initial particle location by layer from file",
    "k isotropic",
    "lai tables",
    "layer name",
    "make interpolated observation point",
    "make observation point",
    "make observation well",
    "maximum particle reflection count",
    "maximum trace count",
    "maximum trace time",
    "minimum layer thickness with fixed top elevation",
    "new layer",
    "output times for particle locations",
    "porosity",
    "rdf quadratic decay function",
    "read algomesh 2d grid",
    "rill storage height",
    "root depth",
    "saturation-relative k",
    "segment set",
    "set hydrograph nodes",
    "specific storage",
    "tecplot output",
    "time value table",
    "trace particle",
    "trace particle logging",
    "transpiration fitting parameters",
    "transpiration limiting pressure head",
    "type",
    "uniform sublayering",
    "unsaturated tables",
    "use domain type",
    "x friction",
    "y friction",
]

LINE_CANDIDATE = re.compile(r"^[ \t]*([A-Za-z][A-Za-z0-9][A-Za-z0-9 _/-]{1,80})[ \t]*(?:!.*)?$")
BAD_WORDS = {
    "chapter",
    "contents",
    "figure",
    "hydrogeosphere",
    "list of figures",
    "references",
    "table",
}


def normalize_phrase(value: str) -> str:
    value = value.replace("\u2010", "-").replace("\u2011", "-").replace("\u2013", "-")
    value = re.sub(r"\s+", " ", value.strip().lower())
    return value


def is_candidate(value: str) -> bool:
    if not value or len(value) < 3 or len(value) > 80:
        return False
    if any(char.isdigit() for char in value):
        return False
    if value in BAD_WORDS:
        return False
    if value.startswith(("the ", "this ", "for ", "where ", "when ")):
        return False
    words = value.split()
    return 1 <= len(words) <= 7


def phrases_from_examples() -> set[str]:
    phrases: set[str] = set()
    for path in EXAMPLE_DIR.glob("*"):
        if not path.is_file():
            continue
        for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            code = raw_line.split("!", 1)[0].strip()
            match = LINE_CANDIDATE.match(code)
            if match:
                phrase = normalize_phrase(match.group(1))
                if is_candidate(phrase):
                    phrases.add(phrase)
    return phrases


def phrases_from_pdf() -> set[str]:
    phrases: set[str] = set()
    reader = PdfReader(str(PDF_PATH))
    for page in reader.pages:
        text = page.extract_text() or ""
        for raw_line in text.splitlines():
            line = normalize_phrase(raw_line)
            line = re.sub(r"\s+\.{2,}\s+\d+$", "", line)
            if is_candidate(line):
                phrases.add(line)
    return phrases


def main() -> None:
    commands = sorted(set(SEED_COMMANDS) | phrases_from_examples() | phrases_from_pdf())
    payload = {
        "keywords": KEYWORDS,
        "domains": DOMAINS,
        "commands": [phrase for phrase in commands if phrase not in KEYWORDS and phrase not in DOMAINS],
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)} with {len(payload['commands'])} command phrases")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run extraction and test**

Run:

```powershell
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\extract-hgs-commands.py
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test\validate-extension.js
```

Expected: extraction prints a written command count; validation passes.

## Task 3: Generate TextMate Grammar

**Files:**
- Create: `src/grammar/template.js`
- Create: `scripts/generate-grammar.js`
- Modify: `syntaxes/hgs.tmLanguage.json`
- Modify: `test/validate-extension.js`

- [ ] **Step 1: Add failing grammar validation**

Add this function to `test/validate-extension.js` and call it from `run()`:

```js
function testGrammarShape() {
  const grammar = readJson("syntaxes/hgs.tmLanguage.json");
  assert.equal(grammar.scopeName, "source.grok");
  assert.ok(Array.isArray(grammar.patterns), "grammar patterns is an array");
  const repositoryKeys = Object.keys(grammar.repository);
  for (const key of ["title", "skipBlock", "lineComment", "commands", "domains", "fileReferences", "numbers"]) {
    assert.ok(repositoryKeys.includes(key), `repository includes ${key}`);
  }
  const commandPattern = grammar.repository.commands.match;
  assert.match("read algomesh 2d grid", new RegExp(commandPattern, "i"));
  assert.match("generate layers interactive", new RegExp(commandPattern, "i"));
  assert.match("evaporation depth", new RegExp(commandPattern, "i"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test\validate-extension.js
```

Expected: FAIL because the temporary grammar has no repository.

- [ ] **Step 3: Implement grammar template and generator**

Create `src/grammar/template.js`:

```js
function escapeRegex(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function phrasePattern(phrases) {
  const sorted = [...new Set(phrases)]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
  return `\\b(?:${sorted.map(escapeRegex).join("|")})\\b`;
}

function buildGrammar(commandData) {
  return {
    name: "HydroGeoSphere",
    scopeName: "source.grok",
    fileTypes: ["grok", "mprops", "etprops", "fprops", "dprops", "oprops"],
    patterns: [
      { include: "#title" },
      { include: "#skipBlock" },
      { include: "#lineComment" },
      { include: "#fileReferences" },
      { include: "#numbers" },
      { include: "#domains" },
      { include: "#commands" },
      { include: "#keywords" }
    ],
    repository: {
      title: {
        name: "comment.block.title.grok",
        begin: "\\A",
        end: "^(?i:end\\s+title)\\b.*$"
      },
      skipBlock: {
        name: "comment.block.skip.grok",
        begin: "^(?i:\\s*skip\\s+on)\\b.*$",
        end: "^(?i:\\s*skip\\s+off)\\b.*$"
      },
      lineComment: {
        name: "comment.line.exclamation.grok",
        begin: "!",
        beginCaptures: {
          "0": { name: "punctuation.definition.comment.grok" }
        },
        end: "$"
      },
      fileReferences: {
        name: "storage.type.file-reference.grok",
        match: "(?i)(?:^|[\\s./\\\\])[-A-Za-z0-9_./\\\\]+\\.(?:grok|mprops|etprops|fprops|dprops|oprops|txt|dat|asc|ah2|nchos|echos)\\b"
      },
      numbers: {
        name: "constant.numeric.grok",
        match: "(?i)(?<![A-Za-z0-9_])[+-]?(?:\\d+\\.\\d*|\\.\\d+|\\d+)(?:[ed][+-]?\\d+)?(?![A-Za-z0-9_])"
      },
      domains: {
        name: "variable.parameter.domain.grok",
        match: phrasePattern(commandData.domains)
      },
      commands: {
        name: "support.function.command.grok",
        match: phrasePattern(commandData.commands)
      },
      keywords: {
        name: "keyword.control.grok",
        match: phrasePattern(commandData.keywords)
      }
    },
    uuid: "d6b77132-3177-4f86-b53a-e6c8f8d7c241"
  };
}

module.exports = { buildGrammar, escapeRegex, phrasePattern };
```

Create `scripts/generate-grammar.js`:

```js
const fs = require("node:fs");
const path = require("node:path");
const { buildGrammar } = require("../src/grammar/template");

const root = path.resolve(__dirname, "..");
const commandsPath = path.join(root, "src", "grammar", "commands.json");
const outputPath = path.join(root, "syntaxes", "hgs.tmLanguage.json");

const commandData = JSON.parse(fs.readFileSync(commandsPath, "utf8"));
const grammar = buildGrammar(commandData);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(grammar, null, 2) + "\n");
console.log(`Wrote ${path.relative(root, outputPath)}`);
```

- [ ] **Step 4: Generate grammar and verify**

Run:

```powershell
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\generate-grammar.js
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test\validate-extension.js
```

Expected: grammar writes successfully; validation passes.

## Task 4: Validate Representative HGS Lines

**Files:**
- Modify: `test/validate-extension.js`
- Modify: `src/grammar/template.js` only if tests expose a bad regex.

- [ ] **Step 1: Add failing representative pattern tests**

Add this helper and test to `test/validate-extension.js`, then call `testRepresentativePatterns()` from `run()`:

```js
function regexFor(repositoryEntry) {
  return new RegExp(repositoryEntry.match, "i");
}

function testRepresentativePatterns() {
  const grammar = readJson("syntaxes/hgs.tmLanguage.json");
  const repo = grammar.repository;
  assert.match("read algomesh 2d grid   ! reads a grid", regexFor(repo.commands));
  assert.match("    elevation from raster", regexFor(repo.commands));
  assert.match("evaporation depth", regexFor(repo.commands));
  assert.match("porous media", regexFor(repo.domains));
  assert.match("./mesh/R5_mesh.ah2", regexFor(repo.fileReferences));
  assert.match("1.800105973E-01 4.4549345538E-04", regexFor(repo.numbers));
  assert.match("-150", regexFor(repo.numbers));
}
```

- [ ] **Step 2: Run test to verify it fails if regexes are incomplete**

Run:

```powershell
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test\validate-extension.js
```

Expected: PASS if Task 3 regexes are sufficient, otherwise FAIL on the specific missing pattern.

- [ ] **Step 3: Fix only the failing regex or command data**

If the failure is a missing command, add the phrase to `SEED_COMMANDS` in `scripts/extract-hgs-commands.py`, rerun extraction, rerun generation, then rerun tests.

If the failure is a regex boundary issue, update the relevant pattern in `src/grammar/template.js`, rerun generation, then rerun tests.

- [ ] **Step 4: Run full validation**

Run:

```powershell
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test\validate-extension.js
```

Expected: PASS with `validate-extension: all tests passed`.

## Task 5: Final Verification and Local Usage Notes

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add packaging and manual verification notes**

Update `README.md` to include:

```markdown
## Manual VS Code Test

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Open files from `example/`.
4. Confirm the language mode is `HGS` for `.grok`, `.mprops`, `.etprops`, `.fprops`, `.dprops`, and `.oprops` files.

## Maintenance

The command list is generated from the local `hydrosphere_ref.pdf` and files under `example/`.

Run:

```powershell
python scripts/extract-hgs-commands.py
npm run generate
npm test
```
```

- [ ] **Step 2: Run full validation**

Run:

```powershell
& 'C:\Users\nicks\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test\validate-extension.js
```

Expected: PASS with `validate-extension: all tests passed`.

- [ ] **Step 3: Check generated files are present**

Run:

```powershell
Get-ChildItem package.json,language-configuration.json,syntaxes\hgs.tmLanguage.json,src\grammar\commands.json,README.md
```

Expected: all listed files exist.

- [ ] **Step 4: Report completion evidence**

Report:

- The files created.
- The command count produced by `scripts/extract-hgs-commands.py`.
- The final validation command and result.
- Any manual VS Code Extension Development Host verification not run.

## Self-Review

- Spec coverage: The plan covers syntax highlighting for `.grok`, `.mprops`, `.etprops`, `.fprops`, `.dprops`, and `.oprops`; use of the PDF; local examples; and future reuse of command data for autocomplete.
- Placeholder scan: No task contains `TBD`, `TODO`, or an unspecified implementation step.
- Type consistency: `commands.json` uses `keywords`, `domains`, and `commands`; `template.js`, `generate-grammar.js`, and tests all use those same names.
