const request = require("supertest");
const fs = require("fs");
const path = require("path");

describe("GET /registry/:org", () => {
  it("sholud return 404 and a warning message because the path doesn't exist", async () => {
    const app = require("../app");
    const response = await request(app).get("/registry/wrongOrg").send("wrongOrg").expect(404);
    expect(response.text).toBe("Registry not found for this organization");
  });

  it("should return 200 and a valid registry", async () => {
    const content = "Something writen in the registry";
    const filePath = path.join(__dirname, "../registries/MOE_test.json");

    const app = require("../app");

    const response = await request(app).get("/registry/MOE_test").send("MOE_test").expect(200);
    expect(response.text).toBe("{}");
  });
});
