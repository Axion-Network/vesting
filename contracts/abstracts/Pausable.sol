// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "./Manageable.sol";
import "./Migrateable.sol";

abstract contract Pausable is Manageable, Migrateable {
    event SetPaused(bool paused);

    modifier pausable() {
        require(
            paused == false || hasRole(MIGRATOR_ROLE, msg.sender),
            'Function is paused'
        );
        _;
    }

    bool internal paused;

    function setPaused(bool _paused) external {
        require(
            hasRole(MIGRATOR_ROLE, msg.sender) ||
                hasRole(MANAGER_ROLE, msg.sender),
            'Caller must be manager or migrator'
        );

        paused = _paused;
        emit SetPaused(_paused);
    }

    function getPaused() external view returns (bool) {
        return paused;
    }
} 