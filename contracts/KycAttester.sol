pragma solidity ^0.4.23;

import "../../rayonprotocol-contract-common/contracts/RayonBase.sol";

contract KycAttester is RayonBase {
    struct AttesterEntry{
        uint256 index;
        address attesterId;
        string name;
        bool active;
        uint256 updatedTime;
    }
    mapping(address => AttesterEntry) internal attesterMap;
    address[] internal attesterList;

    // constructor
    constructor(uint16 version) RayonBase("KycAttester", version) public {}

    // Event defination
    event LogKycAttesterAdded(address indexed attesterId);
    event LogKycAttesterActivated(address indexed attesterId);
    event LogKycAttesterInactivated(address indexed attesterId);

    // Functions
    function add(address _attesterId, string _name) public onlyOwner {
        AttesterEntry storage entry = attesterMap[_attesterId];
        require(!_contains(entry), "the attester should not be registered");

        entry.attesterId = _attesterId;
        entry.name = _name;
        entry.active = true;
        entry.updatedTime = now;
        entry.index = attesterList.push(_attesterId) - 1;

        emit LogKycAttesterAdded(_attesterId);
    }

    function activate(address _attesterId, bool _isActive) public onlyOwner{
        AttesterEntry storage entry = attesterMap[_attesterId];
        require(_contains(entry), "attester must be present in map");

        if(!entry.active == _isActive){ // activate will be changed
            entry.active = _isActive;
            if(_isActive){
                emit LogKycAttesterActivated(_attesterId);
            } else{
                emit LogKycAttesterInactivated(_attesterId);
            }
        }
    }

    function getAttesterInfo(address _attesterId) public view returns (address, string, bool, uint256){
        AttesterEntry storage entry = attesterMap[_attesterId];
        require(_contains(entry), "attester must be present in map");

        return (entry.attesterId, entry.name, entry.active, entry.updatedTime);
    }

    function getAttesterInfoByIndex(uint256 _index) public view onlyOwner returns (address, string, bool, uint256){
        require(_isInRange(_index), "index must be in range");

        address attesterId = attesterList[_index];
        return getAttesterInfo(attesterId);
    }

    function getAttesterIds() public view onlyOwner returns (address[]){
        return attesterList;
    }

    function contains(address _attesterId) public view returns (bool) {
        AttesterEntry storage entry = attesterMap[_attesterId];
        return _contains(entry);
    }

    function size() public view onlyOwner returns (uint) {
        return attesterList.length;
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < attesterList.length);
    }

    function _contains(AttesterEntry memory _entry) private pure returns (bool){
        return _entry.attesterId != address(0);
    }
}