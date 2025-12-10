# Contact Chronicle API Design

## Overview

Contact Chronicle is a Next.js application that uses **Supabase** as its backend database service. The application interacts with Supabase directly from the client-side using the Supabase JavaScript client library. This document outlines the API design and data operations.

---

## Architecture

- **Frontend**: Next.js (React) with TypeScript
- **Backend**: Supabase (PostgreSQL database with REST API)
- **Client Library**: `@supabase/supabase-js`

The application uses Supabase's client-side API methods to perform CRUD operations directly from the browser, rather than using traditional REST API endpoints.

---

## Database Schema

### 1. Contacts Table

**Table Name**: `contacts`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NOT NULL | Primary key (auto-generated) |
| `first_name` | TEXT | NULL | First name of the contact |
| `last_name` | TEXT | NULL | Last name of the contact |
| `email` | TEXT | NULL | Email address |
| `phone` | TEXT | NULL | Phone number |
| `linkedin` | TEXT | NULL | LinkedIn profile URL or identifier |
| `date_added` | TEXT | NULL | Date when contact was originally added (from source) |
| `date_edited` | TEXT | NULL | Date when contact was last edited (from source) |
| `source` | TEXT | NULL | Source of the contact (e.g., LinkedIn, Google) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Auto-generated timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Auto-updated on row modification |

**Indexes**:
- `idx_contacts_email` on `email`
- `idx_contacts_last_name` on `last_name`
- `idx_contacts_source` on `source`
- `idx_contacts_created_at` on `created_at`

**Row Level Security**: Currently set to allow public access (all operations allowed without authentication)

---

### 2. Timeline Rows Table

**Table Name**: `timeline_rows`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NOT NULL | Primary key (auto-generated) |
| `month_year` | TEXT | NULL | Month and year in format MM/YYYY (e.g., "09/2025") |
| `professional_event` | TEXT | NULL | Key professional milestone or event |
| `personal_event` | TEXT | NULL | Key personal milestone or event |
| `geographic_event` | TEXT | NULL | Key geographic location change or event |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Auto-generated timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Auto-updated on row modification |

**Indexes**:
- `idx_timeline_rows_created_at` on `created_at`

**Row Level Security**: Currently set to allow public access (all operations allowed without authentication)

---

## API Operations

### Contacts API

#### 1. Insert Contacts (Bulk Upload)

**Operation**: `supabase.from('contacts').insert(contactsToInsert).select()`

**Location**: `app/upload-contacts/page.tsx` (lines 143-146)

**Request Format**:
```typescript
const contactsToInsert = {
  first_name: string | null,
  last_name: string | null,
  email: string | null,
  phone: string | null,
  linkedin: string | null,
  date_added: string | null,
  date_edited: string | null,
  source: string | null
}[]
```

**Response Format**:
```typescript
{
  data: DatabaseContact[] | null,
  error: PostgrestError | null
}

interface DatabaseContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  date_added: string | null;
  date_edited: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}
```

**Usage**: Used when uploading CSV files containing contact information.

---

#### 2. Fetch All Contacts

**Operation**: `supabase.from('contacts').select('*').order('created_at', { ascending: false })`

**Location**: `app/view-chronicle/page.tsx` (lines 76-79)

**Request Format**: No parameters

**Response Format**:
```typescript
{
  data: DatabaseContact[] | null,
  error: PostgrestError | null
}
```

**Usage**: Fetches all contacts for display in the View Chronicle page, ordered by most recently created first.

---

#### 3. Check for Saved Contacts (Count Query)

**Operation**: `supabase.from('contacts').select('id').limit(1)`

**Location**: `app/my-timeline/page.tsx` (lines 97-100)

**Request Format**: No parameters

**Response Format**:
```typescript
{
  data: { id: string }[] | null,
  error: PostgrestError | null
}
```

**Usage**: Checks if any contacts exist in the database (quick existence check).

---

### Timeline API

#### 1. Insert Timeline Rows (Bulk Insert)

**Operation**: `supabase.from('timeline_rows').insert(rowsToInsert).select()`

**Location**: `app/my-timeline/page.tsx` (lines 415-418)

**Request Format**:
```typescript
const rowsToInsert = {
  month_year: string | null,
  professional_event: string | null,
  personal_event: string | null,
  geographic_event: string | null
}[]
```

**Response Format**:
```typescript
{
  data: DatabaseTimelineRow[] | null,
  error: PostgrestError | null
}

interface DatabaseTimelineRow {
  id: string;
  month_year: string | null;
  professional_event: string | null;
  personal_event: string | null;
  geographic_event: string | null;
  created_at?: string;
  updated_at?: string;
}
```

**Usage**: Saves multiple timeline entries at once from the timeline form.

---

#### 2. Fetch All Timeline Rows

**Operation**: `supabase.from('timeline_rows').select('*')`

**Location**: `app/my-timeline/page.tsx` (lines 154-156) and `app/view-chronicle/page.tsx` (lines 184-187)

**Request Format**: No parameters

**Response Format**:
```typescript
{
  data: DatabaseTimelineRow[] | null,
  error: PostgrestError | null
}
```

**Usage**: 
- Fetches all timeline rows for display in timeline view (`my-timeline/page.tsx`)
- Fetches timeline events for filtering in View Chronicle page (`view-chronicle/page.tsx`)

**Additional Processing**: 
- In `my-timeline/page.tsx`: Results are sorted chronologically by `month_year`
- In `view-chronicle/page.tsx`: Results are ordered by `created_at` ascending

---

#### 3. Check for Saved Timeline Entries

**Operation**: `supabase.from('timeline_rows').select('id').limit(1)`

**Location**: `app/my-timeline/page.tsx` (lines 97-100)

**Request Format**: No parameters

**Response Format**:
```typescript
{
  data: { id: string }[] | null,
  error: PostgrestError | null
}
```

**Usage**: Checks if any timeline entries exist in the database to conditionally show the "View Timeline" button.

---

#### 4. Update Timeline Row

**Operation**: `supabase.from('timeline_rows').update(updateData).eq('id', rowId)`

**Location**: `app/my-timeline/page.tsx` (lines 269-272)

**Request Format**:
```typescript
// First, fetch current row
const { data: currentRow } = await supabase
  .from('timeline_rows')
  .select('*')
  .eq('id', editingEvent.rowId)
  .single();

// Then update
const updateData: Partial<DatabaseTimelineRow> = {
  month_year: string, // Format: "MM/YYYY"
  professional_event?: string | null,
  personal_event?: string | null,
  geographic_event?: string | null
};
```

**Response Format**:
```typescript
{
  data: DatabaseTimelineRow[] | null,
  error: PostgrestError | null
}
```

**Usage**: Updates a specific timeline row when editing an event from the timeline visualization.

---

#### 5. Delete Timeline Row or Clear Event Field

**Operation**: 
- Delete: `supabase.from('timeline_rows').delete().eq('id', rowId)`
- Update (clear field): `supabase.from('timeline_rows').update(updateData).eq('id', rowId)`

**Location**: `app/my-timeline/page.tsx` (lines 293-366)

**Request Format**:
```typescript
// First, fetch current row
const { data: currentRow } = await supabase
  .from('timeline_rows')
  .select('*')
  .eq('id', event.rowId)
  .single();

// If all events will be empty after deletion, delete the row
// Otherwise, update to clear the specific field:
const updateData: Partial<DatabaseTimelineRow> = {
  professional_event: null,  // or personal_event or geographic_event
};
```

**Response Format**:
```typescript
{
  data: DatabaseTimelineRow[] | null,
  error: PostgrestError | null
}
```

**Usage**: Deletes a timeline event. If all three event fields (professional, personal, geographic) will be empty, the entire row is deleted. Otherwise, only the specific event field is cleared.

---

## Data Transformation

### Contact Data Mapping

**CSV Format → Database Format** (`app/upload-contacts/page.tsx`):
```typescript
// CSV columns are parsed and mapped as follows:
{
  firstName → first_name,
  lastName → last_name,
  email → email,
  phone → phone,
  linkedIn → linkedin,
  dateAdded → date_added,
  dateEdited → date_edited,
  source → source
}
```

**Database Format → UI Format** (`app/view-chronicle/page.tsx`):
```typescript
{
  id: dbContact.id,
  name: `${dbContact.first_name || ''} ${dbContact.last_name || ''}`.trim(),
  email: dbContact.email || '',
  phone: dbContact.phone || '',
  linkedin: dbContact.linkedin || '',
  dateAdded: dbContact.date_added || dbContact.created_at.split('T')[0],
  source: dbContact.source || 'Unknown',
  notes: '' // Client-side only
}
```

---

### Timeline Data Mapping

**Form Format → Database Format** (`app/my-timeline/page.tsx`):
```typescript
{
  monthYear → month_year,
  professionalEvent → professional_event,
  personalEvent → personal_event,
  geographicEvent → geographic_event
}
```

**Database Format → Timeline Event Format** (`app/my-timeline/page.tsx`):
```typescript
// Each timeline row can produce up to 3 events (one per event type)
TimelineEvent[] = [
  {
    id: `${row.id}-professional`,
    year: number,
    month: number,
    eventTitle: 'Professional Event',
    eventDescription: row.professional_event,
    eventType: 'Professional',
    rowId: row.id
  },
  // ... similar for personal and geographic events
]
```

---

## Date Format Handling

### Month/Year Format

The `month_year` field accepts multiple formats and is parsed accordingly:

- **MM/YYYY** (e.g., "09/2025") - Primary format
- **MM-YYYY** (e.g., "09-2025")
- **YYYY-MM** (e.g., "2024-01")
- **YYYY** (e.g., "2024") - Defaults to January

### Contact Date Format

- **date_added**: Stored as TEXT, can be in various formats from source systems
- **created_at**: Auto-generated ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
- Display format: Full date (e.g., "January 15, 2024") via `formatDateToFull()`

---

## Error Handling

All Supabase operations return an error object that is checked:

```typescript
const { data, error } = await supabase.from('table').operation();

if (error) {
  console.error('Error:', error);
  // Display error message to user
  throw error;
}
```

Common error scenarios:
- Missing Supabase configuration (environment variables)
- Database connection issues
- Validation errors (constraint violations)
- Row Level Security policy violations (if RLS is enabled)

---

## Authentication & Authorization

**Current Setup**: Public access (no authentication required)

**RLS Policies**: Both tables have policies allowing all operations without authentication:
```sql
CREATE POLICY "Allow public access to [table]"
  ON [table]
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

**Future Multi-User Setup**: The SQL schema files include commented-out policies for user-specific access using `user_id` foreign key to `auth.users(id)`.

---

## Rate Limiting & Performance

- **Bulk Operations**: Contacts and timeline rows support bulk inserts
- **Pagination**: Currently fetching all records; pagination can be added using `.range()` or `.limit()`
- **Indexing**: Key fields are indexed for faster queries
- **Client-Side Filtering**: View Chronicle page performs filtering on the client-side after fetching all records

---

## Environment Variables

Required for Supabase client initialization:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

These are checked at runtime via `isSupabaseConfigured()` helper function.

---

## API Summary Table

| Operation | Table | Method | Location |
|-----------|-------|--------|----------|
| Insert Contacts (Bulk) | `contacts` | `insert()` | `upload-contacts/page.tsx` |
| Fetch All Contacts | `contacts` | `select()` | `view-chronicle/page.tsx` |
| Check Contacts Exist | `contacts` | `select().limit(1)` | `my-timeline/page.tsx` |
| Insert Timeline Rows (Bulk) | `timeline_rows` | `insert()` | `my-timeline/page.tsx` |
| Fetch All Timeline Rows | `timeline_rows` | `select()` | `my-timeline/page.tsx`, `view-chronicle/page.tsx` |
| Check Timeline Exists | `timeline_rows` | `select().limit(1)` | `my-timeline/page.tsx` |
| Update Timeline Row | `timeline_rows` | `update()` | `my-timeline/page.tsx` |
| Delete Timeline Row | `timeline_rows` | `delete()` | `my-timeline/page.tsx` |
| Update Timeline Event Field | `timeline_rows` | `update()` | `my-timeline/page.tsx` |

---

## Future Enhancements

Potential API improvements:

1. **Pagination**: Add `.range()` or `.limit()` for large datasets
2. **Filtering**: Move filtering to server-side using Supabase `.filter()` methods
3. **Search**: Implement full-text search using Supabase search capabilities
4. **Real-time**: Add Supabase real-time subscriptions for live updates
5. **File Storage**: Use Supabase Storage for CSV file uploads instead of client-side parsing
6. **Authentication**: Implement user authentication and user-specific data access
7. **API Endpoints**: Create Next.js API routes for server-side operations if needed

---

## Notes

- All database operations are performed directly from the client-side using Supabase's JavaScript client
- No traditional REST API endpoints are defined in this application
- Supabase automatically handles CORS, authentication, and provides a REST API endpoint for each table
- The actual Supabase REST API endpoints follow the pattern: `https://[project].supabase.co/rest/v1/[table]`

