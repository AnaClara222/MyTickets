import { faker } from "@faker-js/faker";
import prisma from "database";

export function generateEvent() {
  return prisma.event.create({
    data: {
      name: faker.music.songName(),
      date: faker.date.future(),
    },
  });
}

export async function eventNextWeek() {
  return prisma.event.create({
    data: {
      name: faker.word.words(3),
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
}
