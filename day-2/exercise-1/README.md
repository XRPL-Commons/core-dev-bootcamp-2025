# Group Activity: XRPL Transactor Breakdown Lab

## **A. Find Your Transactor**
- Navigate to `src/ripple/app/tx/impl/`
- Locate the file for your assigned transaction type (e.g., `Payment.cpp` for Payment, `OfferCreate.cpp` for OfferCreate, etc.)

## **B. Map the Execution Flow**
- **Start at the top:**
  - Identify the static `preflight()` and `preclaim()` methods.
  - Find the class definition (e.g., `class Payment : public Transactor`).
- **Trace the flow:**
  - See how `operator()()` calls `apply()`, which then calls `doApply()`.
  - In `doApply()`, look for:
    - Which ledger objects are read or written?
    - What fields are changed?
    - Are new objects created or deleted?
    - Are any flags set or cleared?

## **C. Identify Key Functions and Checks**
- What are the main conditions for success or failure?
- Are there any edge cases (e.g., insufficient funds, invalid flags)?
- What happens if the transaction fails at different stages?

## **D. Prepare Your Report**
- **Summarize:**
  - What does this transactor do?
  - What are the key methods involved?
  - What are the main ledger changes?
  - Any interesting or surprising logic?
- **Show:**
  - Use a diagram, whiteboard, or a 2-minute verbal summary to present your findings.

---

**Tips:**
- Look for comments and docstrings in the code.
- Trace function calls—if you see a function you don’t know, search for its definition.
- Focus on the flow; don’t get lost in details—try to see the big picture first.
- Ask: What is this code trying to protect against? What invariants is it enforcing?

---

**What to Share:**
- One thing you learned about how this transaction type works.
- One thing that surprised you or that you don’t fully understand yet.

---

**If You Get Stuck:**
- Ask your instructor or TA for help.
- Pair up with another team for a fresh perspective.
- Focus on what you can trace—it’s okay if you don’t understand every line!
