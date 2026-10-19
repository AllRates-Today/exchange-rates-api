"""Regenerate the covered-sources table in README.md (between the sources markers).

Bank metadata comes from the npm bank-SDK generator (one list for every SDK);
cadence comes from the live open endpoint. Run from anywhere:

    python3 scripts/gen_sources_table.py                       # this package's README
    python3 scripts/gen_sources_table.py ../javascript-central-bank/README.md "await cb.latest('rbi')"
"""
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
NPM_GEN = HERE.parents[2] / "allratestoday-bank-sdks" / "generate.mjs"
README = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else HERE / "README.md"
EXAMPLE = sys.argv[2] if len(sys.argv) > 2 else 'cb.latest("rbi")'


def load_banks():
    body = re.search(r"const BANKS = \[([\s\S]*?)\n\];", NPM_GEN.read_text()).group(1)
    out = subprocess.run(["node", "--input-type=module", "-e", f"console.log(JSON.stringify([{body}]))"],
                         capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def live_cadence():
    req = urllib.request.Request("https://allratestoday.com/api/open/central-banks",
                                 headers={"User-Agent": "allratestoday-central-bank-readme"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return {s["code"]: s.get("cadence") for s in json.load(r)["sources"]}


def rows(banks, cadence, tax):
    picked = [b for b in banks if (b.get("kind") == "tax authority") == tax]
    picked.sort(key=lambda b: (b["country"].removeprefix("the "), b["name"]))
    hub = "tax-authority-rates-api" if tax else "central-bank-rates-api"
    out = ["| Code | Institution | Country | Currency | Publishes | Archive from |", "|---|---|---|---|---|---|"]
    for b in picked:
        out.append(f'| `{b["code"]}` | [{b["name"]}](https://allratestoday.com/{hub}/{b["code"]}/) '
                   f'| {b["country"].removeprefix("the ")} | {b["homeCcy"]} '
                   f'| {cadence.get(b["code"]) or b.get("cadence") or "daily"} | {b.get("since", "")} |')
    return out


def main():
    banks, cadence = load_banks(), live_cadence()
    cb = [b for b in banks if b.get("kind") != "tax authority"]
    tax = [b for b in banks if b.get("kind") == "tax authority"]
    table = "\n".join([
        f"**{len(cb)} central banks and {len(tax)} tax authorities.** Pass the `Code` as `bank` "
        f"(e.g. `{EXAMPLE}`). Every source's latest table is keyless.",
        "",
        "### Tax authorities",
        "",
        *rows(banks, cadence, True),
        "",
        "### Central banks",
        "",
        *rows(banks, cadence, False),
    ])
    text = README.read_text()
    new, n = re.subn(r"(<!-- sources:start -->\n).*?(<!-- sources:end -->)",
                     lambda m: m.group(1) + table + "\n" + m.group(2), text, flags=re.S)
    assert n == 1, "sources markers missing from README.md"
    README.write_text(new)
    print(f"wrote {len(cb)} central banks + {len(tax)} tax authorities")


if __name__ == "__main__":
    main()
