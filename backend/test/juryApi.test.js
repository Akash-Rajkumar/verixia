import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

describe("AI Jury REST API Route (Checkpoint 2)", () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("1. POST /api/v1/jury/evaluate evaluates a case and returns 200 with success envelope", async () => {
    const mockModelClient = {
      async generate() {
        return { text: JSON.stringify({ vote: "approve", reasoning: "API test passed." }) };
      }
    };
    app.set("modelClient", mockModelClient);
    app.set("receiptsAdapter", null);

    const response = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: "API-TEST-001",
        caseType: "payment_approval",
        context: { amount: "0.25", recipient: "0x5D7C03A79570014e8cf335DCdBc9Fb87284Fdf4B" }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.data.caseId, "API-TEST-001");
    assert.equal(body.data.caseType, "payment_approval");
    assert.equal(body.data.verdict, "approve");
    assert.equal(body.data.status, "COMPLETED");
    assert.equal(body.data.votes.length, 3);
  });

  it("2. Valid 2/3 approval returns verdict = approve", async () => {
    const mockModelClient = {
      async generate({ systemInstruction }) {
        if (systemInstruction.includes("urgency")) {
          return { text: JSON.stringify({ vote: "reject", reasoning: "Too urgent." }) };
        }
        return { text: JSON.stringify({ vote: "approve", reasoning: "Approved." }) };
      }
    };
    app.set("modelClient", mockModelClient);

    const response = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: "API-TEST-002",
        caseType: "payment_approval",
        context: { amount: "0.1" }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.verdict, "approve");
  });

  it("3. Valid 2/3 rejection returns verdict = reject", async () => {
    const mockModelClient = {
      async generate({ systemInstruction }) {
        if (systemInstruction.includes("reputation")) {
          return { text: JSON.stringify({ vote: "approve", reasoning: "Reputation ok." }) };
        }
        return { text: JSON.stringify({ vote: "reject", reasoning: "Rejected." }) };
      }
    };
    app.set("modelClient", mockModelClient);

    const response = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: "API-TEST-003",
        caseType: "claim_adjudication",
        context: { claimId: "CLM-1" }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.verdict, "reject");
  });

  it("4. Jury incomplete surfaces status FAILED and errorCode JURY_INCOMPLETE", async () => {
    const mockModelClient = {
      async generate({ systemInstruction }) {
        if (systemInstruction.includes("downside")) {
          throw new Error("Provider timeout");
        }
        return { text: JSON.stringify({ vote: "approve", reasoning: "OK." }) };
      }
    };
    app.set("modelClient", mockModelClient);

    const response = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: "API-TEST-004",
        caseType: "payment_approval",
        context: { amount: "0.5" }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.data.verdict, null);
    assert.equal(body.data.status, "FAILED");
    assert.equal(body.data.errorCode, "JURY_INCOMPLETE");
  });

  it("5. Missing required request data returns 400 VALIDATION_ERROR", async () => {
    // Missing caseId
    const res1 = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseType: "payment_approval" })
    });
    const body1 = await res1.json();
    assert.equal(res1.status, 400);
    assert.equal(body1.ok, false);
    assert.equal(body1.error.code, "VALIDATION_ERROR");

    // Invalid caseType
    const res2 = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: "ID-1", caseType: "invalid_type" })
    });
    const body2 = await res2.json();
    assert.equal(res2.status, 400);
    assert.equal(body2.ok, false);
    assert.equal(body2.error.code, "VALIDATION_ERROR");
  });

  it("6. Receipt recording is invoked for valid jurors when recordReceipts = true", async () => {
    const mockModelClient = {
      async generate() {
        return { text: JSON.stringify({ vote: "approve", reasoning: "API test passed." }) };
      }
    };
    app.set("modelClient", mockModelClient);

    const submittedReceipts = [];
    const mockReceiptsAdapter = {
      async submitReceipt(params) {
        submittedReceipts.push(params);
        return { receiptId: params.receiptId, txHash: "0xmocktx_123" };
      }
    };
    app.set("receiptsAdapter", mockReceiptsAdapter);

    const response = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: "API-TEST-RECEIPT",
        caseType: "payment_approval",
        context: { amount: "0.2" },
        recordReceipts: true
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(submittedReceipts.length, 3);
    assert.ok(body.data.receipts);
    assert.equal(body.data.receipts.receiptsStatus, "ALL_RECORDED");
    assert.equal(body.data.receipts.receipts[0].txHash, "0xmocktx_123");
  });

  it("7 & 8. Receipt failure is surfaced honestly with no fake txHash", async () => {
    const mockModelClient = {
      async generate() {
        return { text: JSON.stringify({ vote: "approve", reasoning: "API test passed." }) };
      }
    };
    app.set("modelClient", mockModelClient);

    const mockReceiptsAdapter = {
      async submitReceipt() {
        throw new Error("RPC node offline");
      }
    };
    app.set("receiptsAdapter", mockReceiptsAdapter);

    const response = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: "API-TEST-RECEIPT-FAIL",
        caseType: "payment_approval",
        context: { amount: "0.2" },
        recordReceipts: true
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.verdict, "approve"); // Verdict is preserved
    assert.ok(body.data.receipts);
    assert.equal(body.data.receipts.receiptsStatus, "ALL_FAILED");
    for (const r of body.data.receipts.receipts) {
      assert.equal(r.status, "FAILED");
      assert.equal(r.txHash, null);
      assert.ok(r.error.includes("RPC node offline"));
    }
  });
});
