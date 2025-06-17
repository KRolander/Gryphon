const { getAdminToken } = require("../services/keycloak/adminService.js");
const { createUser, loginUser, getUserData } = require("../services/keycloak/usersService.js");
jest.mock("../services/keycloakApiClient.js", () => {
  return {
    post: jest.fn(),
    get: jest.fn(),
  };
});

const keycloakApiClient = require("../services/keycloakApiClient.js");

describe("getAdminToken", () => {
  it("should", async () => {
    const endpoint = "endpoint";
    const body = {
      client_id: "admin-cli",
      username: "admin",
      password: "admin",
      grant_type: "password",
    };

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const userInfo = {
      id: "123",
      username: "john",
      access_token: "token",
    };

    keycloakApiClient.post.mockResolvedValue({
      status: 200,
      data: userInfo,
    });

    const result = await getAdminToken();

    expect(result).toBe("token");
  });
});
