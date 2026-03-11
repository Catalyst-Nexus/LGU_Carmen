# GSE & BAC Module - Purchase Request

This module handles the **General Services and Equipment (GSE)** and **Bids and Awards Committee (BAC)** functionality, specifically the Purchase Request process.

## Features

### Purchase Request Management

- ✅ Create, view, edit, and delete purchase requests
- ✅ Track purchase request status (Draft, Submitted, Approved, Rejected, Cancelled)
- ✅ Add multiple items to a purchase request
- ✅ Automatic calculation of total amounts
- ✅ Auto-generated PR numbers (format: PR-YYYY-####)
- ✅ Support for item specifications
- ✅ Filter by status
- ✅ Export functionality (planned)

## Database Schema

### Tables

1. **gse.unit** - Units of measure (pc, set, ream, etc.)
2. **gse.specs** - Specification types (brand, model, color, etc.)
3. **gse.items** - Master list of items that can be requested
4. **gse.item_spec** - Specifications for each item
5. **gse.purchase_request** - Purchase request header
6. **gse.purchase_request_list** - Line items for each PR

### Key Relationships

- Items can have a default unit of measure
- Items can have multiple specifications
- Purchase requests contain multiple line items
- Each line item references an item and unit

## File Structure

```
src/modules/gse&bac/
├── components/
│   ├── PurchaseRequestDialog.tsx  # Create/Edit PR dialog
│   └── index.ts
├── pages/
│   ├── PurchaseRequest.tsx        # Main PR listing page
│   └── index.ts
├── types/
│   └── gse.types.ts               # TypeScript types
└── services/
    └── gseService.ts              # Database operations
```

## Setup

### 1. Run Database Migrations

```bash
# Navigate to supabase directory
cd supabase

# Run migrations in order:
# 007_gse_bac_tables.sql     - Creates tables and schema
# 006_seed_gse_sample_data.sql - Seeds sample data
```

### 2. Sample Data

The seed file includes:

- Common units (PC, SET, UNIT, BOX, PACK, REAM, BUNDLE)
- Common specifications (BRAND, MODEL, COLOR, SIZE, etc.)
- Sample items including a MATEPAD 11.5 2025 tablet with full specs

### 3. Add Route

Add the route to your application router:

```tsx
import { PurchaseRequest } from "@/modules/gse&bac/pages";

// In your routes configuration
{
  path: "/gse/purchase-request",
  element: <PurchaseRequest />
}
```

## Usage

### Creating a Purchase Request

1. Click "New Purchase Request" button
2. Fill in the header information:
   - PR Number (auto-generated)
   - Date
   - Requesting Entity/Office
   - Section (optional)
   - Purpose
   - Remarks (optional)
   - Requested By
3. Add items:
   - Click "Add Item"
   - Select item from dropdown
   - Select unit of measure
   - Enter quantity
   - Enter estimated unit price
   - Add specifications (optional)
4. Click "Create Purchase Request"

### Viewing Purchase Requests

- View all PRs in the main table
- Filter by status using tabs (All, Draft, Submitted, Approved, Rejected)
- Statistics show counts for each status
- Click eye icon to view details
- Click edit icon for draft PRs
- Click delete icon for draft PRs

## Data Flow

1. **Create PR** → Generates PR number → Saves to `purchase_request` table
2. **Add Items** → Saves to `purchase_request_list` table
3. **Calculate Total** → Updates `pr_total_amount` in purchase request
4. **Submit PR** → Changes status to 'SUBMITTED'
5. **Approve/Reject** → Updates status and approval fields

## Static Data Used

Since responsibility_center and responsibility_center_section tables may not exist yet:

- The `rc_id` field accepts text input for now (e.g., "PROVINCIAL HEALTH OFFICE")
- The `rcs_id` field is optional

**Note:** Update the foreign key constraints in migration file once you have the proper responsibility center tables.

## Features to Implement

- [ ] View PR details dialog
- [ ] Submit PR functionality
- [ ] Approve/Reject workflow
- [ ] Export to Excel/PDF
- [ ] Print PR form
- [ ] Item search/autocomplete
- [ ] Bulk import items
- [ ] Attach supporting documents
- [ ] Approval history/audit trail
- [ ] Budget checking integration

## API Reference

### Services (gseService.ts)

```typescript
// Fetch operations
fetchPurchaseRequests(): Promise<PurchaseRequest[]>
fetchPurchaseRequestById(pr_id: string)
fetchItems(): Promise<Item[]>
fetchUnits(): Promise<Unit[]>
fetchSpecs(): Promise<Spec[]>
fetchItemSpecs(i_id: string): Promise<ItemSpec[]>

// Create/Update operations
createPurchaseRequest(data: PurchaseRequestFormData)
updatePurchaseRequest(pr_id: string, data: Partial<PurchaseRequestFormData>)
addPurchaseRequestItem(pr_id: string, item: PurchaseRequestListFormData)
deletePurchaseRequestItem(prl_id: string, pr_id: string)

// Utilities
generatePRNumber(): Promise<string>
```

## Notes

- All amounts are stored with 2 decimal places
- Quantities support up to 3 decimal places
- PR numbers are unique and auto-incremented per year
- Deleting a PR cascades to delete all line items
- Status can only be one of: DRAFT, SUBMITTED, APPROVED, REJECTED, CANCELLED
- Draft PRs can be edited and deleted
- Approved/Rejected PRs are read-only

## Screenshots Reference

Based on the provided Purchase Request form from Agusan del Norte Provincial Hospital, the implementation includes:

- Header with office information
- Item listing with specifications
- Unit cost and estimated amounts
- Purpose and signature sections
- Proper formatting and layout
