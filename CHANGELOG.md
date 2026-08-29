# Changelog for micro-sol-signer

## Unreleased (2026-08-27)

- **May 2026 self-audit** (all files): hardened parsing, validation and network (RPC) code
- Improved error messages and type checks
- Added massive amounts of documentation everywhere
- Updated dependencies and build tooling: jsbt v0.6, TypeScript 6 compatibility

## 0.8.2 (2025-09-18)

- Add back export maps for text editor autocompletion

## 0.8.1 (2025-08-25)

- Upgrade to noble v2 release

## 0.8.0 (2025-08-20)

- The package is now ESM-only. ESM modules can finally be loaded from common.js on node v20.19+
  - Reduces NPM traffic consumed (packed package size) from 370.9 KB to 224.9 KB
  - Reduces on-disk size (unpacked NPM package size) from 5.8 MB to 3.2 MB
- Upgrade deps to noble v2 beta

## 0.7.0 (2025-05-24)

- Eliminate double parsing Transaction.decode #20
- Change some types from bigint to number #21
- Add message signing #22
- Simplify PROGRAMS registry by @mahnunchik in #29
- General improvements #25

## 0.6.0 (2025-04-24)

- Massive rewrite! Add support for [Token2022](https://spl.solana.com/token-2022) and [Codama IDL](https://github.com/codama-idl/codama)
- Update deps
- Standalone build files are now attested in CI. Check out README for verification guide
- Typescript source can now be used without compilation in node.js v24, due to [erasableSyntaxOnly](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/#the---erasablesyntaxonly-option)
- A few api improvements and bugfixes contributed by @mahnunchik in:
  - https://github.com/paulmillr/micro-sol-signer/pull/16
  - https://github.com/paulmillr/micro-sol-signer/pull/17
  - https://github.com/paulmillr/micro-sol-signer/pull/18
  - https://github.com/paulmillr/micro-sol-signer/pull/23

## 0.5.0 (2025-01-19)

- Update micro-packed to v0.7
- Improve typescript types
- Publish to JSR.io

## 0.4.2 (2024-05-17)

- Upgrade micro-packed to v0.6
- Add missing methods to Method Summary on README.md by @miguilimzero in https://github.com/paulmillr/micro-sol-signer/pull/10

### New Contributors

- @miguilimzero made their first contribution in https://github.com/paulmillr/micro-sol-signer/pull/10

## 0.4.1 (2024-03-06)

- Update micro-packed to 0.5
- Harden typescript compilation config

## 0.4.0 (2023-12-23)

Make package hybrid common.js-ESM.

## 0.3.0 (2023-05-23)

- Address and public key helpers by @mahnunchik in https://github.com/paulmillr/micro-sol-signer/pull/5
- Multiple private key formats by @mahnunchik in https://github.com/paulmillr/micro-sol-signer/pull/9

### New Contributors

- @mahnunchik made their first contribution in https://github.com/paulmillr/micro-sol-signer/pull/5

## 0.2.2 (2023-05-12)

NPM auto-publish from GitHub CI

## 0.2.1 (2023-04-12)

Update noble-curves

## 0.2.0 (2023-03-16)

Switch from noble-ed25519 to noble-curves

## 0.1.3 (2022-08-27)

Dep update

## 0.1.2 (2022-08-05)

- Documentation improvements

## 0.1.1 (2022-07-22)

ESM fixes

## 0.1.0 (2022-07-10)

Initial release
