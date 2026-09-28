// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ReputationRegistry is ReentrancyGuard {
    uint8 private constant ACTIVE = 0;
    uint8 private constant DISPUTED = 1;
    uint8 private constant UPHELD = 2;
    uint8 private constant SLASHED = 3;

    error AlreadyRegistered();
    error InvalidAgent();
    error InvalidSubject();
    error StakingNotEnabled();
    error FeedbackNotFound();
    error StakeBelowMinimum();
    error InvalidFeedbackStatus();
    error IncorrectDisputeBond();
    error NativeTransferFailed();

    event AgentRegistered(address indexed agent, string metadataURI);

    event FeedbackSubmitted(
        uint256 indexed feedbackId,
        address indexed author,
        address indexed subject,
        uint8 competence,
        uint8 honesty,
        uint8 compliance,
        uint8 reliability,
        uint256 stake
    );

    event FeedbackDisputed(
        uint256 indexed feedbackId,
        address indexed disputer,
        bytes32 evidenceHash
    );

    event DisputeResolved(uint256 indexed feedbackId, bool feedbackWasFalse);

    event StakeReleased(uint256 indexed feedbackId, address indexed author, uint256 amount);

    struct Reputation {
        bool registered;
        uint256 feedbackCount;
        uint256 competenceSum;
        uint256 honestySum;
        uint256 complianceSum;
        uint256 reliabilitySum;
    }

    struct Feedback {
        address author;
        address subject;
        uint8 competence;
        uint8 honesty;
        uint8 compliance;
        uint8 reliability;
        bytes32 evidenceHash;
        uint256 stake;
        uint8 status;
        uint256 createdAt;
        address disputer;
        uint256 disputeBond;
    }

    address private registryOwner;
    uint256 private minStake;
    uint256 private nextFeedbackId = 1;

    mapping(address agent => bool registered) private registrations;
    mapping(address agent => Reputation reputation) private reputations;
    mapping(uint256 feedbackId => Feedback feedback) private feedbackRecords;

    constructor(address owner) {
        registryOwner = owner;
    }

    modifier onlyOwner() {
        require(msg.sender == registryOwner);
        _;
    }

    function setMinStake(uint256 newMinStake) external onlyOwner {
        minStake = newMinStake;
    }

    function registerAgent(address agent, string calldata metadataURI) external {
        if (agent == address(0)) revert InvalidAgent();
        require(msg.sender == registryOwner || msg.sender == agent);
        if (registrations[agent]) revert AlreadyRegistered();
        registrations[agent] = true;
        reputations[agent].registered = true;
        emit AgentRegistered(agent, metadataURI);
    }

    function isRegistered(address agent) external view returns (bool) {
        return registrations[agent];
    }

    function submitFeedback(
        address subject,
        uint8 competence,
        uint8 honesty,
        uint8 compliance,
        uint8 reliability,
        bytes32 evidenceHash
    ) external payable returns (uint256 feedbackId) {
        if (msg.value < minStake) revert StakeBelowMinimum();
        if (subject == address(0)) revert InvalidSubject();
        require(registrations[msg.sender]);
        require(msg.sender != subject);
        require(
            competence <= 100
                && honesty <= 100
                && compliance <= 100
                && reliability <= 100
        );

        feedbackId = nextFeedbackId++;
        feedbackRecords[feedbackId] = Feedback({
            author: msg.sender,
            subject: subject,
            competence: competence,
            honesty: honesty,
            compliance: compliance,
            reliability: reliability,
            evidenceHash: evidenceHash,
            stake: msg.value,
            status: ACTIVE,
            createdAt: block.timestamp,
            disputer: address(0),
            disputeBond: 0
        });

        Reputation storage reputation = reputations[subject];
        reputation.feedbackCount += 1;
        reputation.competenceSum += competence;
        reputation.honestySum += honesty;
        reputation.complianceSum += compliance;
        reputation.reliabilitySum += reliability;

        emit FeedbackSubmitted(
            feedbackId,
            msg.sender,
            subject,
            competence,
            honesty,
            compliance,
            reliability,
            msg.value
        );
    }

    function disputeFeedback(uint256 feedbackId, bytes32 evidenceHash) external payable {
        if (feedbackId == 0 || feedbackId >= nextFeedbackId) {
            revert FeedbackNotFound();
        }

        Feedback storage feedback = feedbackRecords[feedbackId];
        if (feedback.status != ACTIVE) revert InvalidFeedbackStatus();
        if (msg.value != feedback.stake) revert IncorrectDisputeBond();

        feedback.status = DISPUTED;
        feedback.disputer = msg.sender;
        feedback.disputeBond = msg.value;

        emit FeedbackDisputed(feedbackId, msg.sender, evidenceHash);
    }

    function resolveDispute(uint256 feedbackId, bool feedbackWasFalse)
        external
        onlyOwner
        nonReentrant
    {
        if (feedbackId == 0 || feedbackId >= nextFeedbackId) {
            revert FeedbackNotFound();
        }

        Feedback storage feedback = feedbackRecords[feedbackId];
        if (feedback.status != DISPUTED) revert InvalidFeedbackStatus();

        address recipient;
        uint256 payout = feedback.stake + feedback.disputeBond;

        if (feedbackWasFalse) {
            feedback.status = SLASHED;
            Reputation storage reputation = reputations[feedback.subject];
            reputation.feedbackCount -= 1;
            reputation.competenceSum -= feedback.competence;
            reputation.honestySum -= feedback.honesty;
            reputation.complianceSum -= feedback.compliance;
            reputation.reliabilitySum -= feedback.reliability;
            recipient = feedback.disputer;
        } else {
            feedback.status = UPHELD;
            recipient = feedback.author;
        }

        _transferNative(recipient, payout);
        emit DisputeResolved(feedbackId, feedbackWasFalse);
    }

    function releaseStake(uint256 feedbackId) external {
        // TODO: Implement after the dispute-window duration, origin, and release rules are specified.
        feedbackId;
        revert();
    }

    function getReputation(address agent)
        external
        view
        returns (
            bool registered,
            uint256 feedbackCount,
            uint256 competenceSum,
            uint256 honestySum,
            uint256 complianceSum,
            uint256 reliabilitySum
        )
    {
        if (!registrations[agent]) {
            return (false, 0, 0, 0, 0, 0);
        }

        Reputation storage reputation = reputations[agent];
        return (
            true,
            reputation.feedbackCount,
            reputation.competenceSum,
            reputation.honestySum,
            reputation.complianceSum,
            reputation.reliabilitySum
        );
    }

    function getFeedback(uint256 feedbackId)
        external
        view
        returns (
            address author,
            address subject,
            uint8 competence,
            uint8 honesty,
            uint8 compliance,
            uint8 reliability,
            bytes32 evidenceHash,
            uint256 stake,
            uint8 status,
            uint256 createdAt
        )
    {
        if (feedbackId == 0 || feedbackId >= nextFeedbackId) {
            revert FeedbackNotFound();
        }

        Feedback storage feedback = feedbackRecords[feedbackId];
        return (
            feedback.author,
            feedback.subject,
            feedback.competence,
            feedback.honesty,
            feedback.compliance,
            feedback.reliability,
            feedback.evidenceHash,
            feedback.stake,
            feedback.status,
            feedback.createdAt
        );
    }

    function _transferNative(address recipient, uint256 amount) private {
        if (amount == 0) return;
        (bool success,) = payable(recipient).call{value: amount}("");
        if (!success) revert NativeTransferFailed();
    }
}