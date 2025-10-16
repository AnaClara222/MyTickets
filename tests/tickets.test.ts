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

describe("GET /tickets/:eventId", () => {
  it("should return 200 and an empty array if there are no tickets", async () => {
    const response = await api.get("/tickets/1");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe("POST /tickets", () => {
  it("should create a new ticket and return 201", async () => {
    const event = await prisma.event.create({
      data: {
        name: "Test Event",
        date: "2100-01-01T00:00:00.000Z",
      },
    });

    const ticketData = {
      owner: "Ana Clara",
      code: "ABC12345",
      eventId: event.id,
    };

    const response = await api.post("/tickets").send(ticketData);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      owner: ticketData.owner,
      code: ticketData.code,
      eventId: event.id,
      used: false,
    });
  });

  it("should return 422 when body is missing required fields", async () => {
    const response = await api.post("/tickets").send({});
    expect(response.status).toBe(422);
  });

  it("should return 404 if eventId does not exist", async () => {
    const ticketData = {
      owner: "Ana Clara",
      code: "XYZ98765",
      eventId: 9999,
    };
    const response = await api.post("/tickets").send(ticketData);
    expect(response.status).toBe(404);
  });
});

describe("PUT /tickets/use/:id", () => {
  it("should mark the ticket as used and return 204", async () => {
    const event = await prisma.event.create({
      data: {
        name: "Future Event",
        date: "2100-01-01T00:00:00.000Z",
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        owner: "Ana Clara",
        code: "TICKET1",
        eventId: event.id,
      },
    });

    const response = await api.put(`/tickets/use/${ticket.id}`);
    expect([200, 204]).toContain(response.status);

    const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(updatedTicket?.used).toBe(true);
  });

  it("should return 404 if ticket does not exist", async () => {
    const response = await api.put("/tickets/use/9999");
    expect(response.status).toBe(404);
  });
});
