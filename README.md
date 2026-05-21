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

## Local Testing

Run automated validation:

```powershell
npm test
```

Test the extension in VS Code before packaging:

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Open files from `example/`.
4. Confirm the language mode is `HGS` for `.grok` files.
5. Confirm the language mode is `HGS Properties` for `.mprops`, `.etprops`, `.fprops`, `.dprops`, and `.oprops` files.

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
