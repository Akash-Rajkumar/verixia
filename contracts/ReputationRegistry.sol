// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract ReputationRegistry {
    uint8 private constant ACTIVE = 0;

    error AlreadyRegistered();
    error InvalidAgent();
    error InvalidSubject();
    error StakingNotEnabled();
    error FeedbackNotFound();

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
    }

    address private registryOwner;
    uint256 private nextFeedbackId = 1;

    mapping(address agent => bool registered) private registrations;
    mapping(address agent => Reputation reputation) private reputations;
    mapping(uint256 feedbackId => Feedback feedback) private feedbackRecords;

    constructor(address owner) {
        registryOwner = owner;
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
        if (msg.value != 0) revert StakingNotEnabled();
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
            createdAt: block.timestamp
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
}