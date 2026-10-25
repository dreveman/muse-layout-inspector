# Install Guide for Muse Assistant (`muse-layout-inspector`)

Follow these steps to install and publish **Layout Inspector** as a Muse web
artifact:

1. **Clone the repository:**
   ```bash
   mkdir -p ~/workspace/github/dreveman
   git clone https://github.com/dreveman/muse-layout-inspector.git \
     ~/workspace/github/dreveman/muse-layout-inspector
   ```
2. **Create the artifact and stage its source:**
   - Call the web-artifact `create` API to obtain the platform-generated
     `<slug>`.
   - Copy the repository contents into `~/workspace/ts-spaces/<slug>/`.
   - Generate `~/workspace/ts-spaces/<slug>/space.json` from
     `space.json.template` by replacing `__ARTIFACT_SLUG__` with `<slug>`.
3. **Build, audit, and submit:**
   - Run the builder's plan → build → audit → submit flow on
     `~/workspace/ts-spaces/<slug>/`.
