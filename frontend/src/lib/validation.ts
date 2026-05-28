import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const enrollmentSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  parentEmail: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  program: z.string().min(1, 'Program is required'),
  experience: z.string().optional(),
});

export const donationSchema = z.object({
  amount: z.number().min(1, 'Minimum donation is $1'),
  frequency: z.enum(['one-time', 'monthly']),
  dedicate: z.boolean().optional(),
});

export const venueRentalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  program: z.string().min(1, 'Program type is required'),
  notes: z.string().optional(),
});

// --- News Article schemas ---

export const newsArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  slug: z.string().min(1, 'Slug is required'),
  summary: z.string().optional(),
  body: z.string().min(1, 'Content is required'),
  cover_image: z.string().optional(),
  category_slugs: z.array(z.string()).default([]),
  tag_slugs: z.array(z.string()).default([]),
  locale: z.enum(['en', 'zh', 'fr']).default('en'),
  is_published: z.boolean().default(false),
});

export const categorySchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
});

export const tagSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  name_zh: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type DonationInput = z.infer<typeof donationSchema>;
export type VenueRentalInput = z.infer<typeof venueRentalSchema>;
export type NewsArticleInput = z.infer<typeof newsArticleSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TagInput = z.infer<typeof tagSchema>;
