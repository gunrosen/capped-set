// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.19;

    error AddressIsZero();
    error ValueIsZero();
    error ExceedMaxNumberElements();
    error AddressNotExists(address);
    error AddressAlreadyExists(address);

contract CappedSet {
    struct ArrayItem {
        address addr;
        uint256 value;
    }

    struct MappingItem {
        uint256 value;
        uint256 arrayIndex;
    }

    // maximum number of elements that can be in the capped-set
    uint256 public numElements;

    mapping(address => MappingItem) private _mappingData;
    ArrayItem[] private _arrayData;

    address public lowestAddress;
    uint256 public lowestValue;

    constructor(uint256 _size){
        if (_size == 0) revert ValueIsZero();
        numElements = _size;
    }

    modifier onlyValidInput(address addr, uint256 value) {
        if (addr == address(0)) {
            revert AddressIsZero();
        }
        if (value == 0) {
            revert ValueIsZero();
        }
        _;
    }


    function insert(
        address addr,
        uint256 value
    )
    external onlyValidInput(addr, value)
    returns (address, uint256)
    {
        if (_mappingData[addr].value != 0) {
            revert AddressAlreadyExists(addr);
        }
        if (_arrayData.length == numElements) {
            revert ExceedMaxNumberElements();
        }
        _arrayData.push(ArrayItem(addr, value));
        _mappingData[addr].value = value;
        _mappingData[addr].arrayIndex = _arrayData.length - 1;

        if (_arrayData.length == 1) {
            lowestValue = value;
            lowestAddress = addr;
            return (address(0), 0);
        }
        if (value < lowestValue) {
            lowestValue = value;
            lowestAddress = addr;
        }
        return (lowestAddress, lowestValue);
    }

    function update(
        address addr,
        uint256 newVal
    )
    external onlyValidInput(addr, newVal)
    returns (address, uint256)
    {
        if (_mappingData[addr].value == 0) {
            revert AddressNotExists(addr);
        }
        if (_mappingData[addr].value != newVal) {
            _mappingData[addr].value = newVal;
            _arrayData[_mappingData[addr].arrayIndex].value = newVal;
            if (newVal < lowestValue) {
                lowestValue = newVal;
                lowestAddress = addr;
            }
        }

        return (lowestAddress, lowestValue);
    }

    function remove(address addr)
    external
    returns (address, uint256)
    {
        if (_mappingData[addr].value == 0) {
            revert AddressNotExists(addr);
        }
        // Swap removed item to latest item in _arrayData. Then _arrayData.pop()
        uint256 removedIndex = _mappingData[addr].arrayIndex;
        ArrayItem memory latestItem = _arrayData[_arrayData.length - 1];
        _arrayData[removedIndex] = latestItem;
        _arrayData.pop();

        delete _mappingData[addr];
        _mappingData[latestItem.addr].arrayIndex = removedIndex;

        if (addr == lowestAddress) {
            // In case of removing exactly lowest address, update lowestValue and lowestAddress
            address tempLowestAddress = getLowestValueArrayIndex();
            lowestAddress = tempLowestAddress;
            lowestValue = _mappingData[lowestAddress].value;
        }
        return (lowestAddress, lowestValue);
    }

    function getValue(address addr)
    external
    view
    returns (uint256)
    {
        return _mappingData[addr].value;
    }

    function getLength()
    external
    view
    returns (uint256)
    {
        return _arrayData.length;
    }

    function getLowestValueArrayIndex() view internal returns (address) {
        uint256 length = _arrayData.length;
        if (length == 1) {
            return _arrayData[0].addr;
        }
        uint256 tempLowest = _arrayData[0].value;
        address tempLowestAddress = _arrayData[0].addr;
        for (uint256 i = 0; i < length;) {
            if (_arrayData[i].value < tempLowest) {
                tempLowest = _arrayData[i].value;
                tempLowestAddress = _arrayData[i].addr;
            }
            ++i;
        }
        return tempLowestAddress;
    }
}
