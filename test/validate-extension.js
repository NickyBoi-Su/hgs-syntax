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
  assert.equal(pkg.name, "hgs-syntax");
  assert.equal(pkg.publisher, "hydroclaus");
  assert.equal(pkg.engines.vscode, "^1.90.0");
  assertFile("language-configuration.json");
  assertFile("syntaxes/hgs.tmLanguage.json");
  assertFile("syntaxes/hgs-properties.tmLanguage.json");

  const language = pkg.contributes.languages.find((entry) => entry.id === "hgs");
  assert.ok(language, "hgs language is contributed");
  assert.deepEqual(language.extensions, [".grok"]);
  assert.equal(language.configuration, "./language-configuration.json");

  const propertiesLanguage = pkg.contributes.languages.find((entry) => entry.id === "hgs-properties");
  assert.ok(propertiesLanguage, "hgs-properties language is contributed");
  assert.deepEqual(propertiesLanguage.extensions, [".mprops", ".etprops", ".fprops", ".dprops", ".oprops"]);
  assert.equal(propertiesLanguage.configuration, "./language-configuration.json");

  const grammar = pkg.contributes.grammars.find((entry) => entry.language === "hgs");
  assert.ok(grammar, "hgs grammar is contributed");
  assert.equal(grammar.scopeName, "source.grok");
  assert.equal(grammar.path, "./syntaxes/hgs.tmLanguage.json");

  const propertiesGrammar = pkg.contributes.grammars.find((entry) => entry.language === "hgs-properties");
  assert.ok(propertiesGrammar, "hgs-properties grammar is contributed");
  assert.equal(propertiesGrammar.scopeName, "source.hgs-properties");
  assert.equal(propertiesGrammar.path, "./syntaxes/hgs-properties.tmLanguage.json");
}

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

  const propertiesGrammar = readJson("syntaxes/hgs-properties.tmLanguage.json");
  assert.equal(propertiesGrammar.scopeName, "source.hgs-properties");
  assert.ok(!propertiesGrammar.repository.title, "property grammar does not include title block");
  assert.ok(
    propertiesGrammar.patterns.every((pattern) => pattern.include !== "#title"),
    "property grammar does not reference title block"
  );
}

function regexFor(repositoryEntry) {
  const jsCompatiblePattern = repositoryEntry.match
    .replaceAll("(?i)", "")
    .replaceAll("(?i:", "(?:");
  return new RegExp(jsCompatiblePattern, "i");
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

function run() {
  testPackageContributions();
  testCommandData();
  testGrammarShape();
  testRepresentativePatterns();
  console.log("validate-extension: all tests passed");
}

run();
