# Sax Erc1404 token
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
