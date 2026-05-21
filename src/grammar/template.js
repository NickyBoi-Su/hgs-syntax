function escapeRegex(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function phrasePattern(phrases) {
  const sorted = [...new Set(phrases)]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
  return `\\b(?:${sorted.map(escapeRegex).join("|")})\\b`;
}

function buildGrammar(commandData, options = {}) {
  const includeTitle = options.includeTitle ?? true;
  const patterns = [
    ...(includeTitle ? [{ include: "#title" }] : []),
    { include: "#skipBlock" },
    { include: "#lineComment" },
    { include: "#fileReferences" },
    { include: "#numbers" },
    { include: "#domains" },
    { include: "#commands" },
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

module.exports = { buildGrammar, escapeRegex, phrasePattern };
