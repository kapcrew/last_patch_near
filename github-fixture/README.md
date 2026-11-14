# Bridge of Dependencies — real GitHub issue/PR fixture

A reproducible small routing regression for the first live quest in THE LAST PATCH.

1. `npm test` on the baseline fails: the route key uses `=>` instead of `->`.
2. Publish this folder in a separate public, authorized GitHub repository.
3. Create issue #1: **Broken bridge routing due to key delimiter regression**. Acceptance: `getCrossing('harbor','bridge')` is passable and both tests pass.
4. Worker forks/branches, fixes `router.mjs` and opens PR referencing `Fixes #1`.
5. Maintainer reviews and merges only once CI is green.
6. The exact repository, issue and PR URLs must be used in the on-chain bounty. Without public URLs evidence is NOT VERIFIED.

This is a deliberately small contest fixture, not evidence of a third-party contribution.
