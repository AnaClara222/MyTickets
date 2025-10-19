import { faker } from '@faker-js/faker';
import prisma from 'database';

export async function createEvent() {
  return await prisma.event.create({
    data: {
      name: faker.company.name(),
      date: faker.date.future()
    },
  });
}

export async function createTicket(eventId: number) {
  return await prisma.ticket.create({
    data: {
      owner: faker.person.fullName(),
      code: faker.string.alphanumeric(8),
      eventId
    },
  });
}