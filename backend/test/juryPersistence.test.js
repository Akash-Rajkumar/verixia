import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { persistJuryVerdict } from "../src/services/db/juryVerdicts.js";

describe("AI Jury Verdict Persistence (Checkpoint 3)", () => {
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

  it("1. persistJuryVerdict inserts a record with case_type, case_ref_id, verdict, and votes", async () => {
    const inserted = [];
    const mockDbClient = {
      from(tableName) {
        assert.equal(tableName, "jury_verdicts");
        return {
          insert(payload) {
            inserted.push(payload);
            return {
              select() {
                return {
                  single() {
                    return {
                      data: { id: "mock-uuid-12345", ...payload, created_at: new Date().toISOString() },
                      error: null
                    };
                  }
                };
              }
            };
          }
        };
      }
    };

    const res = await persistJuryVerdict(
      {
        caseType: "payment_approval",
        caseRefId: "CASE-PERSIST-001",
        verdict: "approve",
        votes: [
          { persona: "skeptical", vote: "approve", reasoning: "OK" },
          { persona: "risk-averse", vote: "reject", reasoning: "Risk" },
          { persona: "pragmatic", vote: "approve", reasoning: "OK" }
        ]
      },
      { dbClient: mockDbClient }
    );

    assert.equal(res.persisted, true);
    assert.equal(res.verdictId, "mock-uuid-12345");
    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].case_type, "payment_approval");
    assert.equal(inserted[0].case_ref_id, "CASE-PERSIST-001");
    assert.equal(inserted[0].verdict, "approve");
    assert.equal(inserted[0].votes.length, 3);
  });

  it("2. POST /api/v1/jury/evaluate persists completed verdict and returns verdictId", async () => {
    const mockModelClient = {
      async generate() {
        return { text: JSON.stringify({ vote: "approve", reasoning: "Passed." }) };
      }
    };
    app.set("modelClient", mockModelClient);
    app.set("receiptsAdapter", null);

    const insertedRows = [];
    const mockDbClient = {
      from(tableName) {
        return {
          insert(payload) {
            insertedRows.push(payload);
            return {
              select() {
                return {
                  single() {
                    return {
                      data: { id: "v-uuid-999", ...payload },
                      error: null
                    };
                  }
                };
              }
            };
          }
        };
      }
    };
    app.set("dbClient", mockDbClient);

    const response = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: "CASE-API-PERSIST-1",
        caseType: "payment_approval",
        context: { amount: "0.2" }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.data.verdictId, "v-uuid-999");
    assert.equal(body.data.persisted, true);
    assert.equal(insertedRows.length, 1);
    assert.equal(insertedRows[0].case_ref_id, "CASE-API-PERSIST-1");
    assert.equal(insertedRows[0].verdict, "approve");
  });

  it("3. Incomplete Jury does NOT insert a jury_verdicts row", async () => {
    const mockModelClient = {
      async generate({ systemInstruction }) {
        if (systemInstruction.includes("downside")) {
          throw new Error("Provider timeout");
        }
        return { text: JSON.stringify({ vote: "approve", reasoning: "OK." }) };
      }
    };
    app.set("modelClient", mockModelClient);

    const insertedRows = [];
    const mockDbClient = {
      from() {
        return {
          insert(payload) {
            insertedRows.push(payload);
          }
        };
      }
    };
    app.set("dbClient", mockDbClient);

    const response = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: "CASE-INCOMPLETE-PERSIST",
        caseType: "payment_approval",
        context: { amount: "0.5" }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.status, "FAILED");
    assert.equal(body.data.errorCode, "JURY_INCOMPLETE");
    assert.equal(insertedRows.length, 0, "No row must be inserted when Jury is incomplete");
  });

  it("4. Database failure AFTER successful Jury execution surfaces DB_PERSISTENCE_ERROR honestly", async () => {
    const mockModelClient = {
      async generate() {
        return { text: JSON.stringify({ vote: "approve", reasoning: "Passed." }) };
      }
    };
    app.set("modelClient", mockModelClient);

    const mockDbClient = {
      from() {
        return {
          insert() {
            return {
              select() {
                return {
                  single() {
                    return {
                      data: null,
                      error: { message: "relation jury_verdicts does not exist" }
                    };
                  }
                };
              }
            };
          }
        };
      }
    };
    app.set("dbClient", mockDbClient);

    const response = await fetch(`${baseUrl}/api/v1/jury/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: "CASE-DB-FAIL",
        caseType: "payment_approval",
        context: { amount: "0.1" }
      })
    });

    const body = await response.json();
    assert.equal(response.status, 500);
    assert.equal(body.ok, false);
    assert.equal(body.error.code, "DB_PERSISTENCE_ERROR");
    assert.equal(body.error.details.verdict, "approve"); // Verdict preserved
    assert.equal(body.error.details.votes.length, 3); // Votes preserved
  });
});
