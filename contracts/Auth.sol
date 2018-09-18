pragma solidity ^0.4.23;

import "../../rayonprotocol-contract-common/contracts/RayonBase.sol";
import "./KycAttester.sol";

contract Auth is RayonBase {
    struct AuthEntry{
        uint256 index;
        address userId;
        bytes32 authHash;
        address attesterId;
        uint256 registerTime;
    }
    mapping(address => AuthEntry) internal userAuthMap;
    address[] internal userAuthList;
    address internal kycAttesterContractAddress;

    // constructor
    constructor(uint16 version) RayonBase("Auth", version) public {}

    // Event defination
    event LogAuthAdded(address indexed userId);

    function toBytes(address a) public view returns (bytes b){
        assembly {
                let m := mload(0x40)
                mstore(add(m, 20), xor(0x140000000000000000000000000000000000000000, a))
                mstore(0x40, add(m, 52))
                b := m
        }
    }


    // Functions
    function _verify(address _prefixAddress, bytes32 _dataHash, address _signedAddress, uint8 _v, bytes32 _r, bytes32 _s) view private returns (bool) {
        bytes memory addressPrefixedData = abi.encodePacked(toBytes(_prefixAddress), _dataHash);
        bytes32 addressPrefixedDataHash = keccak256(addressPrefixedData);
        address verifiedAddress = ecrecover(addressPrefixedDataHash, _v, _r, _s);

        return verifiedAddress == _signedAddress;
    }

    function add(bytes32 _authHash, address _attesterId, uint8 _v, bytes32 _r, bytes32 _s) public {
        address userId = msg.sender;
        AuthEntry storage entry = userAuthMap[userId];
        require(!_contains(entry), "the user should not be registered");
        
        KycAttester kycAttesterContract = KycAttester(kycAttesterContractAddress);
        require(kycAttesterContract.contains(_attesterId), "the kyc attester should be registered");

        require(_verify(userId, _authHash, _attesterId, _v, _r, _s), "signature must be verified");

        entry.userId = userId;
        entry.authHash = _authHash;
        entry.attesterId = _attesterId;
        entry.registerTime = now;
        entry.index = userAuthList.push(userId) - 1;
        emit LogAuthAdded(userId);
    }

    function getUserAuth(address _userId) public view returns (address, bytes32, address, uint256) {
        AuthEntry storage entry = userAuthMap[_userId];
        require(_contains(entry), "user must be present in map");

        return (entry.userId, entry.authHash, entry.attesterId, entry.registerTime);
    }

    function getUserAuthByIndex(uint _index) public view onlyOwner returns (address, bytes32, address, uint256) {
        require(_isInRange(_index), "index must be in range");

        address userId = userAuthList[_index];
        return getUserAuth(userId);
    }

    function getUserIds() public view onlyOwner returns (address[]) {
        return userAuthList;
    }

    function contains(address _userId) public view returns (bool) {
        AuthEntry storage entry = userAuthMap[_userId];
        return _contains(entry);
    }

    function size() public view onlyOwner returns (uint) {
        return userAuthList.length;
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < userAuthList.length);
    }

    function _contains(AuthEntry memory _entry) private pure returns (bool){
        return _entry.userId != address(0);
    }

    function setKycAttesterContractAddress(address _contractAddress) public onlyOwner {
        kycAttesterContractAddress = _contractAddress;
    }

    function getKycAttesterContractAddress() public view onlyOwner returns (address) {
        return kycAttesterContractAddress;
    }
}