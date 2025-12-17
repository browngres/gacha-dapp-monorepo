// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {ERC721} from "solady/src/tokens/ERC721.sol";
import {LibString} from "solady/src/utils/LibString.sol";
import {Ownable} from "solady/src/auth/Ownable.sol";

contract GachaCardNFT is ERC721, Ownable {
    string private _name;
    string private _symbol;
    string private _baseURI;
    string private _contractURI;

    using LibString for uint256;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function baseURI() internal view returns (string memory) {
        return _baseURI;
    }

    /// @dev 最好不要超过 32 字节
    function setBaseURI(string memory baseURI_) public onlyOwner {
        _baseURI = baseURI_;
    }

    /// @dev 最好不要超过 32 字节
    function setContractURI(string memory contractURI_) public onlyOwner {
        _contractURI = contractURI_;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        return string.concat(baseURI(), id.toString());
    }

    /// @notice 读取 NFT 稀有度
    function getRarity(uint256 id) public view returns (uint8 rarity) {
        return uint8(_getExtraData(id));
    }

    /// @dev 只能由 owner 指定稀有度 Mint。
    function mint(address to, uint256 id, uint8 rarity) external onlyOwner {
        _setExtraData(id, rarity);
        _safeMint(to, id);
    }
}
