# create-cached-fn

Utility to run promise in daemon mode and save cache in file.

To install package:

```bash
npm install create-cached-fn
```

Usage

```javascript
import createCachedFn from 'create-cached-fn';

createCachedFn(
  async () => [1, 2, 3],
  './test.json'
  true,
)
```

## Docs

- `promiseFunc` - function to execute
- `cachePath` - path to save result
- `alwaysRunPromise?` - run the promise at startup or skip waiting

## Deploy

To install dependencies:

```bash
npm install
```

To build:

```bash
npm build
```

This project was created using `bun init` in bun v1.1.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
