# Deploy Retro Stack Player Badge (mint contract)

Your NFT image is served from the site as **`/badge/badge.png`** (file: `badge/badge.png`).  
Metadata JSON must be **publicly reachable via HTTPS** so the contract’s `tokenURI` works in wallets.

---

## 1. Host `badge/` on your live domain first

After deploy, these URLs must work (replace with your real domain):

| File | Example URL |
|------|-------------|
| Image | `https://YOUR_DOMAIN/badge/badge.png` |
| Metadata | `https://YOUR_DOMAIN/badge/metadata.json` |

Update **`badge/metadata.json`** → set `"image"` to the **full URL** of `badge.png` (already set for `soneium-arcade.vercel.app`; change if you use another domain).

**Constructor argument** = metadata URL string, e.g.:

```text
https://soneium-arcade.vercel.app/badge/metadata.json
```

---

## 2. Contract code (same as `RetroStackPlayerBadge.sol`)

Deploy **`contracts/RetroStackPlayerBadge.sol`**. It needs **OpenZeppelin Contracts v5**.

### Option A — Remix (no local install)

1. Open [Remix](https://remix.ethereum.org).
2. Create file `RetroStackPlayerBadge.sol` and paste the contents of `contracts/RetroStackPlayerBadge.sol` from this repo.
3. **Compiler** → version `0.8.20+`.
4. **Solidity compiler** → enable **Auto compile** (or Compile).
5. If imports fail, use Remix **GitHub** imports: replace the first lines with Remix-friendly imports, e.g.:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/Ownable.sol";

// ... rest of contract unchanged (from RetroStackPlayerBadge.sol)
```

6. **Deploy & Run** → Environment: **Injected Provider** (MetaMask on **Soneium**, chain ID **1868**).
7. **Constructor arguments**: one string — your **`metadata.json` full URL** (see above).
8. Deploy → copy **contract address** → paste into **`js/retro-stack-badge.js`** → `contractAddress`.

### Option B — Local (npm + solc / Hardhat / Foundry)

```bash
cd contracts
npm install
# then use your usual tool; imports are @openzeppelin/contracts v5
```

`package.json` in `contracts/` lists `@openzeppelin/contracts`.

---

## 3. After deploy

1. **Mint #1** (optional but good for explorers): call **`mint`** and send **0.0005 ETH** value (Soneium native).
2. Set **`js/retro-stack-badge.js`** → `contractAddress: "0xYourDeployedAddress"`.
3. Redeploy / push the static site so the hub mint + gating use the new address.

---

## 4. Quick reference

| Item | Value |
|------|--------|
| Network | **Soneium** — Chain ID **1868** |
| Mint price | **0.0005 ETH** (`msg.value`) |
| Name / symbol | Retro Stack Player Badge / **RSPLAYER** |

---

## 5. Full Solidity source

See **`RetroStackPlayerBadge.sol`** in this folder — that is the canonical deployable file.
