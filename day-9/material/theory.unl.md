# Consensus UNL and Negative UNL: Theory Lesson

## Agenda

- Introduction
- Consensus UNL Overview
- Consensus State Transitions
- Edge Cases and Recovery
- Negative UNL: Structure and Lifecycle
- Evaluating Participants
- Candidate Selection and Deterministic Choice
- Proposing and Applying Changes
- Integration with Consensus
- Interaction with Other Governance Processes
- Example Scenario
- Handling Failures and Limits
- Parameterization and Rationale
- Supporting Structures
- Summary & Q&A


## Introduction

In any system where many independent participants must agree on a shared outcome, a process called consensus is used. For consensus to be effective and trustworthy, it is important to decide who is allowed to participate in making these decisions. The Consensus UNL mechanism is a way to manage this, ensuring that only reliable participants are counted, and that the system can adapt if some participants become unreliable.

---

## Consensus UNL Overview

Consensus UNL is a method for managing the group of participants whose agreement is needed for the system to move forward. This group is carefully chosen to include only those who are considered trustworthy and reliable. The mechanism also includes a way to temporarily exclude participants who are not behaving reliably, without removing them permanently. This temporary exclusion is called the Negative UNL.

---

## Consensus State Transitions

The consensus process moves through several possible states:

- **No Agreement**: Not enough participants agree, so the system waits or tries again.
- **Agreement Reached**: Enough participants agree, so the system accepts the decision and moves forward.
- **Moved On**: The system progresses to a new decision, even if not everyone agreed, to avoid getting stuck.
- **Expired**: The process times out or is abandoned for this round, and the system may try to recover.

These states help the system handle both normal operation and unusual situations, such as when agreement cannot be reached.

---

## Edge Cases and Recovery

Sometimes, consensus cannot be reached, or the system faces unusual situations:

- If agreement is not reached, the system may try again or move forward to avoid stalling.
- The Negative UNL has a limit on how many participants can be temporarily excluded at once, to ensure the group remains large enough for decisions.
- If there are no suitable candidates for exclusion or re-inclusion, the system simply makes no changes for that round.

---

## Negative UNL: Structure and Lifecycle

The Negative UNL is a record of which participants are currently excluded from decision-making, and which are being considered for exclusion or re-inclusion. Its lifecycle involves:

1. **Initialization**: The list starts empty or with previously excluded participants.
2. **Evaluation**: The system regularly reviews participant reliability.
3. **Proposal**: If needed, the system proposes to exclude or re-include participants.
4. **Application**: Once agreed, the changes take effect and the list is updated.

This process ensures that only reliable participants are counted, and that exclusions are reversible.

---

## Evaluating Participants

The system regularly reviews how well each participant is performing. It keeps track of how often each participant takes part in decisions over a recent period. If a participant is missing too often, they may be considered for temporary exclusion. If an excluded participant starts behaving reliably again, they may be considered for re-inclusion.

---

## Candidate Selection and Deterministic Choice

When deciding whom to exclude or re-include, the system:

- Identifies all participants who meet the criteria for exclusion or re-inclusion.
- Uses a fair and predictable method to choose among candidates, so that all participants can independently reach the same decision.

This ensures the process is transparent and not subject to manipulation.

---

## Proposing and Applying Changes

If a participant is chosen for exclusion or re-inclusion, the system proposes this change as part of the decision-making process. If the proposal is accepted, the change is applied, and the participant's status is updated. If the proposal is not accepted or is invalid, no change occurs.

---

## Integration with Consensus

The process of evaluating, proposing, and applying changes to the Negative UNL is integrated into the regular consensus process. This means that decisions about participant reliability are made alongside other important decisions, ensuring that the system remains responsive and up-to-date.

---

## Interaction with Other Governance Processes

Decisions about participant reliability are made together with other governance decisions, such as adjusting system parameters or adopting new features. This ensures that all important changes are considered together, maintaining the system's overall health and adaptability.

---

## Example Scenario

Suppose a participant is consistently missing from decision-making. The system notices this pattern, proposes to temporarily exclude the participant, and—if enough agreement is reached—updates the Negative UNL. Later, if the participant becomes reliable again, the system can propose to re-include them.

---

## Handling Failures and Limits

The system is designed to handle various failure scenarios:

- If a proposed change cannot be agreed upon, nothing changes.
- If too many participants are already excluded, no further exclusions are made until space becomes available.
- If a proposal is invalid or the process is interrupted, the system simply continues as before.

These safeguards ensure that the system remains stable and fair.

---

## Parameterization and Rationale

The rules for when to exclude or re-include participants, how many can be excluded at once, and how performance is measured are all carefully chosen. These parameters balance the need for reliability, fairness, and adaptability. They are set to ensure that the system can continue to function even if some participants become unreliable, but without making it too easy to exclude participants.

---

## Supporting Structures

Various supporting structures help manage the list of participants, track their performance, and ensure that all changes are made transparently and fairly. These structures work together to maintain the integrity of the consensus process.

---

## Summary

Consensus UNL is a mechanism for managing who gets to participate in making decisions in a distributed system. By carefully selecting, monitoring, and—when necessary—temporarily excluding participants, the system ensures that decisions are made reliably and fairly. The process is transparent, adaptable, and designed to handle both normal operation and unusual situations, maintaining trust and stability in the system.

---