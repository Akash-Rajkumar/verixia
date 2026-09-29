import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runJury, parseJurorResponse, JuryEngine, JuryValidationError } from "../src/jury/JuryEngine.js";
import { JUROR_PERSONAS } from "../src/jury/personas.js";

function createMockModelClient(handler) {
  return {
    async generate(params) {
      return handler(params);
    }
  };
}

describe("AI Jury Engine (Checkpoint 1)", () => {

  it("1. payment_approval caseType is accepted and processed", async () => {
    const mockClient = createMockModelClient(async ({ systemInstruction }) => {
      return {
        text: JSON.stringify({ vote: "approve", reasoning: "Payment conforms to rules." })
      };
    });

    const result = await runJury("payment_approval", { amount: "0.25", recipient: "0x123" }, { modelClient: mockClient });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.verdict, "approve");
    assert.equal(result.votes.length, 3);
  });

  it("2. claim_adjudication caseType is accepted and processed", async () => {
    const mockClient = createMockModelClient(async () => {
      return {
        text: JSON.stringify({ vote: "reject", reasoning: "Evidence is insufficient." })
      };
    });

    const result = await runJury("claim_adjudication", { claimId: "C1", amount: "1.0" }, { modelClient: mockClient });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.verdict, "reject");
    assert.equal(result.votes.length, 3);
  });

  it("3. unsupported case type is rejected with JuryValidationError", async () => {
    const mockClient = createMockModelClient(async () => ({ text: "{}" }));

    await assert.rejects(
      async () => runJury("invalid_case_type", { foo: "bar" }, { modelClient: mockClient }),
      (err) => err instanceof JuryValidationError && err.message.includes("Unsupported or missing caseType")
    );
  });

  it("4. all three personas are invoked with their specific system instructions", async () => {
    const invokedPersonas = [];
    const mockClient = createMockModelClient(async ({ systemInstruction }) => {
      invokedPersonas.push(systemInstruction);
      return { text: JSON.stringify({ vote: "approve", reasoning: "Passed." }) };
    });

    await runJury("payment_approval", { test: true }, { modelClient: mockClient });
    assert.equal(invokedPersonas.length, 3);
    for (const p of JUROR_PERSONAS) {
      assert.ok(invokedPersonas.includes(p.systemInstruction), `Expected instruction for ${p.id}`);
    }
  });

  it("5. three calls execute concurrently using Promise.all", async () => {
    let pendingCount = 0;
    let maxConcurrent = 0;
    const resolvers = [];

    const mockClient = createMockModelClient(async () => {
      pendingCount++;
      if (pendingCount > maxConcurrent) {
        maxConcurrent = pendingCount;
      }
      return new Promise((resolve) => {
        resolvers.push(() => {
          pendingCount--;
          resolve({ text: JSON.stringify({ vote: "approve", reasoning: "Done." }) });
        });
      });
    });

    const juryPromise = runJury("payment_approval", { asyncTest: true }, { modelClient: mockClient });

    // Wait a tick for promises to start
    await new Promise((r) => setTimeout(r, 10));

    assert.equal(maxConcurrent, 3, "All 3 calls must be started concurrently before resolution");

    // Resolve all promises
    resolvers.forEach((res) => res());

    const result = await juryPromise;
    assert.equal(result.verdict, "approve");
  });

  it("6. majority approve yields verdict = approve (2 or 3 approves)", async () => {
    // 2 approves, 1 reject
    const mockClient = createMockModelClient(async ({ systemInstruction }) => {
      if (systemInstruction.includes("urgency")) {
        return { text: JSON.stringify({ vote: "reject", reasoning: "Suspicious urgency." }) };
      }
      return { text: JSON.stringify({ vote: "approve", reasoning: "Acceptable risk profile." }) };
    });

    const result = await runJury("payment_approval", { amount: "0.1" }, { modelClient: mockClient });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.verdict, "approve");
  });

  it("7. majority reject yields verdict = reject (0 or 1 approve)", async () => {
    // 1 approve, 2 rejects
    const mockClient = createMockModelClient(async ({ systemInstruction }) => {
      if (systemInstruction.includes("reputation")) {
        return { text: JSON.stringify({ vote: "approve", reasoning: "On-chain history looks ok." }) };
      }
      return { text: JSON.stringify({ vote: "reject", reasoning: "Unsafe transaction." }) };
    });

    const result = await runJury("payment_approval", { amount: "0.8" }, { modelClient: mockClient });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.verdict, "reject");
  });

  it("8. malformed model response is marked as juror error", () => {
    assert.equal(parseJurorResponse("not json"), null);
    assert.equal(parseJurorResponse(JSON.stringify({ vote: "maybe", reasoning: "valid" })), null);
    assert.equal(parseJurorResponse(JSON.stringify({ vote: "approve", reasoning: "" })), null);
    assert.equal(parseJurorResponse(JSON.stringify({ vote: "approve" })), null);

    // Markdown code blocks are handled correctly
    const markdownOutput = "```json\n{\"vote\": \"approve\", \"reasoning\": \"Valid markdown JSON\"}\n```";
    assert.deepEqual(parseJurorResponse(markdownOutput), {
      vote: "approve",
      reasoning: "Valid markdown JSON"
    });
  });

  it("9. one juror failure results in status FAILED and errorCode JURY_INCOMPLETE", async () => {
    const mockClient = createMockModelClient(async ({ systemInstruction }) => {
      if (systemInstruction.includes("urgency")) {
        throw new Error("Provider timeout");
      }
      return { text: JSON.stringify({ vote: "approve", reasoning: "OK." }) };
    });

    const result = await runJury("payment_approval", { amount: "0.2" }, { modelClient: mockClient });
    assert.equal(result.status, "FAILED");
    assert.equal(result.errorCode, "JURY_INCOMPLETE");
    assert.equal(result.verdict, null);
    assert.equal(result.votes.filter(v => v.error).length, 1);
  });

  it("10. multiple juror failures result in status FAILED and errorCode JURY_INCOMPLETE", async () => {
    const mockClient = createMockModelClient(async ({ systemInstruction }) => {
      if (systemInstruction.includes("reputation")) {
        return { text: JSON.stringify({ vote: "approve", reasoning: "OK." }) };
      }
      throw new Error("API rate limit");
    });

    const result = await runJury("payment_approval", { amount: "0.2" }, { modelClient: mockClient });
    assert.equal(result.status, "FAILED");
    assert.equal(result.errorCode, "JURY_INCOMPLETE");
    assert.equal(result.verdict, null);
    assert.equal(result.votes.filter(v => v.error).length, 2);
  });

  it("11. zero valid votes result in status FAILED and errorCode JURY_INCOMPLETE", async () => {
    const mockClient = createMockModelClient(async () => {
      throw new Error("Global model provider outage");
    });

    const result = await runJury("payment_approval", { amount: "0.2" }, { modelClient: mockClient });
    assert.equal(result.status, "FAILED");
    assert.equal(result.errorCode, "JURY_INCOMPLETE");
    assert.equal(result.verdict, null);
    assert.equal(result.votes.filter(v => v.error).length, 3);
  });

  it("12. reasoning text from each juror is strictly preserved in votes output", async () => {
    const reasoningMap = {
      skeptical: "Flagged high urgency pretext.",
      "risk-averse": "Risk exceeds threshold.",
      pragmatic: "Reputation score is 95/100."
    };

    const mockClient = createMockModelClient(async ({ systemInstruction }) => {
      let personaKey = "skeptical";
      if (systemInstruction.includes("downside")) personaKey = "risk-averse";
      if (systemInstruction.includes("reputation")) personaKey = "pragmatic";

      return {
        text: JSON.stringify({
          vote: personaKey === "pragmatic" ? "approve" : "reject",
          reasoning: reasoningMap[personaKey]
        })
      };
    });

    const result = await runJury("payment_approval", { amount: "0.5" }, { modelClient: mockClient });
    assert.equal(result.status, "COMPLETED");
    for (const voteItem of result.votes) {
      assert.equal(voteItem.reasoning, reasoningMap[voteItem.persona]);
    }
  });

  it("13. votes must strictly equal 'approve' or 'reject'", async () => {
    const mockClient = createMockModelClient(async () => {
      return { text: JSON.stringify({ vote: "APPROVE", reasoning: "Capitalized vote string" }) };
    });

    const result = await runJury("payment_approval", { test: true }, { modelClient: mockClient });
    assert.equal(result.status, "COMPLETED");
    for (const v of result.votes) {
      assert.ok(v.vote === "approve" || v.vote === "reject");
    }
  });

  it("14. no fabricated vote on provider failure", async () => {
    const mockClient = createMockModelClient(async ({ systemInstruction }) => {
      if (systemInstruction.includes("downside")) {
        return { text: "malformed non-json response" };
      }
      return { text: JSON.stringify({ vote: "approve", reasoning: "OK" }) };
    });

    const result = await runJury("payment_approval", { test: true }, { modelClient: mockClient });
    assert.equal(result.status, "FAILED");
    assert.equal(result.verdict, null);

    const failedJuror = result.votes.find((v) => v.persona === "risk-averse");
    assert.ok(failedJuror);
    assert.equal(failedJuror.vote, null);
    assert.equal(failedJuror.error, true);
  });

  it("15. JuryEngine class wrapper works correctly", async () => {
    const mockClient = createMockModelClient(async () => {
      return { text: JSON.stringify({ vote: "approve", reasoning: "Class wrapper test." }) };
    });

    const engine = new JuryEngine({ modelClient: mockClient });
    const result = await engine.runJury("payment_approval", { amount: "0.1" });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.verdict, "approve");
  });
});
