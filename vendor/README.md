# Reproducible offline TypeScript compiler

`typescript-5.8.3.tgz` is an unmodified local `npm pack` archive of TypeScript 5.8.3 from the authoring toolchain, included solely so `npm ci --offline` can build this project reproducibly despite a blocked npm registry. TypeScript is distributed under the Apache License 2.0 license, included inside the tarball. Its npm package is not original THE LAST PATCH project code.

Upgrade by fetching a verified new release and regenerating `package-lock.json`; never accept a random CDN tarball for release.
