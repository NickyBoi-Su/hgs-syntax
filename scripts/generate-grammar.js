const fs = require("node:fs");
const path = require("node:path");
const { buildGrammar } = require("../src/grammar/template");

const root = path.resolve(__dirname, "..");
const commandsPath = path.join(root, "src", "grammar", "commands.json");
const grokOutputPath = path.join(root, "syntaxes", "hgs.tmLanguage.json");
const propertiesOutputPath = path.join(root, "syntaxes", "hgs-properties.tmLanguage.json");

const commandData = JSON.parse(fs.readFileSync(commandsPath, "utf8"));
const grokGrammar = buildGrammar(commandData, {
  name: "HydroGeoSphere GROK",
  scopeName: "source.grok",
  fileTypes: ["grok"],
  includeTitle: true
});
const propertiesGrammar = buildGrammar(commandData, {
  name: "HydroGeoSphere Properties",
  scopeName: "source.hgs-properties",
  fileTypes: ["mprops", "etprops", "fprops", "dprops", "oprops"],
  includeTitle: false,
  uuid: "1c7fc7ef-9e19-4371-bb83-ffdb0dcdb0c3"
});

fs.mkdirSync(path.dirname(grokOutputPath), { recursive: true });
fs.writeFileSync(grokOutputPath, JSON.stringify(grokGrammar, null, 2) + "\n");
fs.writeFileSync(propertiesOutputPath, JSON.stringify(propertiesGrammar, null, 2) + "\n");
console.log(`Wrote ${path.relative(root, grokOutputPath)}`);
console.log(`Wrote ${path.relative(root, propertiesOutputPath)}`);
