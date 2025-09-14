import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// Food donation validation schema
export const donationFormSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters")
    .trim(),
  
  foodType: z.enum([
    "fruits", "vegetables", "grains", "dairy", 
    "meat", "prepared", "baked", "other"
  ] as const, {
    errorMap: () => ({ message: "Please select a valid food type" })
  }),
  
  quantity: z.string()
    .min(1, "Quantity is required")
    .max(50, "Quantity description too long")
    .trim(),
  
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  
  expiryTime: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const expiryDate = new Date(date);
      const now = new Date();
      return expiryDate > now;
    }, "Expiry time must be in the future"),
  
  pickupLocation: z.string()
    .min(5, "Pickup location must be at least 5 characters")
    .max(200, "Pickup location too long")
    .trim(),
  
  contactPhone: z.string()
    .optional()
    .refine((phone) => {
      if (!phone) return true;
      // Kenyan phone number format: +254XXXXXXXXX or 07XXXXXXXX
      const phoneRegex = /^(\+254[17]\d{8}|0[17]\d{8})$/;
      return phoneRegex.test(phone.replace(/\s+/g, ''));
    }, "Please enter a valid Kenyan phone number"),
  
  specialInstructions: z.string()
    .max(300, "Special instructions too long")
    .optional(),
});

// Food alert validation schema
export const alertFormSchema = z.object({
  food_type: z.enum([
    "fruits", "vegetables", "grains", "dairy", 
    "meat", "prepared", "baked", "other"
  ] as const, {
    errorMap: () => ({ message: "Please select a valid food type" })
  }),
  
  location: z.string()
    .max(100, "Location too long")
    .optional(),
  
  radius_km: z.number()
    .min(1, "Radius must be at least 1km")
    .max(100, "Radius cannot exceed 100km")
    .int("Radius must be a whole number"),
});

// Profile validation schema
export const profileSchema = z.object({
  full_name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .trim(),
  
  role: z.enum(["donor", "recipient", "admin"] as const),
  
  organization_name: z.string()
    .max(100, "Organization name too long")
    .optional(),
  
  contact_phone: z.string()
    .optional()
    .refine((phone) => {
      if (!phone) return true;
      const phoneRegex = /^(\+254[17]\d{8}|0[17]\d{8})$/;
      return phoneRegex.test(phone.replace(/\s+/g, ''));
    }, "Please enter a valid Kenyan phone number"),
  
  location: z.string()
    .max(200, "Location too long")
    .optional(),
});

// Claim validation
export const claimSchema = z.object({
  donation_id: z.string().uuid("Invalid donation ID"),
  notes: z.string()
    .max(300, "Notes too long")
    .optional(),
});

// Admin validation schemas
export const statusUpdateSchema = z.object({
  status: z.enum(["available", "claimed", "completed", "expired"] as const),
});

export const claimStatusUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "completed", "cancelled"] as const),
});

// Utility functions for validation
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true;
  const phoneRegex = /^(\+254[17]\d{8}|0[17]\d{8})$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Type exports for form data
export type DonationFormData = z.infer<typeof donationFormSchema>;
export type AlertFormData = z.infer<typeof alertFormSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ClaimFormData = z.infer<typeof claimSchema>;