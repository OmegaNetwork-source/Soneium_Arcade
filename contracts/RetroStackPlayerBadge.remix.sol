// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Remix: paste this whole file. Compile 0.8.20+. Deploy on Soneium (1868).
 * Constructor arg: full HTTPS URL to metadata.json, e.g.
 * https://soneium-arcade.vercel.app/badge/metadata.json
 *
 * OpenZeppelin imports via GitHub (Remix-friendly).
 */
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/Ownable.sol";

contract RetroStackPlayerBadge is ERC721, Ownable {
    uint256 public constant MINT_PRICE = 0.0005 ether;
    uint256 private _nextTokenId;

    error NonTransferable();
    error AlreadyMinted();
    error InsufficientPayment();

    /// @dev `string` cannot be `immutable` in Solidity — stored once in constructor.
    string private _badgeTokenUri;

    constructor(string memory badgeTokenUri_) ERC721("Retro Stack Player Badge", "RSPLAYER") Ownable(msg.sender) {
        _badgeTokenUri = badgeTokenUri_;
    }

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

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }
}
