import { faker } from '@faker-js/faker';

export function generateTicketData(eventId: number) {
  return {
    owner: faker.person.fullName(),
    code: faker.string.alphanumeric(8),
    eventId,
  };
}