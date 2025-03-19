# Running Web Forms Via Docker

Running web-forms locally requires two things:
- As of 05/03/2025, web-forms requires the compiled WASM bundle for the `tree-sitter` package.
  - Building this requires emscripten or docker installed on your machine, see [issue #41](https://github.com/getodk/web-forms/issues/41).
- The xlsform-online service running on a local port.

A simple alternative to building and configuring these manually is to run web-forms via docker.

## Building The Images

```bash
docker compose -f contrib/containers/compose.yaml build
```

## Running Web Forms

```bash
docker compose -f contrib/containers/compose.yaml up -d
```

Access web forms preview on: http://localhost:3221
