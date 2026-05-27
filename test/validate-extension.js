const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

function assertFile(relativePath) {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `${relativePath} exists`);
}

function assertThemeContribution(pkg, label, uiTheme, themePath) {
  const theme = pkg.contributes.themes.find((entry) => entry.label === label);
  assert.ok(theme, `${label} theme is contributed`);
  assert.equal(theme.uiTheme, uiTheme);
  assert.equal(theme.path, themePath);
  assertFile(themePath.replace("./", ""));
}

function testPackageContributions() {
  const pkg = readJson("package.json");
  assert.equal(pkg.name, "hgs-syntax");
  assert.equal(pkg.publisher, "hydroclaus");
  assert.equal(pkg.displayName, "HydroGeoSphere Syntax");
  assert.equal(pkg.description, "Syntax highlighting for HydroGeoSphere GROK and property files.");
  assert.equal(pkg.license, "MIT");
  assert.deepEqual(pkg.repository, {
    type: "git",
    url: "https://github.com/NickyBoi-Su/hgs-syntax.git"
  });
  assert.deepEqual(pkg.bugs, {
    url: "https://github.com/NickyBoi-Su/hgs-syntax/issues"
  });
  assert.equal(pkg.homepage, "https://github.com/NickyBoi-Su/hgs-syntax#readme");
  assert.equal(pkg.icon, "images/icon.png");
  assert.deepEqual(pkg.galleryBanner, {
    color: "#121314",
    theme: "dark"
  });
  for (const keyword of ["HydroGeoSphere", "HGS", "GROK", "syntax", "highlighting"]) {
    assert.ok(pkg.keywords.includes(keyword), `package keywords include ${keyword}`);
  }
  assert.equal(pkg.engines.vscode, "^1.90.0");
  assert.ok(!Object.hasOwn(pkg, "activationEvents"), "activationEvents is omitted for declarative-only extension");
  assertFile("language-configuration.json");
  assertFile("syntaxes/hgs.tmLanguage.json");
  assertFile("syntaxes/hgs-properties.tmLanguage.json");
  assertFile("images/icon.png");
  assertFile("CHANGELOG.md");
  assertFile(".vscodeignore");

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

  assertThemeContribution(pkg, "HGS PlasticCodeWrap", "vs-dark", "./themes/hgs-plastic-code-wrap-color-theme.json");
  assertThemeContribution(pkg, "HGS-black", "vs-dark", "./themes/hgs-black-color-theme.json");
  assertThemeContribution(pkg, "HGS-white", "vs", "./themes/hgs-white-color-theme.json");
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
  for (const key of [
    "title",
    "skipBlock",
    "lineComment",
    "useDomainTypeArgument",
    "userDefinedNameArgument",
    "commands",
    "domains",
    "fileReferences",
    "numbers",
    "endKeyword"
  ]) {
    assert.ok(repositoryKeys.includes(key), `repository includes ${key}`);
  }
  const commandPattern = grammar.repository.commands.match;
  const domainPattern = grammar.repository.domains.match;
  const keywordPattern = grammar.repository.keywords.match;
  assert.ok(commandPattern.startsWith("(?i:"), "commands are case-insensitive in TextMate grammar");
  assert.ok(domainPattern.startsWith("(?i:"), "domains are case-insensitive in TextMate grammar");
  assert.ok(keywordPattern.startsWith("(?i:"), "keywords are case-insensitive in TextMate grammar");
  assert.equal(grammar.repository.endKeyword.name, "keyword.control.end.grok");
  assert.ok(grammar.repository.endKeyword.match.startsWith("(?i:"), "end keyword is case-insensitive");
  assert.ok(
    grammar.patterns.findIndex((pattern) => pattern.include === "#endKeyword") <
      grammar.patterns.findIndex((pattern) => pattern.include === "#keywords"),
    "end keyword is matched before general keywords"
  );
  assert.ok(
    grammar.patterns.findIndex((pattern) => pattern.include === "#useDomainTypeArgument") <
      grammar.patterns.findIndex((pattern) => pattern.include === "#domains"),
    "use domain type arguments are matched before generic domains"
  );
  assert.ok(
    grammar.patterns.findIndex((pattern) => pattern.include === "#userDefinedNameArgument") <
      grammar.patterns.findIndex((pattern) => pattern.include === "#commands"),
    "user-defined name arguments are matched before generic commands"
  );
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

function regexFromTextMate(pattern) {
  const jsCompatiblePattern = pattern
    .replaceAll("(?i)", "")
    .replaceAll("(?i:", "(?:");
  return new RegExp(jsCompatiblePattern, "i");
}

function testRepresentativePatterns() {
  const grammar = readJson("syntaxes/hgs.tmLanguage.json");
  const repo = grammar.repository;
  assert.match("read algomesh 2d grid   ! reads a grid", regexFor(repo.commands));
  assert.match("Trace particle logging", regexFor(repo.commands));
  assert.match("Maximum trace count", regexFor(repo.commands));
  assert.match("Fluid volume to tecplot", regexFor(repo.commands));
  assert.match("Porous Media", regexFor(repo.domains));
  assert.match("end", regexFor(repo.endKeyword));
  assert.match("End", regexFor(repo.endKeyword));
  assert.match("END", regexFor(repo.endKeyword));
  assert.doesNotMatch("END", regexFor(repo.keywords));
  assert.match("    elevation from raster", regexFor(repo.commands));
  assert.match("evaporation depth", regexFor(repo.commands));
  assert.match("porous media", regexFor(repo.domains));
  assert.match("./mesh/R5_mesh.ah2", regexFor(repo.fileReferences));
  assert.match("./Elevations/base.asc", regexFor(repo.fileReferences));
  assert.match("./tables/inflow.txt", regexFor(repo.fileReferences));
  assert.match("./rasters/dem.tif", regexFor(repo.fileReferences));
  assert.match("./rasters/dem.tiff", regexFor(repo.fileReferences));
  assert.match("./rasters/dem.geotiff", regexFor(repo.fileReferences));
  assert.match("./gis/watershed.shp", regexFor(repo.fileReferences));
  assert.match("1.800105973E-01 4.4549345538E-04", regexFor(repo.numbers));
  assert.match("-150", regexFor(repo.numbers));
}

function testNextLineArgumentPatterns() {
  const grammar = readJson("syntaxes/hgs.tmLanguage.json");
  const repo = grammar.repository;
  const useDomainBegin = regexFromTextMate(repo.useDomainTypeArgument.begin);
  const useDomainEnd = regexFromTextMate(repo.useDomainTypeArgument.end);
  const userNameBegin = regexFromTextMate(repo.userDefinedNameArgument.begin);
  const userNameEnd = regexFromTextMate(repo.userDefinedNameArgument.end);

  assert.equal(repo.useDomainTypeArgument.endCaptures["1"].name, "variable.parameter.domain.grok");
  assert.equal(repo.userDefinedNameArgument.endCaptures["1"].name, "entity.name.user-defined.grok");

  assert.match("use domain type     ! activate domain", useDomainBegin);
  for (const domain of ["porous media", "dual", "surface", "fracture", "channel", "well", "tile", "et", "ET"]) {
    const match = domain.match(useDomainEnd);
    assert.ok(match, `${domain} matches use domain type argument line`);
    assert.equal(match[1].toLowerCase(), domain.toLowerCase());
  }
  for (const invalidDomain of ["dual continua", "surface flow", "discretely-fractured"]) {
    const match = invalidDomain.match(useDomainEnd);
    assert.ok(match, `${invalidDomain} ends the use domain type context`);
    assert.equal(match[1], undefined, `${invalidDomain} is not captured as a canonical domain argument`);
  }

  assert.match("create segment set", userNameBegin);
  assert.match("create node set", userNameBegin);
  assert.match("Name", userNameBegin);
  assert.match("read properties", userNameBegin);
  for (const userInput of ["outlet", "wells", "CritDepth_outlet", "Medium Sand", "et1"]) {
    const match = userInput.match(userNameEnd);
    assert.ok(match, `${userInput} matches user-defined name line`);
    assert.equal(match[1], userInput);
  }
}

function tokenSettingsByScope(theme) {
  const colorsByScope = new Map();
  for (const rule of theme.tokenColors) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    for (const scope of scopes) {
      colorsByScope.set(scope, rule.settings);
    }
  }
  return colorsByScope;
}

function assertHgsThemeTokens(theme, expected) {
  const colorsByScope = tokenSettingsByScope(theme);

  for (const [scope, color] of Object.entries(expected)) {
    assert.equal(colorsByScope.get(scope).foreground, color, `${theme.name} ${scope} color`);
  }
  assert.equal(colorsByScope.get("variable.parameter.domain.grok").fontStyle, "bold");
  assert.notEqual(
    colorsByScope.get("keyword.control.end.grok").foreground,
    colorsByScope.get("keyword.control.grok").foreground,
    `${theme.name} end color differs from general keywords`
  );
  assert.notEqual(
    colorsByScope.get("keyword.control.end.grok").foreground,
    colorsByScope.get("support.function.command.grok").foreground,
    `${theme.name} end color differs from commands`
  );
  assert.notEqual(
    colorsByScope.get("storage.type.file-reference.grok").foreground,
    colorsByScope.get("support.function.command.grok").foreground,
    `${theme.name} file references differ from commands`
  );
  assert.notEqual(
    colorsByScope.get("storage.type.file-reference.grok").foreground,
    colorsByScope.get("keyword.control.grok").foreground,
    `${theme.name} file references differ from general keywords`
  );
  assert.ok(colorsByScope.has("entity.name.user-defined.grok"), `${theme.name} has user-defined name color`);
}

function testThemeColors() {
  const plasticTheme = readJson("themes/hgs-plastic-code-wrap-color-theme.json");
  assert.equal(plasticTheme.name, "HGS PlasticCodeWrap");
  assert.equal(plasticTheme.type, "dark");
  assert.equal(plasticTheme.colors["editor.background"], "#00161B");
  assertHgsThemeTokens(plasticTheme, {
    "support.function.command.grok": "#FFC266",
    "keyword.control.end.grok": "#FF5E00",
    "keyword.control.grok": "#FFA826",
    "comment.line.exclamation.grok": "#406A80",
    "constant.numeric.grok": "#FF3A83",
    "variable.parameter.domain.grok": "#5F7DF5",
    "storage.type.file-reference.grok": "#F6F080",
    "entity.name.user-defined.grok": "#00D7C3"
  });

  const blackTheme = readJson("themes/hgs-black-color-theme.json");
  assert.equal(blackTheme.name, "HGS-black");
  assert.equal(blackTheme.type, "dark");
  assert.equal(blackTheme.colors["editor.background"], "#121314");
  assert.equal(blackTheme.colors["editor.foreground"], "#BBBEBF");
  assertHgsThemeTokens(blackTheme, {
    "support.function.command.grok": "#D2A8FF",
    "keyword.control.end.grok": "#FF7B72",
    "keyword.control.grok": "#FFA657",
    "comment.line.exclamation.grok": "#8B949E",
    "constant.numeric.grok": "#79C0FF",
    "variable.parameter.domain.grok": "#7EE787",
    "storage.type.file-reference.grok": "#F2CC60",
    "entity.name.user-defined.grok": "#56D4DD"
  });

  const whiteTheme = readJson("themes/hgs-white-color-theme.json");
  assert.equal(whiteTheme.name, "HGS-white");
  assert.equal(whiteTheme.type, "light");
  assert.equal(whiteTheme.colors["editor.background"], "#FFFFFF");
  assert.equal(whiteTheme.colors["editor.foreground"], "#202020");
  assertHgsThemeTokens(whiteTheme, {
    "support.function.command.grok": "#8250DF",
    "keyword.control.end.grok": "#CF222E",
    "keyword.control.grok": "#953800",
    "comment.line.exclamation.grok": "#6E7781",
    "constant.numeric.grok": "#0550AE",
    "variable.parameter.domain.grok": "#116329",
    "storage.type.file-reference.grok": "#9A6700",
    "entity.name.user-defined.grok": "#0969DA"
  });
}

function run() {
  testPackageContributions();
  testCommandData();
  testGrammarShape();
  testRepresentativePatterns();
  testNextLineArgumentPatterns();
  testThemeColors();
  console.log("validate-extension: all tests passed");
}

run();
