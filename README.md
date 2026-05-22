# HGS Syntax

VS Code syntax highlighting for HydroGeoSphere `.grok` and property files.

Supported extensions:

- `.grok`
- `.mprops`
- `.etprops`
- `.fprops`
- `.dprops`
- `.oprops`

The `.grok` grammar includes title-block highlighting from the start of the file through `end title`.
The property-file grammar uses the same command highlighting but skips title-block handling so `.mprops`,
`.etprops`, `.fprops`, `.dprops`, and `.oprops` files are not treated as one large comment.

Both grammars are generated from `src/grammar/commands.json`.

## Themes

This extension includes three HGS-aware themes:

- `HGS PlasticCodeWrap`: dark theme adapted from the PlasticCodeWrap colors bundled with the original HGS TextMate/Sublime grammar.
- `HGS-black`: dark theme using a VS Code Dark 2026-style editor background.
- `HGS-white`: light theme using a VS Code Light 2026-style editor background.

Select one in VS Code with `Preferences: Color Theme`.

Default HGS token colors:

| Token | Scope | PlasticCodeWrap | HGS-black | HGS-white |
| --- | --- | --- | --- | --- |
| Commands | `support.function.command.grok` | `#FFC266` | `#D2A8FF` | `#8250DF` |
| End keyword | `keyword.control.end.grok` | `#FF5E00`, bold | `#FF7B72`, bold | `#CF222E`, bold |
| Keywords | `keyword.control.grok` | `#FFA826` | `#FFA657` | `#953800` |
| Comments/title/skip blocks | `comment.*.grok` | `#406A80` | `#8B949E` | `#6E7781` |
| Numbers | `constant.numeric.grok` | `#FF3A83` | `#79C0FF` | `#0550AE` |
| Domains | `variable.parameter.domain.grok` | `#5F7DF5`, bold | `#7EE787`, bold | `#116329`, bold |
| File references | `storage.type.file-reference.grok` | `#F6F080` | `#F2CC60` | `#9A6700` |

Color means the grammar recognized the token. It does not prove a command is valid in its current HGS block or context.
The `end` keyword is highlighted separately to make block endings easier to scan.
Commands inside `skip on` / `skip off` are intentionally colored as comments.

Customize colors in your VS Code `settings.json`:

```json
{
  "editor.tokenColorCustomizations": {
    "[HGS PlasticCodeWrap]": {
      "textMateRules": [
        {
          "scope": "support.function.command.grok",
          "settings": {
            "foreground": "#00E5FF",
            "fontStyle": "bold"
          }
        },
        {
          "scope": "comment.line.exclamation.grok",
          "settings": {
            "foreground": "#6A9955"
          }
        },
        {
          "scope": "constant.numeric.grok",
          "settings": {
            "foreground": "#FF66CC"
          }
        },
        {
          "scope": "keyword.control.end.grok",
          "settings": {
            "foreground": "#FF0000",
            "fontStyle": "bold"
          }
        },
        {
          "scope": "storage.type.file-reference.grok",
          "settings": {
            "foreground": "#FFD700"
          }
        }
      ]
    }
  }
}
```

## Local Testing

Run automated validation:

```powershell
npm test
```

Test the extension in VS Code before packaging:

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Select `HGS PlasticCodeWrap`, `HGS-black`, or `HGS-white` from `Preferences: Color Theme`.
4. Open files from `example/`.
5. Confirm the language mode is `HGS` for `.grok` files.
6. Confirm the language mode is `HGS Properties` for `.mprops`, `.etprops`, `.fprops`, `.dprops`, and `.oprops` files.

Create and install a local package before publishing:

```powershell
npm install --save-dev @vscode/vsce
npx @vscode/vsce package
code --install-extension .\hgs-syntax-0.0.1.vsix
```

Reload VS Code after installing the `.vsix`, then test the same files under `example/`.

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

## Maintenance

The generated command list is committed so the extension can be built without the reference PDF.
To regenerate command data, place `hydrosphere_ref.pdf` at the repository root and keep example files under `example/`.

Run:

```powershell
python scripts/extract-hgs-commands.py
npm run generate
npm test
```
