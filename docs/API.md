# FoodShare Kenya API Documentation

This document outlines the API endpoints and database functions available in the FoodShare Kenya application.

## Authentication

All API endpoints require authentication through Supabase Auth, except where noted as public. Users must be logged in to access protected endpoints.

## Database Tables

### `profiles`
User profile information with role-based access control.

**Columns:**
- `user_id` (UUID, Primary Key) - References auth.users
- `full_name` (TEXT) - User's display name
- `role` (user_role ENUM) - 'donor', 'recipient', or 'admin'
- `organization_name` (TEXT, Optional) - For recipients and admins
- `contact_phone` (TEXT, Optional) - Contact phone number
- `location` (TEXT, Optional) - User's location
- `created_at` (TIMESTAMPTZ) - Account creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Row Level Security:**
- Users can view their own profiles
- Admin users can view and manage all profiles
- Public access to organization info for recipients/admins

### `food_donations`
Food donation listings from donors.

**Columns:**
- `id` (UUID, Primary Key) - Unique donation identifier
- `donor_id` (UUID) - References profiles.user_id
- `title` (TEXT) - Donation title/name
- `description` (TEXT, Optional) - Detailed description
- `food_type` (food_category ENUM) - Category of food
- `quantity` (TEXT) - Amount description
- `pickup_location` (TEXT) - Where to collect food
- `expiry_time` (TIMESTAMPTZ, Optional) - Best before date
- `contact_phone` (TEXT, Optional) - Donor contact
- `special_instructions` (TEXT, Optional) - Pickup instructions
- `status` (donation_status ENUM) - Current status
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Row Level Security:**
- Donors can create and manage their own donations
- Public read access for available donations
- Admins can manage all donations

### `donation_claims`
Claims made by recipients on food donations.

**Columns:**
- `id` (UUID, Primary Key) - Unique claim identifier
- `donation_id` (UUID) - References food_donations.id
- `recipient_id` (UUID) - References profiles.user_id
- `status` (claim_status ENUM) - Current claim status
- `notes` (TEXT, Optional) - Recipient notes
- `created_at` (TIMESTAMPTZ) - Claim creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Row Level Security:**
- Recipients can create and view their own claims
- Donors can view claims on their donations
- Admins can manage all claims

### `food_alerts`
User preferences for food notifications.

**Columns:**
- `id` (UUID, Primary Key) - Unique alert identifier
- `user_id` (UUID) - References profiles.user_id
- `food_type` (food_category ENUM) - Food category to watch
- `location` (TEXT, Optional) - Preferred location
- `radius_km` (INTEGER) - Search radius in kilometers
- `is_active` (BOOLEAN) - Whether alert is enabled
- `created_at` (TIMESTAMPTZ) - Alert creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Row Level Security:**
- Users can manage their own alerts
- No public access

## Enums

### `user_role`
- `donor` - Can create food donations
- `recipient` - Can claim food donations
- `admin` - Full system access

### `food_category`
- `fruits` - Fresh fruits
- `vegetables` - Fresh vegetables
- `grains` - Grains and cereals
- `dairy` - Dairy products
- `meat` - Meat and poultry
- `prepared` - Prepared meals
- `baked` - Baked goods
- `other` - Other food items

### `donation_status`
- `available` - Available for claiming
- `claimed` - Claimed by recipient
- `completed` - Successfully collected
- `expired` - Expired and removed

### `claim_status`
- `pending` - Awaiting donor approval
- `approved` - Approved by donor
- `completed` - Successfully collected
- `cancelled` - Cancelled by recipient or donor

## Database Functions

### Public Functions (No Authentication Required)

#### `get_public_donations()`
Returns all available food donations for public browsing.

**Returns:**
```sql
TABLE(
  id UUID,
  donor_id UUID,
  title TEXT,
  description TEXT,
  food_type food_category,
  quantity TEXT,
  pickup_location TEXT,
  expiry_time TIMESTAMPTZ,
  status donation_status,
  special_instructions TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Usage:**
```sql
SELECT * FROM get_public_donations();
```

#### `get_public_profile_info(profile_user_id UUID)`
Returns public profile information for recipients and admins.

**Parameters:**
- `profile_user_id` (UUID) - User ID to get info for

**Returns:**
```sql
TABLE(
  user_id UUID,
  organization_name TEXT,
  role user_role
)
```

**Usage:**
```sql
SELECT * FROM get_public_profile_info('user-uuid-here');
```

### Authenticated Functions

#### `get_donor_contact_for_claim(donation_uuid UUID)`
Returns donor contact information for approved claims.

**Parameters:**
- `donation_uuid` (UUID) - Donation ID

**Returns:**
```sql
TABLE(
  contact_phone TEXT,
  donor_name TEXT,
  donor_organization TEXT
)
```

**Security:** Only returns data if the requesting user has an approved claim.

**Usage:**
```sql
SELECT * FROM get_donor_contact_for_claim('donation-uuid-here');
```

## Triggers

### `update_updated_at_column()`
Automatically updates the `updated_at` timestamp when records are modified.

**Applied to:**
- `profiles`
- `food_donations`
- `donation_claims`
- `food_alerts`

### `delete_expired_donations()`
Automatically deletes donations and related claims when marked as expired.

**Trigger:** Activated when `food_donations.status` is updated to 'expired'

## Edge Functions

### `notify-donor`
Sends notifications to donors when their donations are claimed.

**Endpoint:** `/functions/v1/notify-donor`

**Method:** POST

**Payload:**
```json
{
  "donationId": "uuid",
  "recipientId": "uuid",
  "claimId": "uuid"
}
```

### `notify-donor-email`
Sends email notifications to donors about claims.

**Endpoint:** `/functions/v1/notify-donor-email`

**Method:** POST

**Payload:**
```json
{
  "donorEmail": "string",
  "donationTitle": "string",
  "recipientName": "string",
  "claimNotes": "string"
}
```

## Error Handling

### Common Error Codes

- **23505** - Duplicate entry (unique constraint violation)
- **23503** - Foreign key constraint violation
- **42501** - Insufficient permissions
- **42P01** - Table does not exist
- **JWT** - Authentication token expired/invalid

### Error Response Format

All errors follow a consistent format:
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": "Additional error context"
  }
}
```

## Rate Limiting

- **Claims:** Max 5 claims per user per hour
- **Donations:** Max 10 donations per user per day
- **Alerts:** Max 20 active alerts per user

## Best Practices

1. **Always validate input** on the client side before API calls
2. **Handle errors gracefully** with user-friendly messages
3. **Use transactions** for operations affecting multiple tables
4. **Implement proper loading states** for async operations
5. **Cache frequently accessed data** like food categories
6. **Use real-time subscriptions** for live updates where appropriate

## Testing

Use the following test data for development:

### Test Users
```sql
-- Test donor
INSERT INTO profiles (user_id, full_name, role, contact_phone)
VALUES ('donor-uuid', 'Test Donor', 'donor', '+254712345678');

-- Test recipient
INSERT INTO profiles (user_id, full_name, role, organization_name)
VALUES ('recipient-uuid', 'Test Recipient', 'recipient', 'Test Food Bank');
```

### Test Donations
```sql
INSERT INTO food_donations (
  donor_id, title, food_type, quantity, pickup_location, status
) VALUES (
  'donor-uuid', 'Fresh Vegetables', 'vegetables', '10 kg', 
  'Test Location, Nairobi', 'available'
);
```

## Support

For API support and questions:
- Check the application logs in Supabase Dashboard
- Review RLS policies for permission issues
- Use Supabase's built-in API documentation
- Test endpoints using the Supabase API client