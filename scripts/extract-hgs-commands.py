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
