# Famo OS Open Source Playbook

## Philosophy

- **Transparency first.** All companion behaviors, prompts, and data integrations should be inspectable and modifiable.
- **Composable layers.** Treat every feature—3D models, personas, data feeds, ML modules—as optional, swappable building blocks.
- **Community > ego.** Forks are celebrated. Share your forks, companion lore, or ML experiments and we’ll highlight them in the showcase.
- **Security awareness.** When integrating on-chain actions (launching a token, moving liquidity) always require explicit user approval.
- **Responsible AI.** Personal data, wallets, and market signals should be handled under the most restrictive privacy assumptions.

## How to Contribute

1. **Fork the repo** and branch off `master`.
2. **Create focused PRs.** Limit each PR to a set of related changes; include screenshots or screen recordings for UI work.
3. **Follow the style guide:**
   - TypeScript with strict linting (`npm run lint`).
   - Use React hooks and typed props.
   - Keep persona changes inside `config/persona.xml`.
4. **Document your additions** in `docs/` or inline comments if the behavior is non-obvious.
5. **Run the test and lint suites** before opening a PR.

## Seeking Maintainers & Collaborators

- **Persona designers** – craft unique companion personalities and lore.
- **WebGL enthusiasts** – expand the 3D model library and animation system.
- **Data scientists / ML builders** – plug in bundle detectors, on-chain analytics, and predictive models.
- **Security reviewers** – help design safe agentic flows for swaps, liquidity management, and token launches.

Interested? Open an issue tagged `maintainer-applicant` with your background and how you’d like to help.

## Reporting Issues

1. Check existing issues and discussions.
2. Use the templates for bugs, feature requests, or security disclosures.
3. Include reproduction steps, environment details, and relevant logs.

For security-sensitive findings, email the maintainer privately or use GitHub security advisories.

## Community Etiquette

- Be respectful. Many contributors are pseudonymous builders—judge ideas, not people.
- Give credit. If you build atop an experiment from another fork, acknowledge their work.
- Share knowledge. Post ML experiments, telemetry dashboards, or deployment recipes to inspire others.

## Licensing & Attribution

Famo OS ships under the MIT License. You’re free to modify and redistribute as long as the license text remains in derivative projects.

If you ship a public fork, we appreciate a link back to the original repo and a note in your README.

## Roadmap Collaboration

We maintain the roadmap in the main README. If you’d like to champion a milestone:

1. Open an issue titled `Roadmap: <feature>`.
2. Outline scope, dependencies, and intended usage.
3. Coordinate in the issue thread or project board to avoid duplication.

Let’s keep Famo OS evolving as the best open agentic launchpad on the net. 🚀

