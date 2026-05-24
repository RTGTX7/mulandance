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

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type DonationInput = z.infer<typeof donationSchema>;
export type VenueRentalInput = z.infer<typeof venueRentalSchema>;
