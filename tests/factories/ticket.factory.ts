import { faker } from "@faker-js/faker";
import prisma from "database";
import { generateEvent } from "./event.factory";

export async function createTicket() {
  const event = await generateEvent();

  return prisma.ticket.create({
    data: {
      owner: faker.person.fullName(),
      code: faker.string.alphanumeric(8),
      eventId: event.id,
    },
  });
}
