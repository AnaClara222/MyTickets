import supertest from 'supertest';
import app from '../../src/index';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const requestAgent = supertest(app);

beforeEach(async () => {
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Ticket Endpoints', () => {
  describe('POST /tickets', () => {
    it('should create a valid ticket and return 201', async () => {
      const sampleEvent = await prisma.event.create({
        data: {
          name: faker.lorem.words(3),
          date: faker.date.future(),
        },
      });

      const ticketPayload = {
        owner: faker.person.fullName(),
        code: faker.string.alphanumeric(8),
        eventId: sampleEvent.id,
      };

      const response = await requestAgent.post('/tickets').send(ticketPayload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.used).toBe(false);
    });

    it('should return 422 for invalid payload', async () => {
      const response = await requestAgent.post('/tickets').send({});
      expect(response.status).toBe(422);
    });

    it('should return 404 if eventId does not exist', async () => {
      const ticketPayload = {
        owner: faker.person.fullName(),
        code: faker.string.alphanumeric(8),
        eventId: 999999,
      };

      const response = await requestAgent.post('/tickets').send(ticketPayload);
      expect(response.status).toBe(404);
    });

    it('should return 403 if the event has already happened', async () => {
      const pastEvent = await prisma.event.create({
        data: {
          name: faker.lorem.words(3),
          date: faker.date.past(),
        },
      });

      const ticketPayload = {
        owner: faker.person.fullName(),
        code: faker.string.alphanumeric(8),
        eventId: pastEvent.id,
      };

      const response = await requestAgent.post('/tickets').send(ticketPayload);
      expect(response.status).toBe(403);
      expect(typeof response.text).toBe('string');
      expect(response.text.toLowerCase()).toMatch(/already happened/);
    });

    it('should return 409 if a ticket with the same code already exists for the event', async () => {
      const sampleEvent = await prisma.event.create({
        data: {
          name: faker.lorem.words(3),
          date: faker.date.future(),
        },
      });

      const duplicateCode = faker.string.alphanumeric(8);

      await prisma.ticket.create({
        data: {
          owner: faker.person.fullName(),
          code: duplicateCode,
          eventId: sampleEvent.id,
        },
      });

      const ticketPayload = {
        owner: faker.person.fullName(),
        code: duplicateCode,
        eventId: sampleEvent.id,
      };

      const response = await requestAgent.post('/tickets').send(ticketPayload);
      expect(response.status).toBe(409);
      expect(typeof response.text).toBe('string');
      expect(response.text.toLowerCase()).toMatch(/already registered/);
    });
  });

  describe('GET /tickets/:eventId', () => {
    it('should return 200 and list all tickets for the event', async () => {
      const sampleEvent = await prisma.event.create({
        data: {
          name: faker.lorem.words(3),
          date: faker.date.future(),
        },
      });

      await prisma.ticket.createMany({
        data: Array.from({ length: 3 }).map(() => ({
          owner: faker.person.fullName(),
          code: faker.string.alphanumeric(8),
          eventId: sampleEvent.id,
        })),
      });

      const response = await requestAgent.get(`/tickets/${sampleEvent.id}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
    });

    it('should return 200 with empty array if the event does not exist', async () => {
      const response = await requestAgent.get('/tickets/999999');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 400 if eventId is invalid', async () => {
      const response = await requestAgent.get('/tickets/invalid-id');
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /tickets/use/:id', () => {
    it('should mark the ticket as used and return 200', async () => {
      const sampleEvent = await prisma.event.create({
        data: {
          name: faker.lorem.words(3),
          date: faker.date.future(),
        },
      });

      const ticket = await prisma.ticket.create({
        data: {
          owner: faker.person.fullName(),
          code: faker.string.alphanumeric(8),
          eventId: sampleEvent.id,
        },
      });

      const response = await requestAgent.put(`/tickets/use/${ticket.id}`);

      expect([200, 204]).toContain(response.status);

      const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(updatedTicket?.used).toBe(true);
    });

    it('should return 404 if the ticket does not exist', async () => {
      const response = await requestAgent.put('/tickets/use/999999');
      expect(response.status).toBe(404);
    });

    it('should return 409 if the ticket has already been used', async () => {
      const sampleEvent = await prisma.event.create({
        data: {
          name: faker.lorem.words(3),
          date: faker.date.future(),
        },
      });

      const usedTicket = await prisma.ticket.create({
        data: {
          owner: faker.person.fullName(),
          code: faker.string.alphanumeric(8),
          eventId: sampleEvent.id,
          used: true,
        },
      });

      const response = await requestAgent.put(`/tickets/use/${usedTicket.id}`);
      expect([403, 409]).toContain(response.status);
    });

    it('should return 403 if the event has passed when using the ticket', async () => {
      const pastEvent = await prisma.event.create({
        data: {
          name: faker.lorem.words(3),
          date: faker.date.past(),
        },
      });

      const ticket = await prisma.ticket.create({
        data: {
          owner: faker.person.fullName(),
          code: faker.string.alphanumeric(8),
          eventId: pastEvent.id,
          used: false,
        },
      });

      const response = await requestAgent.put(`/tickets/use/${ticket.id}`);
      expect(response.status).toBe(403);
      expect(typeof response.text).toBe('string');
      expect(response.text.toLowerCase()).toMatch(/already happened/);
    });

    it('should return 400 if ticket id is invalid', async () => {
      const response = await requestAgent.put('/tickets/use/invalid-id');
      expect(response.status).toBe(400);
    });
  });
});
