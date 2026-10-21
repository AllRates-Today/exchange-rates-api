"""Regenerate the covered-sources block in README.md (between the sources markers).

The full per-institution list lives on one page,
https://allratestoday.com/central-bank-rates-api/institutions/, and the README
links there instead of repeating a 125-row table that drifts out of date. This
script only refreshes the counts and the example line. Counts come from the
site's catalogue (the same file the institutions page renders from). Run from
anywhere:

    python3 scripts/gen_sources_table.py                       # this package's README
    python3 scripts/gen_sources_table.py ../javascript-central-bank/README.md "await cb.latest('rbi')"
"""
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
SITE_CATALOGUE = HERE.parents[2] / "astro-blog-starter-template" / "src" / "data" / "central-banks.js"
README = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else HERE / "README.md"
EXAMPLE = sys.argv[2] if len(sys.argv) > 2 else 'cb.latest("rbi")'
LIST_URL = "https://allratestoday.com/central-bank-rates-api/institutions/"


def counts():
    js = (
        f"import('{SITE_CATALOGUE.as_uri()}').then(m => console.log(JSON.stringify("
        "{cb: m.centralBanksOnly.length, tax: m.taxAuthorities.length})))"
    )
    out = subprocess.run(["node", "--input-type=module", "-e", js], capture_output=True, text=True, check=True)
    c = json.loads(out.stdout)
    return c["cb"], c["tax"]


def main():
    cb, tax = counts()
    block = "\n".join([
        f"**[{cb} central banks and {tax} tax authorities]({LIST_URL})**, including the ECB, Federal Reserve, "
        "Bank of England, Bank of Japan, RBI, PBOC, HMRC and the US Treasury. The full list, with every "
        f"institution's code, country, currencies, history start and latest publication date, is on the "
        f"[institutions page]({LIST_URL}).",
        "",
        f"Pass an institution's code as `bank` (e.g. `{EXAMPLE}`). Every source's latest table is keyless. "
        "`sources()` returns the same list in code, with a free key.",
    ])
    text = README.read_text()
    new, n = re.subn(r"(<!-- sources:start -->\n).*?(<!-- sources:end -->)",
                     lambda m: m.group(1) + block + "\n" + m.group(2), text, flags=re.S)
    assert n == 1, "sources markers missing from README.md"
    README.write_text(new)
    print(f"wrote {cb} central banks + {tax} tax authorities -> {README}")


if __name__ == "__main__":
    main()
