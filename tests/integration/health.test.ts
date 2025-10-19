import supertest from 'supertest';
import app from '../../src/index';
const api = supertest(app);

describe("GET /health", () => {
  it("deve retornar 200 e a string de status correta", async () => {
    const response = await api.get("/health");

    expect(response.status).toBe(200);
    expect(response.text).toBe("I'm okay!");
  });
});