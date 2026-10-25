# Install prompt for Layout Inspector

Copy the prompt below to your Muse assistant to install or update Layout
Inspector:

---

Install (or update) Layout Inspector for me.

Follow `docs/INSTALL_GUIDE_FOR_MUSE_ASSISTENT.md` in the repository
`https://github.com/dreveman/muse-layout-inspector.git` (checkout:
`~/workspace/github/dreveman/muse-layout-inspector`). If anything goes wrong,
stop and tell me — do not improvise around a failed step.

Never modify anything in the git checkout — deploy artifacts are generated at
install time in the staged snapshot (`~/workspace/ts-spaces/<slug>/`) via
`web/stage-snapshot.sh <slug>`. Follow your artifacts skill's plan → build →
audit → submit flow, and report once the Space is published and live.
