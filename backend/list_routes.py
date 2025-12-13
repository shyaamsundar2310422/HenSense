import json
import sys
from importlib import import_module

MODULE_NAME = "main"   # change if needed

def main():
    try:
        m = import_module(MODULE_NAME)
    except Exception as e:
        print(f"ERROR importing '{MODULE_NAME}': {e}", file=sys.stderr)
        sys.exit(2)

    app = getattr(m, "app", None)
    if app is None:
        print(f"ERROR: module '{MODULE_NAME}' does not have 'app'", file=sys.stderr)
        sys.exit(3)

    routes = []
    for r in sorted(app.routes, key=lambda x: x.path):
        methods = sorted([mt for mt in getattr(r, "methods", []) if mt != "HEAD"])
        routes.append({
            "path": r.path,
            "methods": methods,
            "name": getattr(r, "name", "")
        })

    print(json.dumps(routes, indent=2))

if __name__ == "__main__":
    main()
