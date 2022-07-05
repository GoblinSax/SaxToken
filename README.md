# Sax Erc1404 token

### Token Contract
Try running some of the following tasks:
```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
npx hardhat verify --network rinkeby "0x823eb131b7A8bcC8fcA4adc59F0392C8eB412D07" "0xFad747e72a79422fF1ac2853359F4BBB4C4aDCd0"
```

### Vesting Contract
```shell
npx hardhat run scripts/deployVestingWallet.js --network mainnet
npx hardhat clean && npx hardhat verify --network "mainnet" "0xA276BC1af28A524eB62539B71af161ca6999f5db" "0x4170B069C1f2E6b706e23fc51aDAd38d43CD6eE0" "0xf6B6F07862A02C85628B3A9688beae07fEA9C863" "219512000000000000000000" "1656720000" "1688256000" "1751328000"
```

# Contracts Notes

- contract `SaxToken`
    - inherits `ERC1404` (*abstract* contract)
        - inherits `ERC20`
    - inherits `Restrictable`
        - inherits `Ownable`
    - inherits `WhiteListable`
        - inherits `Administratable`
            - inherits `Ownable`

# Testing Notes

- `SaxToken.js`
    contains tests for `SaxToken.sol`, `ERC1404.sol`, `Restrictable.sol`
- `Ownable.js`
    contains tests for `Administratable.sol`, `Ownable.sol`
- `WhiteListable.js`
    contains test `for WhiteListable.sol`
