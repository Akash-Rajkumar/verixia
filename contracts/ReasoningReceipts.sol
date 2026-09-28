// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReasoningReceipts is Ownable {
    error DuplicateReceiptId();
    error OnlyRecorder();
    error InvalidAddress();
    error InvalidDecisionCode();
    error InvalidReceiptId();
    error InvalidReasoningHash();
    error ReceiptNotFound();

    struct Receipt {
        bytes32 receiptId;
        address agent;
        address counterparty;
        uint256 amount;
        uint8 decision;
        bytes32 reasoningHash;
        string summary;
        bool exists;
    }

    mapping(bytes32 => Receipt) private receipts;
    mapping(address => bool) private recorders;

    event ReceiptRecorded(
        bytes32 indexed receiptId,
        address indexed agent,
        address indexed counterparty,
        uint256 amount,
        uint8 decision,
        bytes32 reasoningHash,
        string summary
    );

    event RecorderStatusSet(
        address indexed recorder,
        bool allowed
    );

    constructor(address owner_) {
        _transferOwnership(owner_);
    }

    function setRecorder(address recorder, bool allowed) external onlyOwner {
        if (recorder == address(0)) revert InvalidAddress();
        recorders[recorder] = allowed;
        emit RecorderStatusSet(recorder, allowed);
    }

    function getRecorderStatus(address recorder) external view returns (bool) {
        return recorders[recorder];
    }

    function recordReceipt(
        bytes32 receiptId,
        address agent,
        address counterparty,
        uint256 amount,
        uint8 decision,
        bytes32 reasoningHash,
        string memory summary
    ) external {
        if (!recorders[msg.sender]) revert OnlyRecorder();
        if (receiptId == bytes32(0)) revert InvalidReceiptId();
        if (receipts[receiptId].exists) revert DuplicateReceiptId();
        if (reasoningHash == bytes32(0)) revert InvalidReasoningHash();
        if (decision > 2) revert InvalidDecisionCode();
        if (agent == address(0)) revert InvalidAddress();

        receipts[receiptId] = Receipt({
            receiptId: receiptId,
            agent: agent,
            counterparty: counterparty,
            amount: amount,
            decision: decision,
            reasoningHash: reasoningHash,
            summary: summary,
            exists: true
        });

        emit ReceiptRecorded(
            receiptId,
            agent,
            counterparty,
            amount,
            decision,
            reasoningHash,
            summary
        );
    }

    function getReceipt(bytes32 receiptId) external view returns (Receipt memory) {
        if (!receipts[receiptId].exists) revert ReceiptNotFound();
        return receipts[receiptId];
    }

    function getReceiptHash(bytes32 receiptId) external view returns (bytes32) {
        if (!receipts[receiptId].exists) revert ReceiptNotFound();
        return receipts[receiptId].reasoningHash;
    }
}
