import { describe, it, expect } from 'vitest';
import { 
  donationFormSchema, 
  alertFormSchema, 
  profileSchema,
  validateEmail,
  validatePhoneNumber,
  sanitizeInput
} from '@/lib/validation';

describe('Validation Library', () => {
  describe('donationFormSchema', () => {
    it('validates correct donation data', () => {
      const validData = {
        title: 'Fresh Vegetables',
        foodType: 'vegetables' as const,
        quantity: '5 kg',
        description: 'Fresh organic vegetables from our garden',
        expiryTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        pickupLocation: '123 Main Street, Nairobi',
        contactPhone: '+254712345678',
        specialInstructions: 'Available after 2 PM'
      };

      const result = donationFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid food type', () => {
      const invalidData = {
        title: 'Invalid Food',
        foodType: 'invalid_type',
        quantity: '1 kg',
        pickupLocation: 'Test Location'
      };

      const result = donationFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('valid food type');
      }
    });

    it('rejects title that is too short', () => {
      const invalidData = {
        title: 'Ab', // Too short
        foodType: 'vegetables' as const,
        quantity: '1 kg',
        pickupLocation: 'Test Location'
      };

      const result = donationFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 3 characters');
      }
    });

    it('rejects expiry time in the past', () => {
      const invalidData = {
        title: 'Test Food',
        foodType: 'vegetables' as const,
        quantity: '1 kg',
        pickupLocation: 'Test Location',
        expiryTime: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };

      const result = donationFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('in the future');
      }
    });

    it('validates Kenyan phone numbers', () => {
      const validWithCountryCode = {
        title: 'Test Food',
        foodType: 'vegetables' as const,
        quantity: '1 kg',
        pickupLocation: 'Test Location',
        contactPhone: '+254712345678'
      };

      const validLocal = {
        title: 'Test Food',
        foodType: 'vegetables' as const,
        quantity: '1 kg',
        pickupLocation: 'Test Location',
        contactPhone: '0712345678'
      };

      expect(donationFormSchema.safeParse(validWithCountryCode).success).toBe(true);
      expect(donationFormSchema.safeParse(validLocal).success).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      const invalidData = {
        title: 'Test Food',
        foodType: 'vegetables' as const,
        quantity: '1 kg',
        pickupLocation: 'Test Location',
        contactPhone: '12345' // Invalid format
      };

      const result = donationFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('valid Kenyan phone number');
      }
    });
  });

  describe('alertFormSchema', () => {
    it('validates correct alert data', () => {
      const validData = {
        food_type: 'vegetables' as const,
        location: 'Nairobi',
        radius_km: 15
      };

      const result = alertFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid radius values', () => {
      const tooSmall = {
        food_type: 'vegetables' as const,
        radius_km: 0
      };

      const tooLarge = {
        food_type: 'vegetables' as const,
        radius_km: 150
      };

      expect(alertFormSchema.safeParse(tooSmall).success).toBe(false);
      expect(alertFormSchema.safeParse(tooLarge).success).toBe(false);
    });
  });

  describe('profileSchema', () => {
    it('validates correct profile data', () => {
      const validData = {
        full_name: 'John Doe',
        role: 'donor' as const,
        organization_name: 'Food Bank Kenya',
        contact_phone: '+254712345678',
        location: 'Nairobi, Kenya'
      };

      const result = profileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects name that is too short', () => {
      const invalidData = {
        full_name: 'A', // Too short
        role: 'donor' as const
      };

      const result = profileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 2 characters');
      }
    });
  });

  describe('Utility Functions', () => {
    describe('validateEmail', () => {
      it('validates correct email formats', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      });

      it('rejects invalid email formats', () => {
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('test@')).toBe(false);
        expect(validateEmail('@domain.com')).toBe(false);
        expect(validateEmail('test@domain')).toBe(false);
      });
    });

    describe('validatePhoneNumber', () => {
      it('validates Kenyan phone numbers', () => {
        expect(validatePhoneNumber('+254712345678')).toBe(true);
        expect(validatePhoneNumber('0712345678')).toBe(true);
        expect(validatePhoneNumber('+254 712 345 678')).toBe(true); // With spaces
      });

      it('allows empty phone numbers', () => {
        expect(validatePhoneNumber('')).toBe(true);
      });

      it('rejects invalid phone numbers', () => {
        expect(validatePhoneNumber('12345')).toBe(false);
        expect(validatePhoneNumber('+1234567890')).toBe(false);
        expect(validatePhoneNumber('0812345678')).toBe(false); // Wrong prefix
      });
    });

    describe('sanitizeInput', () => {
      it('trims whitespace', () => {
        expect(sanitizeInput('  hello world  ')).toBe('hello world');
      });

      it('removes dangerous characters', () => {
        expect(sanitizeInput('hello<script>alert("xss")</script>')).toBe('helloscriptalert("xss")/script');
      });

      it('preserves safe characters', () => {
        expect(sanitizeInput('Hello, World! 123 @#$%')).toBe('Hello, World! 123 @#$%');
      });
    });
  });
});