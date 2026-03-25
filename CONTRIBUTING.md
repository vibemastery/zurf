# Contributing

## Setup

- Node.js 18+
- [pnpm](https://pnpm.io/) 10.x

```sh
pnpm install
pnpm run build
pnpm run test
```

`pnpm run test` builds the `dist/` output first, then runs Mocha against TypeScript sources via ts-node.

## Lint

```sh
pnpm run lint
```

## Local CLI (development)

```sh
node bin/dev.js --help
```
