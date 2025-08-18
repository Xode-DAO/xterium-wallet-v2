# README – How to Generate Polkadot Types for Xode

This guide explains how to generate and use custom type definitions for the **Xode Blockchain** inside the **xterium-mobile-v2** project.

---

## 1. Setup Scripts in `package.json`

Add the following scripts to your `package.json`:

```json
"scripts": {
  "xode-build": "npm run xode-generate:defs && npm run xode-generate:meta",
  "xode-generate:defs": "ts-node --skip-project node_modules/.bin/polkadot-types-from-defs --package xterium-mobile-v2/interfaces --input ./src/chains/xode-polkadot/interfaces --endpoint wss://polkadot-rpcnode.xode.net",
  "xode-generate:meta": "ts-node --skip-project node_modules/.bin/polkadot-types-from-chain --package xterium-mobile-v2/interfaces --endpoint wss://polkadot-rpcnode.xode.net --output ./src/chains/xode-polkadot/interfaces",
  "xode-lint": "tsc --noEmit --pretty"
}
```

Make sure these packages are installed (matching versions):

```bash
npm install @polkadot/api@^16.4.4 @polkadot/api-derive@^16.4.4 @polkadot/typegen@^16.4.4 @polkadot/types@^16.4.4 @polkadot/types-codec@^16.4.4
```

### 📦 What these packages do:

- `@polkadot/api` – Core API for interacting with Substrate/Polkadot chains.
- `@polkadot/api-derive` – Derived queries (higher-level API helpers built on top of storage queries).
- `@polkadot/typegen` – Type generation tools (used by our defs and meta scripts).
- `@polkadot/types` – Core type definitions for Substrate runtime and metadata.
- `@polkadot/types-codec` – Codec library for encoding/decoding chain data structures.

### 🌐 Multi-chain support

You can define multiple endpoints (e.g., Polkadot, Kusama, Xode, custom parachains) by creating separate definition.ts and running xode-generate:* with different inputs/outputs.
This setup is flexible and works for any Substrate-based chain.

## 2. Create `definition.ts` (Optional)

If you have **custom types** in the Xode blockchain, create:

```bash
src/chains/xode-polkadot/interfaces/definition.ts
```

with:

```ts
export default {
  types: { }
}
```

> This file is optional. Use it only when you need to declare custom chain types that are not in the runtime metadata.

## 3. Generate Types

Run:

```bash
npm run xode-build
```

What this does:
- `xode-generate:defs` reads your local `definition.ts` (if any) and prepares type defs for the package.
- `xode-generate:meta` connects to `wss://polkadot-rpcnode.xode.net`, fetches the chain metadata, and generates augmented TS files.

Outputs are written to:

```bash
./src/chains/xode-polkadot/interfaces
```

## 4. Generated Files

You should see these files:

- `augment-api-const.ts`
- `augment-api-errors.ts`
- `augment-api-events.ts`
- `augment-api-query.ts`
- `augment-api-rpc.ts`
- `augment-api-runtime.ts`
- `augment-api-tx.ts`
- `augment-api.ts`
- `augment-types.ts`
- `index.ts`
- `lookup.ts`
- `registry.ts`
- `types-lookup.ts`
- `types.ts`

**Where things live:**
- **Custom type declarations** (yours): `definition.ts` (optional; your overrides live here).
- **Chain-derived types** (from metadata): primarily `types.ts` and `lookup.ts`.
- **Lookup types for IntelliSense**: `types-lookup.ts` (import this for `types` in `ApiPromise`).
- **Augment files** (`augment-*`): extend Polkadot API surfaces so TypeScript understands queries, constants, extrinsics, etc.

## 5. Empty Definitions Fix

If `definition.ts` is empty, **`index.ts` and `types.ts` may error**. Quick fix:

In `types.ts`, ensure it contains:

```ts
export default { }
```

## 6. Import Errors (Version Compatibility)

If you see missing-import errors after generation (common when using the latest @polkadot/* versions), just add the missing imports manually in these files:

- `augment-api-const.ts`
- `augment-api-events.ts`
- `augment-api-query.ts`
- `augment-api-tx.ts`

> These are harmless compatibility nits—fix once and commit.

## 7. Lookup Types Fix
Sometimes, the generated types may be missing certain Polkadot lookup types, which can cause TypeScript errors.
Instead of modifying generated files or node_modules, you can create a temporary fix file, for example:

```ts
// Temporary fix for missing Polkadot lookup types
// Avoids modifying generated files or node_modules

declare module '@polkadot/types/lookup' {
  export type PalletElectionsPhragmenSeatHolder = any;
  export type PalletIdentityRegistration = any;
  export type PalletBagsListListBag = any;
  export type PalletBagsListListNode = any;
  export type FrameSupportPreimagesBounded = any;
  export type PalletDemocracyReferendumInfo = any;
  export type PalletDemocracyReferendumStatus = any;
  export type PalletDemocracyVoteThreshold = any;
  export type PalletSocietyBid = any;
  export type PalletSocietyBidKind = any;
  export type PalletSocietyVote = any;
  export type PalletSocietyVouchingStatus = any;
  export type PalletStakingEraRewardPoints = any;
  export type PalletStakingRewardDestination = any;
  export type PalletStakingStakingLedger = any;
  export type PalletStakingValidatorPrefs = any;
  export type SpStakingExposure = any;
  export type SpStakingExposurePage = any;
  export type SpStakingPagedExposureMetadata = any;
  export type PalletBountiesBounty = any;
}
```

After adding this file, TypeScript will stop complaining about missing lookup types, and your IntelliSense will work correctly without touching the generated files.

## 8. Usage Example (in a Service)

Import the generated lookup and connect to the Xode RPC node:

```ts
import * as lookup from './../../../../chains/xode-polkadot/interfaces/types-lookup';
import { WsProvider, ApiPromise } from '@polkadot/api';

wsProvider = new WsProvider("wss://polkadot-rpcnode.xode.net");
api = ApiPromise.create({ provider: this.wsProvider, types: lookup });

async getBalances() {
  const api = await this.api;
  console.log((await api.query).toHuman());
}
```

You should now get full **IntelliSense** for chain-specific types. That’s it!
