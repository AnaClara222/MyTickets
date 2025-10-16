import supertest from "supertest";
import app from "../src/index";
import prisma from "../src/database";

const api = supertest(app);

beforeEach(async () => {
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /events", () => {
  it("should return status 200 and an empty array when there are no events", async () => {
    const response = await api.get("/events");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe("POST /events", () => {
  it("should create a new event and return status 201", async () => {
    const eventData = {
      name: "Driven Festival",
      date: "2100-01-01T00:00:00.000Z",
    };

    const response = await api.post("/events").send(eventData);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: eventData.name });
  });

  it("should return 422 when body is missing required fields", async () => {
    const response = await api.post("/events").send({});
    expect(response.status).toBe(422);
  });

  it("should return 422 when date is in the past", async () => {
    const eventData = {
      name: "Old Event",
      date: "2000-01-01T00:00:00.000Z",
    };

    const response = await api.post("/events").send(eventData);
    expect(response.status).toBe(422);
  });

  it("should return 409 when the event name already exists", async () => {
    const eventData = {
      name: "Driven Festival",
      date: "2100-01-01T00:00:00.000Z",
    };

    await prisma.event.create({ data: eventData });

    const response = await api.post("/events").send(eventData);
    expect(response.status).toBe(409);
  });
});

describe("GET /events/:id", () => {
  it("should return 404 when event does not exist", async () => {
    const response = await api.get("/events/9999");
    expect(response.status).toBe(404);
  });

  it("should return 400 when id is not numeric", async () => {
    const response = await api.get("/events/abc");
    expect(response.status).toBe(400);
  });
});

describe("PUT /events/:id", () => {
  it("should return 404 when trying to update a non-existent event", async () => {
    const response = await api.put("/events/9999").send({
      name: "Updated Name",
      date: "2100-01-01T00:00:00.000Z",
    });
    expect(response.status).toBe(404);
  });

  it("should return 422 if the update body is invalid", async () => {
    const event = await prisma.event.create({
      data: { name: "Event A", date: "2100-01-01T00:00:00.000Z" },
    });

    const response = await api.put(`/events/${event.id}`).send({ name: "" });
    expect(response.status).toBe(422);
  });

  it("should return 409 if updating to an existing event name", async () => {
    await prisma.event.create({ data: { name: "Event X", date: "2100-01-01T00:00:00.000Z" } });
    const event = await prisma.event.create({ data: { name: "Event Y", date: "2100-01-01T00:00:00.000Z" } });

    const response = await api.put(`/events/${event.id}`).send({ name: "Event X", date: "2100-01-01T00:00:00.000Z" });
    expect(response.status).toBe(409);
  });
});

describe("DELETE /events/:id", () => {
  it("should return 404 when trying to delete a non-existent event", async () => {
    const response = await api.delete("/events/9999");
    expect(response.status).toBe(404);
  });

  it("should return 400 when id is not numeric", async () => {
    const response = await api.delete("/events/abc");
    expect(response.status).toBe(400);
  });
});
