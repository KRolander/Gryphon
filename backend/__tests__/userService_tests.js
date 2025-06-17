const { createUser, loginUser, getUserData } = require("../services/keycloak/usersService.js");
jest.mock("../services/keycloakApiClient.js", () => {
  return {
    post: jest.fn(),
    get: jest.fn(),
  };
});

const keycloakApiClient = require("../services/keycloakApiClient.js");

describe("createUser", () => {
  it("should return the data of the user because it gets status 201", async () => {
    const userData = {
      username: "john",
      email: "someone@something.com",
      emailVerified: false,
      credentials: [
        {
          type: "password",
          value: "password",
          temporary: false, // Set to false to avoid requiring password change on first login
        },
      ],
      enabled: true,
      requiredActions: [],
      groups: [],
    };
    const userInfo = {
      id: "123",
      username: "john",
    };
    keycloakApiClient.post.mockResolvedValue({
      status: 201,
      data: userInfo,
    });

    const result = await createUser(userData, "relm", "token");

    expect(result).toEqual(userInfo);
  });

  it("should throw an error if status is not 201", async () => {
    const userData = {
      username: "john",
      email: "someone@something.com",
      emailVerified: false,
      credentials: [
        {
          type: "password",
          value: "password",
          temporary: false, // Set to false to avoid requiring password change on first login
        },
      ],
      enabled: true,
      requiredActions: [],
      groups: [],
    };
    keycloakApiClient.post.mockResolvedValue({
      status: 400,
      data: {},
    });

    await expect(createUser(userData, "", "")).rejects.toThrow(
      "User Creation failed with the following error: User creation failed with status code: 400"
    );
  });
});

describe("loginUser", () => {
  it("should return the correct token after loging in a user (with status 200)", async () => {
    const userData = {
      username: "john",
      email: "someone@something.com",
      emailVerified: false,
      credentials: [
        {
          type: "password",
          value: "password",
          temporary: false, // Set to false to avoid requiring password change on first login
        },
      ],
      enabled: true,
      requiredActions: [],
      groups: [],
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

    const result = await loginUser(userData, "relm");
    expect(result).toEqual("token");
  });

  it("should throw an error, because the status of the request isn't 200", async () => {
    const userData = {
      username: "john",
      email: "someone@something.com",
      emailVerified: false,
      credentials: [
        {
          type: "password",
          value: "password",
          temporary: false, // Set to false to avoid requiring password change on first login
        },
      ],
      enabled: true,
      requiredActions: [],
      groups: [],
    };

    const userInfo = {
      id: "123",
      username: "john",
      access_token: "token",
    };

    keycloakApiClient.post.mockResolvedValue({
      status: 400,
      data: userInfo,
    });

    await expect(loginUser(userData, "")).rejects.toThrow("Login failed with status code: 400");
  });
});

describe("getUserData", () => {
  it("should return the user data", async () => {
    const userData = {
      username: "john",
      email: "someone@something.com",
      emailVerified: false,
      credentials: [
        {
          type: "password",
          value: "password",
          temporary: false, // Set to false to avoid requiring password change on first login
        },
      ],
      enabled: true,
      requiredActions: [],
      groups: [],
    };
    const userInfo = {
      id: "123",
      username: "john",
    };

    keycloakApiClient.get.mockResolvedValue({
      status: 200,
      data: userInfo,
    });

    const result = await getUserData("token", "relm");

    expect(result).toEqual(userInfo);
  });

  it("should throw an error, because the request didn't work", async () => {
    const userInfo = {
      id: "123",
      username: "john",
    };

    keycloakApiClient.get.mockResolvedValue({
      status: 400,
      data: userInfo,
    });

    await expect(getUserData("something", "something")).rejects.toThrow(
      "Fetching user data failed with the following error:\n User data fetch failed with status code: 400"
    );
  });
});
