# Security

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's **Report a vulnerability** button (Security tab), not in public issues. Include the affected app or package, reproduction steps, and the impact.

## Scope

Project 100 apps are mostly static, client-side web apps. Relevant issues include XSS, data leaking between apps (all apps share one origin), exposed secrets, and anything that could expose user data.

## For agents and maintainers

- Never commit secrets. If one is committed, rotate it immediately and notify the owner. Removing it from git history is not enough.
- Treat security and privacy incidents as immediate escalations (see [docs/AI_ROLES.md](docs/AI_ROLES.md#escalation)). An affected app may be taken offline first and formally archived later.
