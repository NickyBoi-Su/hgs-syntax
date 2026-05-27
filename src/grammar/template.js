function escapeRegex(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function phraseAlternation(phrases) {
  const sorted = [...new Set(phrases)]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
  return sorted.map(escapeRegex).join("|");
}

function phrasePattern(phrases, options = {}) {
  const pattern = `\\b(?:${phraseAlternation(phrases)})\\b`;
  return options.caseInsensitive ? `(?i:${pattern})` : pattern;
}

function buildGrammar(commandData, options = {}) {
  const includeTitle = options.includeTitle ?? true;
  const endKeywords = ["end"];
  const domainTypeArguments = ["porous media", "dual", "surface", "fracture", "channel", "well", "tile", "et"];
  const generalKeywords = commandData.keywords.filter(
    (keyword) => !endKeywords.includes(keyword.toLowerCase())
  );
  const patterns = [
    ...(includeTitle ? [{ include: "#title" }] : []),
    { include: "#skipBlock" },
    { include: "#useDomainTypeArgument" },
    { include: "#userDefinedNameArgument" },
    { include: "#lineComment" },
    { include: "#fileReferences" },
    { include: "#numbers" },
    { include: "#domains" },
    { include: "#commands" },
    { include: "#endKeyword" },
    { include: "#keywords" }
  ];
  const repository = {
    ...(includeTitle
      ? {
          title: {
            name: "comment.block.title.grok",
            begin: "\\A",
            end: "^(?i:end\\s+title)\\b.*$"
          }
        }
      : {}),
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
    useDomainTypeArgument: {
      name: "meta.command.use-domain-type.grok",
      begin: "^(\\s*)((?i:use\\s+domain\\s+type))\\b([^!]*)(!.*)?$",
      beginCaptures: {
        "2": { name: "support.function.command.grok" },
        "4": { name: "comment.line.exclamation.grok" }
      },
      end: `^\\s*((?i:\\b(?:${phraseAlternation(domainTypeArguments)})\\b))\\s*(!.*)?$|^.*$`,
      endCaptures: {
        "1": { name: "variable.parameter.domain.grok" },
        "2": { name: "comment.line.exclamation.grok" }
      }
    },
    userDefinedNameArgument: {
      name: "meta.command.user-defined-name.grok",
      begin: "^(\\s*)((?i:(?:create\\b[^!\\r\\n]*\\bset\\b|name|read\\s+properties)))\\b([^!]*)(!.*)?$",
      beginCaptures: {
        "2": { name: "support.function.command.grok" },
        "4": { name: "comment.line.exclamation.grok" }
      },
      end: "^\\s*([^!\\r\\n]*?\\S)\\s*(!.*)?$|^.*$",
      endCaptures: {
        "1": { name: "entity.name.user-defined.grok" },
        "2": { name: "comment.line.exclamation.grok" }
      }
    },
    fileReferences: {
      name: "storage.type.file-reference.grok",
      match: "(?i)(?:^|[\\s./\\\\])[-A-Za-z0-9_./\\\\]+\\.(?:grok|mprops|etprops|fprops|dprops|oprops|txt|dat|asc|ascii|tif|tiff|geotiff|shp|ah2|nchos|echos)\\b"
    },
    numbers: {
      name: "constant.numeric.grok",
      match: "(?i)(?<![A-Za-z0-9_])[+-]?(?:\\d+\\.\\d*|\\.\\d+|\\d+)(?:[ed][+-]?\\d+)?(?![A-Za-z0-9_])"
    },
    domains: {
      name: "variable.parameter.domain.grok",
      match: phrasePattern(commandData.domains, { caseInsensitive: true })
    },
    commands: {
      name: "support.function.command.grok",
      match: phrasePattern(commandData.commands, { caseInsensitive: true })
    },
    endKeyword: {
      name: "keyword.control.end.grok",
      match: phrasePattern(endKeywords, { caseInsensitive: true })
    },
    keywords: {
      name: "keyword.control.grok",
      match: phrasePattern(generalKeywords, { caseInsensitive: true })
    }
  };

  return {
    name: options.name ?? "HydroGeoSphere",
    scopeName: options.scopeName ?? "source.grok",
    fileTypes: options.fileTypes ?? ["grok"],
    patterns,
    repository,
    uuid: options.uuid ?? "d6b77132-3177-4f86-b53a-e6c8f8d7c241"
  };
}

module.exports = { buildGrammar, escapeRegex, phraseAlternation, phrasePattern };
