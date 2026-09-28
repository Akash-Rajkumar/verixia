// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SpendingCharter is Ownable, ReentrancyGuard {
    uint256 public constant WINDOW_DURATION = 24 hours;

    uint8 public constant OK = 0;
    uint8 public constant EXCEEDS_MAX_PER_TX = 1;
    uint8 public constant EXCEEDS_DAILY_CAP = 2;
    uint8 public constant COUNTERPARTY_DENIED = 3;
    uint8 public constant COUNTERPARTY_NOT_ALLOWED = 4;
    uint8 public constant REQUIRES_HUMAN_APPROVAL = 5;
    uint8 public constant INSUFFICIENT_BALANCE = 6;

    error OnlyAgent();
    error InvalidAgent();
    error InvalidCounterpartyStatus();

    event PaymentExecuted(
        bytes32 indexed receiptId,
        address indexed to,
        uint256 amount,
        uint256 spentInWindow
    );

    event PaymentBlocked(
        bytes32 indexed receiptId,
        address indexed to,
        uint256 amount,
        uint8 reasonCode
    );

    event RulesUpdated(
        uint256 maxPerTx,
        uint256 dailyCap,
        uint256 humanApprovalThreshold,
        bool allowListEnabled
    );

    event CounterpartyStatusSet(address indexed counterparty, uint8 status);

    struct Rules {
        uint256 maxPerTx;
        uint256 dailyCap;
        uint256 humanApprovalThreshold;
        bool allowListEnabled;
    }

    struct SpendingWindow {
        uint256 windowStart;
        uint256 spentInWindow;
    }

    address public agent;
    Rules private rules;
    SpendingWindow private spendingWindow;
    mapping(address counterparty => uint8 status) private counterpartyStatus;
    mapping(address counterparty => bool configured) private counterpartyConfigured;

    modifier onlyAgent() {
        if (msg.sender != agent) revert OnlyAgent();
        _;
    }

    constructor(address owner_, address agent_) {
        _transferOwnership(owner_);
        if (agent_ == address(0)) revert InvalidAgent();
        agent = agent_;
    }

    function setRules(
        uint256 maxPerTx,
        uint256 dailyCap,
        uint256 humanApprovalThreshold,
        bool allowListEnabled
    ) external onlyOwner {
        rules = Rules({
            maxPerTx: maxPerTx,
            dailyCap: dailyCap,
            humanApprovalThreshold: humanApprovalThreshold,
            allowListEnabled: allowListEnabled
        });

        emit RulesUpdated(maxPerTx, dailyCap, humanApprovalThreshold, allowListEnabled);
    }

    function setCounterpartyStatus(address counterparty, uint8 status) external onlyOwner {
        if (status > 1) revert InvalidCounterpartyStatus();
        counterpartyStatus[counterparty] = status;
        counterpartyConfigured[counterparty] = true;
        emit CounterpartyStatusSet(counterparty, status);
    }

    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert InvalidAgent();
        agent = newAgent;
    }

    function fund() external payable {}

    receive() external payable {}

    function getRules()
        external
        view
        returns (
            uint256 maxPerTx,
            uint256 dailyCap,
            uint256 humanApprovalThreshold,
            bool allowListEnabled
        )
    {
        Rules memory currentRules = rules;
        return (
            currentRules.maxPerTx,
            currentRules.dailyCap,
            currentRules.humanApprovalThreshold,
            currentRules.allowListEnabled
        );
    }

    function getStatus()
        external
        view
        returns (
            uint256 windowStart,
            uint256 spentInWindow,
            uint256 remainingInWindow,
            uint256 balance
        )
    {
        (, uint256 effectiveSpent) = _effectiveWindow();
        uint256 remaining = rules.dailyCap > effectiveSpent
            ? rules.dailyCap - effectiveSpent
            : 0;
        return (_effectiveWindowStart(), effectiveSpent, remaining, address(this).balance);
    }

    function getCounterpartyStatus(address counterparty) external view returns (uint8) {
        return counterpartyStatus[counterparty];
    }

    function checkPayment(address to, uint256 amount)
        external
        view
        returns (bool ok, uint8 reasonCode)
    {
        return _checkPayment(to, amount);
    }

    function getDailySpent() external view returns (uint256) {
        (, uint256 effectiveSpent) = _effectiveWindow();
        return effectiveSpent;
    }

    function getDailyRemaining() external view returns (uint256) {
        (, uint256 effectiveSpent) = _effectiveWindow();
        return rules.dailyCap > effectiveSpent ? rules.dailyCap - effectiveSpent : 0;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function attemptPayment(address payable to, uint256 amount, bytes32 receiptId)
        external
        onlyAgent
        nonReentrant
        returns (bool executed, uint8 reasonCode)
    {
        (bool allowed, uint8 reason) = _checkPayment(to, amount);
        if (!allowed) {
            emit PaymentBlocked(receiptId, to, amount, reason);
            return (false, reason);
        }

        (uint256 effectiveStart, uint256 effectiveSpent) = _effectiveWindow();
        if (effectiveStart == 0) {
            spendingWindow.windowStart = block.timestamp;
            effectiveSpent = 0;
        }
        spendingWindow.spentInWindow = effectiveSpent + amount;

        (bool sent,) = to.call{value: amount}("");
        require(sent, "SpendingCharter: transfer failed");

        emit PaymentExecuted(receiptId, to, amount, spendingWindow.spentInWindow);
        return (true, OK);
    }

    function _checkPayment(address to, uint256 amount)
        internal
        view
        returns (bool ok, uint8 reasonCode)
    {
        uint8 status = counterpartyStatus[to];
        if (status == 1) return (false, COUNTERPARTY_DENIED);
        if (rules.allowListEnabled && !counterpartyConfigured[to]) {
            return (false, COUNTERPARTY_NOT_ALLOWED);
        }
        if (amount > rules.maxPerTx) return (false, EXCEEDS_MAX_PER_TX);

        (, uint256 effectiveSpent) = _effectiveWindow();
        if (effectiveSpent > rules.dailyCap || amount > rules.dailyCap - effectiveSpent) {
            return (false, EXCEEDS_DAILY_CAP);
        }

        if (amount > rules.humanApprovalThreshold) {
            return (false, REQUIRES_HUMAN_APPROVAL);
        }

        if (amount > address(this).balance) return (false, INSUFFICIENT_BALANCE);
        return (true, OK);
    }

    function _effectiveWindow() internal view returns (uint256 effectiveStart, uint256 effectiveSpent) {
        effectiveStart = spendingWindow.windowStart;
        effectiveSpent = spendingWindow.spentInWindow;

        if (effectiveStart == 0 || block.timestamp - effectiveStart >= WINDOW_DURATION) {
            return (0, 0);
        }
    }

    function _effectiveWindowStart() internal view returns (uint256) {
        (uint256 effectiveStart,) = _effectiveWindow();
        return effectiveStart;
    }
}