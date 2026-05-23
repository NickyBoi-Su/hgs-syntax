# HydroGeoSphere Syntax

Syntax highlighting for HydroGeoSphere GROK and property files in Visual Studio Code.

## Supported Files

- `.grok`
- `.mprops`
- `.etprops`
- `.fprops`
- `.dprops`
- `.oprops`

`.grok` files use the `HGS` language mode. Property files use `HGS Properties`.

## Usage In VS Code

1. Install the extension.
2. Open a HydroGeoSphere file.
3. If needed, use `Change Language Mode` and select `HGS` or `HGS Properties`.
4. Use `Preferences: Color Theme` to select one of the bundled HGS themes.

The grammar highlights HGS commands, comments, numbers, domains, file references, `end` statements, and selected next-line inputs such as domain names, set names, boundary-condition names, and material names.

Highlighting means the grammar recognized a token. It does not validate whether an HGS command is valid in the current block or whether a referenced set/material exists.

## Themes

Bundled themes:

- `HGS PlasticCodeWrap`
- `HGS-black`
- `HGS-white`

Important TextMate scopes:

| Token | Scope |
| --- | --- |
| Commands | `support.function.command.grok` |
| End keyword | `keyword.control.end.grok` |
| Keywords | `keyword.control.grok` |
| Comments/title/skip blocks | `comment.*.grok` |
| Numbers | `constant.numeric.grok` |
| Domains | `variable.parameter.domain.grok` |
| File references | `storage.type.file-reference.grok` |
| User-defined names | `entity.name.user-defined.grok` |

To override colors, add rules to your VS Code `settings.json`:

```json
{
  "editor.tokenColorCustomizations": {
    "[HGS-black]": {
      "textMateRules": [
        {
          "scope": "support.function.command.grok",
          "settings": {
            "foreground": "#00E5FF",
            "fontStyle": "bold"
          }
        },
        {
          "scope": "entity.name.user-defined.grok",
          "settings": {
            "foreground": "#56D4DD",
            "fontStyle": "italic"
          }
        }
      ]
    }
  }
}
```

## Local Package Testing

Install the VS Code extension packaging tool globally once:

```powershell
npm install -g @vscode/vsce
```

From this repository:

```powershell
npm test
vsce package
code --install-extension .\hgs-syntax-0.0.1.vsix --force
```

Reload VS Code, open files from `example/`, and confirm the language modes and themes behave as expected.

## Development

Run validation:

```powershell
npm test
```

Test in an Extension Development Host:

1. Open this folder in VS Code.
2. Press `F5`.
3. Open files from `example/`.
4. Select `HGS PlasticCodeWrap`, `HGS-black`, or `HGS-white`.

Regenerate command data from the local reference PDF and examples:

```powershell
python scripts/extract-hgs-commands.py
npm run generate
npm test
```

The generated command list and grammars are committed so the extension can be built without the reference PDF. To regenerate them, place `hydrosphere_ref.pdf` at the repository root and keep example files under `example/`.
