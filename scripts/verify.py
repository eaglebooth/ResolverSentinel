"""Generate an honest local verification report; never signs or deploys."""
import datetime
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
npm = "npm.cmd" if os.name == "nt" else "npm"
commands = [
    [sys.executable, "-m", "pytest", "tests/test_resolver_sentinel.py", "tests/test_public_source_pair.py", "-q", "-p", "no:cacheprovider"],
    [sys.executable, "-m", "pytest", "tests/direct", "-q", "-p", "no:cacheprovider"],
    [sys.executable, "-X", "utf8", "-m", "genvm_linter.cli", "check", "contracts/resolver_sentinel.py"],
    ["node", "--test", "tests/postconditions.test.mjs"],
    [npm, "run", "lint"],
    ["node", "node_modules/typescript/bin/tsc", "--noEmit"],
    [npm, "run", "build"],
]
report = {"kind": "local-verification", "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
          "commands": [], "scope": "Controlled local tests and production build; not GenVM execution or live consensus evidence."}
output = ROOT / "docs/local-evidence"
output.mkdir(parents=True, exist_ok=True)
for index, command in enumerate(commands, 1):
    result = subprocess.run(command, cwd=ROOT, text=True, encoding="utf-8", errors="replace", stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    log = output / f"command-{index}.txt"
    log.write_text(result.stdout, encoding="utf-8")
    report["commands"].append({"command": command, "exit_code": result.returncode, "log": log.name})
    print(f"{'PASS' if result.returncode == 0 else 'FAIL'}: {' '.join(command)}", flush=True)
    if result.returncode:
        print(result.stdout, flush=True)
report["passed"] = all(item["exit_code"] == 0 for item in report["commands"])
(output / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
sys.exit(0 if report["passed"] else 1)
