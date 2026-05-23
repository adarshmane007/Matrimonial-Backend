import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { queryOne, withTransaction } from './db/database.js';
import { parseHeightToCm } from './utils/heightUtils.js';

const DEMO_PASSWORD = 'demo1234';

const demoProfiles = [
  {
    email: 'priya.jadhav@example.com',
    mobile: '+919876543201',
    fullName: 'Priya Jadhav',
    gender: 'bride',
    age: 26,
    district: 'pune',
    city: 'Pune',
    education: 'MSc IT',
    educationLevel: 'pg',
    occupation: 'Software Engineer',
    height: "5'4\"",
    kul: 'Jadhav Kul',
    isVerified: true,
    isOnline: true,
    isFeatured: true,
  },
  {
    email: 'sneha.patil@example.com',
    mobile: '+919876543202',
    fullName: 'Sneha Patil',
    gender: 'bride',
    age: 24,
    district: 'nashik',
    city: 'Nashik',
    education: 'MBBS',
    educationLevel: 'med',
    occupation: 'Doctor (MBBS)',
    height: "5'2\"",
    kul: 'Patil Kul',
    isVerified: true,
    isOnline: true,
    isFeatured: true,
  },
  {
    email: 'anita.shinde@example.com',
    mobile: '+919876543203',
    fullName: 'Anita Shinde',
    gender: 'bride',
    age: 27,
    district: 'mumbai',
    city: 'Mumbai',
    education: 'CA',
    educationLevel: 'grad',
    occupation: 'CA',
    height: "5'3\"",
    kul: 'Shinde Kul',
    isVerified: true,
    isOnline: true,
    isFeatured: true,
  },
  {
    email: 'rahul.more@example.com',
    mobile: '+919876543204',
    fullName: 'Rahul More',
    gender: 'groom',
    age: 29,
    district: 'kolhapur',
    city: 'Kolhapur',
    education: 'BE Mechanical',
    educationLevel: 'eng',
    occupation: 'Production Manager',
    height: "5'10\"",
    kul: 'More Kul',
    isVerified: true,
    isOnline: false,
    isFeatured: false,
  },
  {
    email: 'vikram.deshmukh@example.com',
    mobile: '+919876543205',
    fullName: 'Vikram Deshmukh',
    gender: 'groom',
    age: 31,
    district: 'pune',
    city: 'Pune',
    education: 'MBA',
    educationLevel: 'mba',
    occupation: 'Business Analyst',
    height: "5'11\"",
    kul: 'Deshmukh Kul',
    isVerified: true,
    isOnline: true,
    isFeatured: false,
  },
];

const testimonials = [
  {
    couple_names: 'Rohit & Jyoti Jadhav',
    location: 'Pune, Maharashtra • Married 2023',
    story_en:
      'We found each other on Sakal Maratha and got married within 8 months. The platform made the whole process smooth and respectful for both families.',
    story_mr:
      'आम्ही सकाळ मराठावर एकमेकांना सापडलो आणि ८ महिन्यांत लग्न केले. या व्यासपीठाने दोन्ही कुटुंबांसाठी संपूर्ण प्रक्रिया सुरळीत आणि आदरपूर्ण केली.',
    married_year: 2023,
    sort_order: 1,
  },
  {
    couple_names: 'Suresh & Priya Patil',
    location: 'Nashik, Maharashtra • Married 2024',
    story_en:
      'Being able to filter by Kul and district was incredibly helpful. We found a match from the same taluka with shared family values. Perfect for us!',
    story_mr:
      'कुळ आणि जिल्ह्यानुसार फिल्टर करणे अतिशय उपयुक्त होते. समान कुटुंबीय मूल्ये असलेली त्याच तालुक्यातील जुळणी सापडली!',
    married_year: 2024,
    sort_order: 2,
  },
  {
    couple_names: 'Vikram & Meera More',
    location: 'Kolhapur, Maharashtra • Married 2024',
    story_en:
      'My parents were hesitant about online matrimony, but the verification process and family-friendly features won them over. Grateful for this platform!',
    story_mr:
      'ऑनलाइन विवाहसेवेबद्दल पालकांना शंका होती, पण सत्यापन आणि कुटुंब-अनुकूल सुविधांनी त्यांना समजावले. या व्यासपीठाबद्दल कृतज्ञता!',
    married_year: 2024,
    sort_order: 3,
  },
];

export async function seedIfEmpty() {
  const row = await queryOne('SELECT COUNT(*)::int AS c FROM users');
  if ((row?.c ?? 0) > 0) return;

  console.log('Seeding PostgreSQL with demo data...');
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  await withTransaction(async (client) => {
    for (const p of demoProfiles) {
      const userResult = await client.query(
        `INSERT INTO users (email, mobile, password_hash, full_name, is_verified)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [p.email, p.mobile, passwordHash, p.fullName, p.isVerified]
      );
      const userId = userResult.rows[0].id;

      await client.query(
        `INSERT INTO profiles (
          user_id, gender, display_name, age, district, city,
          education, education_level, occupation, height, height_cm, kul,
          marital_status, diet, employment_type, mother_tongue, family_type,
          income_bracket, is_verified, is_online, is_featured, visibility
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'members')`,
        [
          userId,
          p.gender,
          p.fullName,
          p.age,
          p.district,
          p.city,
          p.education,
          p.educationLevel,
          p.occupation,
          p.height,
          parseHeightToCm(p.height),
          p.kul,
          'never_married',
          'veg',
          'private',
          'marathi',
          'joint',
          '5_10',
          p.isVerified,
          p.isOnline,
          p.isFeatured,
        ]
      );
    }

    for (const t of testimonials) {
      await client.query(
        `INSERT INTO testimonials (couple_names, location, story_en, story_mr, married_year, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [t.couple_names, t.location, t.story_en, t.story_mr, t.married_year, t.sort_order]
      );
    }
  });

  console.log('Seed complete. Demo login password:', DEMO_PASSWORD);
}

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const { initDatabase, closePool } = await import('./db/database.js');
  await initDatabase();
  await seedIfEmpty();
  await closePool();
}
