# Retro Stack Player Badge (deploy)

## Requirements

- **Solidity / OpenZeppelin**: This contract imports `@openzeppelin/contracts` **v5.x** (`ERC721`, `Ownable`).
- **Deploy on Soneium** (Chain ID `1868`) so it matches the hub + games.

### Install OpenZeppelin (for Hardhat / Foundry / local)

```bash
cd contracts
npm init -y
npm install @openzeppelin/contracts@5
```

Point your compiler’s import remapping to `node_modules` (e.g. Foundry: `forge remappings`).

### Remix

1. Create file `RetroStackPlayerBadge.sol`.
2. Use Remix **GitHub** import for OpenZeppelin 5, or paste dependencies via the OpenZeppelin Wizard export.

## Constructor argument

- `badgeTokenUri_` — **full URL** to `metadata.json` after you host the site, e.g.  
  `https://YOUR_DOMAIN/badge/metadata.json`

Update `badge/metadata.json` and set the `image` field to the **full URL** of `badge/badge.svg`.

## After deploy

1. **First NFT**: Call `mint()` once from any wallet with the **native amount required by the contract** so tokenId `1` exists (optional but helps explorers/marketplaces show supply).
2. Copy the **contract address** into `js/retro-stack-badge.js` as `contractAddress`.
3. Rebuild / redeploy the static site so gating uses the live address.

## Withdraw

`withdraw()` sends the contract balance to the **owner** (deployer).
