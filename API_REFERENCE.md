# RentWise API Documentation

This document outlines the direct database interactions and Next.js server actions / frontend API calls used within the RentWise application. Since RentWise utilizes Supabase as a Backend-as-a-Service (BaaS), standard RESTful backend endpoints are replaced by authorized direct data queries via the `@supabase/supabase-js` client.

## 1. Authentication API (Supabase Auth)

All authentication processes are managed natively by Supabase, enforcing JWT token validation on all subsequent data requests via Row Level Security (RLS).

### POST - User Registration
**Endpoint/Method:** `supabase.auth.signUp()`
**Payload:**
```json
{
  "email": "user@email.com",
  "password": "securepassword123",
  "options": {
    "data": {
      "role": "tenant" // or "landlord"
    }
  }
}
```
**Functionality:** Registers a new user. The custom `role` metadata dictates whether the user has access to the Tenant Dashboard (Favorites) or the Landlord Dashboard (Uploads).

### POST - User Login
**Endpoint/Method:** `supabase.auth.signInWithPassword()`
**Payload:**
```json
{
  "email": "user@email.com",
  "password": "securepassword123"
}
```
**Functionality:** Authenticates the user and sets an encrypted session cookie via `@supabase/ssr` resolving session state globally.

---

## 2. Properties CRUD Operations

The `properties` table contains the core real estate listings. It is strictly secured via RLS policies: anyone can read (`GET`), but only authenticated `landlord` users can insert/update/delete their own listings.

### GET - Fetch All Properties / Search & Filter
**Endpoint/Method:** `supabase.from('properties').select('*, areas(name)')`
**Query Modifications:**
- `.eq('area_id', ID)`
- `.eq('property_type', '2BHK')`
- `.gte('rent', MIN_RENT)`
- `.lte('rent', MAX_RENT)`
- `.eq('furnishing_status', 'Furnished')`
- `.order('rent', { ascending: true / false })`
**Functionality:** Powers the `/properties` page. Retrieves a joined list of properties matching the complex boolean filter logic invoked by the user.

### GET - Fetch Single Property Details
**Endpoint/Method:** `supabase.from('properties').select('*, areas(name)').eq('property_id', ID).single()`
**Functionality:** Powers the `/properties/[id]` dynamic route. Returns the vast metadata payload including Amenities arrays, Bathrooms, Parking, Description, and base64 Image Data.

### POST - Create Property Listing (Landlords Only)
**Endpoint/Method:** `supabase.from('properties').insert({...})`
**Payload:**
```json
{
  "landlord_id": "uuid-string",
  "area_id": 3,
  "address": "123 Tech Park Ave",
  "property_type": "2BHK",
  "size": 1200,
  "rent": 45000,
  "preferences": "Vegetarians preferred",
  "landlord_phone": "+91 9876543210",
  "google_maps_link": "https://maps...",
  "image_data": "base64_encoded_string_here"
}
```
**Functionality:** Uploads a new matrix record. Executed from the Landlord Dashboard. Includes Base64 binary parsing for image storage directly into the Postgres instance.

### DELETE - Remove Property (Landlords Only)
**Endpoint/Method:** `supabase.from('properties').delete().eq('property_id', ID)`
**Functionality:** Permanent removal of a listing. RLS prevents Landlord A from modifying Landlord B's records.

---

## 3. Tenant Favorites Operations

The `favorites` table establishes a Many-to-Many relationship between User UUIDs and Property IDs.

### GET - Fetch Saved Properties
**Endpoint/Method:** 
```typescript
supabase.from('favorites')
  .select('property_id, properties(*, areas(name))')
  .eq('user_id', USER_ID)
```
**Functionality:** Triggers upon Tenant Dashboard mount. Extracts deeply nested joined data to construct the saved PropertyCards natively.

### POST - Save Property
**Endpoint/Method:** `supabase.from('favorites').insert({ user_id: ID, property_id: ID })`
**Functionality:** Adds a mapping to the favorites table. Handled securely via the heart toggle UI.

### DELETE - Unsave Property
**Endpoint/Method:** `supabase.from('favorites').delete().eq('user_id', ID).eq('property_id', ID)`
**Functionality:** Removes the specific mapping, visually turning the heart icon empty.

---

## 4. Areas Dictionary Operations

The `areas` table maps `area_id` ints to string variables (e.g. `2` -> `Koramangala`). 
**Endpoint/Method:** `supabase.from('areas').select('*')`
**Functionality:** Populates selection menus. This operates strictly as a READ-ONLY lookup table. Wait, actually, areas are fetched via foreign key joins in the property queries, eliminating N+1 API request issues.

---

**Note:** Since we leverage Next.js App Router (React Server Components), all intensive read operations (`GET` all properties, `GET` property by ID) are rendered Server-Side. This fundamentally optimizes the Time-to-Interactive (TTI) and resolves any SEO limitations that existed in the original Node MVP.
