# Retro Stack Player Badge — portal / listing answers

Fill in **contract address** after deployment. Replace metadata image URL if your production domain differs from below.

---

### NFT name (to display on portal)

**Retro Stack Player Badge**

---

### NFT image (to display on portal)

- **On-site file:** `badge/badge.svg`  
- **Full URL (update if you use a custom domain):**  
  `https://soneium-arcade.vercel.app/badge/badge.svg`

The ERC-721 `tokenURI` should point to metadata JSON; that JSON’s `image` field should use the **full HTTPS URL** of the artwork so wallets and portals can load it.

---

### NFT contract address

**Deploy** `contracts/RetroStackPlayerBadge.sol` to **Soneium (chain ID 1868)**, then:

1. Paste the address into `js/retro-stack-badge.js` as `contractAddress`.
2. Put the same address here for your portal:

`___________________________` ← *address after deploy*

---

### Ensure first NFT is minted

After deployment, call **`mint()`** once from any wallet with the **native token value required by the contract** (see `MINT_PRICE` on-chain). The first successful mint creates **token ID `1`**.  
You can use the **Mint** button on the Retro Stack hub (`#player-badge`) or any wallet contract UI.

---

### NFT token type

**ERC-721** (single collection; unlimited supply; **one token per wallet** enforced in the contract.)

---

### Is it an SBT?

**Yes — SBT-style (soulbound).**  
Transfers between wallets are **disabled** in the contract (`_update` reverts when `from` and `to` are both non-zero). Only mint from address `0` and burn to `0` are allowed by that rule.

---

### Transferable / purchasable on 3rd-party marketplaces?

**No.**  
The token **cannot be transferred** to another wallet, so it **cannot** be sold or listed like a typical NFT on secondary markets.

---

### Criteria to acquire NFT / minting link

- **Network:** Soneium (Chain ID **1868**).  
- **Price:** Fixed per mint; amount is defined in the contract (`MINT_PRICE`) and shown in the wallet at confirm time.  
- **Supply:** Unlimited total mints; **one badge per wallet** (cannot mint twice from the same address).  
- **Minting:** Official hub section:  
  **`https://soneium-arcade.vercel.app/#player-badge`**  
  (or your deployed site root + `#player-badge`).  
- **Requirement:** User must connect a wallet on Soneium and confirm the contract mint transaction.

---

### Technical reference (repo)

| Item | Location |
|------|----------|
| Contract source | `contracts/RetroStackPlayerBadge.sol` |
| Deploy notes | `contracts/README_BADGE.md` |
| Hub mint UI + gating config | `index.html`, `js/retro-stack-badge.js` |
| Metadata template | `badge/metadata.json` (set `image` + `external_url` to your domain) |
