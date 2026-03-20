// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RetroStackPlayerBadge
 * @notice Soulbound (non-transferable) ERC-721 access badge for Retro Stack.
 *         Unlimited supply; one mint per wallet; fixed mint price (see MINT_PRICE).
 * @dev Deploy with full HTTPS URI to metadata JSON, e.g. https://yoursite.com/badge/metadata.json
 *      Use OpenZeppelin v5. Install: npm i @openzeppelin/contracts (or Remix + OZ).
 */
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RetroStackPlayerBadge is ERC721, Ownable {
    uint256 public constant MINT_PRICE = 5e14; // wei — match hub `mintPriceWei` in js/retro-stack-badge.js
    uint256 private _nextTokenId;

    error NonTransferable();
    error AlreadyMinted();
    error InsufficientPayment();

    /// @notice Same metadata URI for every token (e.g. ipfs://... or https://.../metadata.json)
    /// @dev `string` cannot be `immutable` in Solidity — use a regular storage string set in constructor.
    string private _badgeTokenUri;

    constructor(string memory badgeTokenUri_) ERC721("Retro Stack Player Badge", "RSPLAYER") Ownable(msg.sender) {
        _badgeTokenUri = badgeTokenUri_;
    }

    /// @notice Payable mint — one badge per address, unlimited total supply.
    function mint() external payable {
        if (balanceOf(msg.sender) > 0) revert AlreadyMinted();
        if (msg.value < MINT_PRICE) revert InsufficientPayment();

        uint256 tokenId = ++_nextTokenId;
        _safeMint(msg.sender, tokenId);

        uint256 refund = msg.value - MINT_PRICE;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
    }

    /// @dev First NFT (tokenId 1) exists after the first successful mint — mint once from deploy wallet or any user.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _badgeTokenUri;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /// @dev Soulbound: only mint (from zero) or burn (to zero) allowed; no transfers between accounts.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }
}
