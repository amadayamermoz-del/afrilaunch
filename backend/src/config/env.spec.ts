import { parseEnvironment } from "./env";

describe("parseEnvironment", () => {
  it("parses valid configuration and applies the port default", () => {
    expect(
      parseEnvironment({
        NODE_ENV: "test",
        CORS_ORIGIN: "https://afrilauch.example",
        JWT_SECRET: "a-private-test-secret-with-more-than-32-characters",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/afrilauch",
      }),
    ).toMatchObject({
      NODE_ENV: "test",
      PORT: 4000,
      CORS_ORIGIN: "https://afrilauch.example",
    });
  });

  it("rejects missing database configuration and weak JWT secrets", () => {
    expect(() => parseEnvironment({ JWT_SECRET: "weak" })).toThrow(
      "Invalid environment configuration",
    );
  });
});
