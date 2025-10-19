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

describe('Event Endpoints', () => {
  describe('GET /events', () => {
    it('should respond with 200 and return a list of events', async () => {
      await prisma.event.createMany({
        data: [
          { name: faker.lorem.words(2), date: faker.date.future() },
          { name: faker.lorem.words(2), date: faker.date.future() },
          { name: faker.lorem.words(2), date: faker.date.future() },
        ],
      });

      const response = await requestAgent.get('/events');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GET /events/:id', () => {
    it('should return 200 with a specific event', async () => {
      const sampleEvent = await prisma.event.create({
        data: { name: faker.lorem.words(2), date: faker.date.future() },
      });

      const response = await requestAgent.get(`/events/${sampleEvent.id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(sampleEvent.name);
    });

    it('should return 404 if the event does not exist', async () => {
      const response = await requestAgent.get('/events/999999');
      expect(response.status).toBe(404);
    });

    it('should return 400 if the id is invalid', async () => {
      const response = await requestAgent.get('/events/invalid-id');
      expect(response.status).toBe(400);
    });
  });

  describe('POST /events', () => {
    it('should return 201 when creating a valid event', async () => {
      const newEvent = {
        name: faker.lorem.words(3),
        date: faker.date.future().toISOString(),
      };

      const response = await requestAgent.post('/events').send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should return 422 for invalid input', async () => {
      const response = await requestAgent.post('/events').send({});
      expect(response.status).toBe(422);
    });

    it('should return 409 if event name already exists', async () => {
      const existingName = faker.lorem.words(2);

      await prisma.event.create({
        data: { name: existingName, date: faker.date.future() },
      });

      const response = await requestAgent.post('/events').send({
        name: existingName,
        date: faker.date.future().toISOString(),
      });

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /events/:id', () => {
    it('should update an existing event and return 200', async () => {
      const originalEvent = await prisma.event.create({
        data: { name: 'Old Event', date: faker.date.future() },
      });

      const updatePayload = {
        name: 'Updated Event',
        date: faker.date.future().toISOString(),
      };

      const response = await requestAgent.put(`/events/${originalEvent.id}`).send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatePayload.name);
    });

    it('should return 422 for invalid update payload', async () => {
      const eventToUpdate = await prisma.event.create({
        data: { name: faker.lorem.words(2), date: faker.date.future() },
      });

      const response = await requestAgent.put(`/events/${eventToUpdate.id}`).send({ name: '' });

      expect(response.status).toBe(422);
    });

    it('should return 404 if event to update does not exist', async () => {
      const response = await requestAgent.put('/events/999999').send({
        name: 'Any Name',
        date: faker.date.future().toISOString(),
      });

      expect(response.status).toBe(404);
    });

    it('should return 409 if updating to an existing event name', async () => {
      const nameTaken = faker.lorem.words(2);

      await prisma.event.create({ data: { name: nameTaken, date: faker.date.future() } });
      const eventToUpdate = await prisma.event.create({ data: { name: 'Another Event', date: faker.date.future() } });

      const response = await requestAgent.put(`/events/${eventToUpdate.id}`).send({
        name: nameTaken,
        date: faker.date.future().toISOString(),
      });

      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /events/:id', () => {
    it('should delete the event and return 204', async () => {
      const eventToDelete = await prisma.event.create({
        data: { name: faker.lorem.words(2), date: faker.date.future() },
      });

      const response = await requestAgent.delete(`/events/${eventToDelete.id}`);

      expect(response.status).toBe(204);
      const deletedEvent = await prisma.event.findUnique({ where: { id: eventToDelete.id } });
      expect(deletedEvent).toBeNull();
    });

    it('should return 404 if event does not exist', async () => {
      const response = await requestAgent.delete('/events/999999');
      expect(response.status).toBe(404);
    });

    it('should return 400 if id is invalid', async () => {
      const response = await requestAgent.delete('/events/invalid-id');
      expect(response.status).toBe(400);
    });
  });
});
