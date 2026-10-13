import 'dotenv/config';
import { faker } from '@faker-js/faker';
import { db } from '#config/database.js';
import { logger } from '#config/logger.js';
import { users } from '#models/user.model.js';
import { listings } from '#models/listing.model.js';
import { offers } from '#models/offer.model.js';
import { hashPassword } from '#utils/password.js';

const SELLER_COUNT = 4;
const BUYER_COUNT = 4;
const LISTINGS_PER_SELLER = 3;

const categories = ['saas', 'ai-tool', 'dev-tool', 'ecommerce', 'marketplace', 'content', 'mobile-app'];
const businessModels = ['subscription', 'one-time', 'freemium', 'usage-based', 'marketplace-fee'];

async function main() {
  logger.info('Seeding development data...');

  const passwordHash = await hashPassword('Password123!');
  const people = [];

  for (let i = 0; i < SELLER_COUNT + BUYER_COUNT; i += 1) {
    const role = i < SELLER_COUNT ? 'seller' : 'buyer';
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const [person] = await db
      .insert(users)
      .values({
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName, provider: 'acquisitions.dev' }).toLowerCase(),
        passwordHash,
        role,
        bio: faker.lorem.sentence(),
        isEmailVerified: true,
      })
      .onConflictDoNothing()
      .returning();
    if (person) people.push(person);
  }

  const sellers = people.filter((person) => person.role === 'seller');
  const buyers = people.filter((person) => person.role === 'buyer');

  if (sellers.length === 0) {
    logger.info('Seed users already exist. Skipping listing creation.');
    return;
  }

  const createdListings = [];
  for (const seller of sellers) {
    for (let i = 0; i < LISTINGS_PER_SELLER; i += 1) {
      const title = `${faker.company.catchPhrase()} ${faker.company.buzzNoun()}`;
      const monthlyRevenue = faker.number.int({ min: 500, max: 60000 });
      const [listing] = await db
        .insert(listings)
        .values({
          sellerId: seller.id,
          title: title.slice(0, 160),
          slug: `${faker.helpers.slugify(title).toLowerCase().slice(0, 150)}-${faker.string.alphanumeric(6).toLowerCase()}`,
          tagline: faker.company.catchPhrase().slice(0, 240),
          description: faker.lorem.paragraphs(3),
          category: faker.helpers.arrayElement(categories),
          businessModel: faker.helpers.arrayElement(businessModels),
          techStack: faker.helpers.arrayElements(['Node.js', 'React', 'Postgres', 'Next.js', 'Python', 'Go'], 3),
          websiteUrl: faker.internet.url(),
          country: faker.location.country().slice(0, 80),
          foundedYear: faker.number.int({ min: 2015, max: 2024 }),
          teamSize: faker.number.int({ min: 1, max: 25 }),
          monthlyVisitors: faker.number.int({ min: 1000, max: 500000 }),
          monthlyRevenue: String(monthlyRevenue),
          monthlyProfit: String(Math.round(monthlyRevenue * faker.number.float({ min: 0.2, max: 0.7 }))),
          askingPrice: String(monthlyRevenue * faker.number.int({ min: 24, max: 48 })),
          status: 'active',
          isFeatured: faker.datatype.boolean(0.2),
          publishedAt: new Date(),
        })
        .returning();
      createdListings.push(listing);
    }
  }

  for (const listing of createdListings.slice(0, buyers.length)) {
    const buyer = buyers[faker.number.int({ min: 0, max: buyers.length - 1 })];
    if (buyer) {
      await db.insert(offers).values({
        listingId: listing.id,
        buyerId: buyer.id,
        amount: String(Math.round(Number(listing.askingPrice) * faker.number.float({ min: 0.7, max: 0.95 }))),
        currency: 'USD',
        message: faker.lorem.sentence(),
      });
    }
  }

  logger.info(`Seeded ${people.length} users, ${createdListings.length} listings.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Seed failed', { error: error.message });
    process.exit(1);
  });
