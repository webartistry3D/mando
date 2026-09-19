mando - A Nigerian SME Business Operations PWA
Agent-Executable MVP PRD v1.0
Status: Build-ready
Priority: MVP
Platform: Mobile-first Progressive Web App
Target Market: Nigerian SMEs
Currency: Nigerian Naira (₦)

1. Product Definition
Build a lightweight business operations PWA that enables Nigerian SMEs to manage:
Products & Services → Customers → Estimates → Invoices → Payments/Income → Expenses → Deliveries → Basic Business Performance
The application is not a full accounting/ERP
system.
Core value proposition
> **Sell → Invoice → Get Paid → Track Expenses → Deliver → Know Your Numbers**

Primary product positioning
> **A simple operating system for selling, getting paid, spending, and delivering.**


2. Target Users
Support SMEs including:
Retailers
Wholesalers
Distributors
Service businesses
Contractors
Artisans
Small manufacturers
Event businesses
Digital/creative agencies
Consultants
Food businesses
General SMEs
The product must support both product-based and service-based businesses.
Small manufacturers are supported for selling and invoicing finished goods; full manufacturing/MRP (BOMs, work orders, raw-material tracking) is out of MVP scope (see Section 4).

3. MVP Scope
Implement these modules:
Authentication & Business Workspace
Dashboard
Products & Services
Customers
Estimates / Quotations
Invoices
Payments / Income
Expenses
Basic Inventory
Deliveries / Fulfilment
Reports
Business Settings
User Roles & Permissions
Attachments
In-app notifications

4. Explicit MVP Exclusions
Do NOT implement:
Full accounting/general ledger
Payroll
Tax filing
Banking integrations
Payment gateway processing
POS hardware integration
Complex warehouse management
Route optimization
Driver mobile application
WhatsApp Business API
SMS infrastructure
Multi-currency
AI assistant
Advanced CRM
Complex subscription billing
Manufacturing/MRP
WhatsApp sharing may use a normal WhatsApp deep link with a pre-filled message. Do not require the WhatsApp Business API.

5. Core Business Workflow
Product sale
Customer
   ↓
Estimate
   ↓
Accepted
   ↓
Invoice
   ↓
Payment
   ↓
Delivery

Service sale
Customer
   ↓
Estimate
   ↓
Accepted
   ↓
Invoice
   ↓
Payment

Walk-in/direct sale
Product/Service
   ↓
Invoice/Sale
   ↓
Payment

Expense
Expense
   ↓
Business cash outflow
   ↓
Profit calculation


6. Authentication & Workspace
Functional Requirements
FR-AUTH-001
Users must be able to register and log in.
FR-AUTH-002
A user must create or belong to a business workspace.
FR-AUTH-003
Every business-owned record must be scoped to a businessId.
FR-AUTH-004
Users must never access another business's records.
FR-AUTH-005
A business owner must be able to invite/add staff.
FR-AUTH-006
Support these roles:
Owner
Manager
Staff
FR-AUTH-007
Owner has unrestricted access.
FR-AUTH-008
Manager can manage normal business operations.
FR-AUTH-009
Staff permissions must be configurable/restricted.

7. Dashboard
The dashboard is the primary business overview.
Display
Total income
Total expenses
Outstanding invoices
Pending deliveries
Current/estimated operating profit
Recent activity
Quick actions
New Sale/Invoice
New Estimate
New Customer
New Product/Service
New Expense
New Delivery
Recent activity examples
Invoice paid
Estimate accepted
Expense recorded
Delivery completed
Product stock updated
Dashboard values must be calculated from actual database records.
Do not use mock analytics.
Requirements
FR-DASH-001
Display total income for the selected period.
FR-DASH-002
Display total expenses for the selected period.
FR-DASH-003
Display outstanding invoices total.
FR-DASH-004
Display pending deliveries count.
FR-DASH-005
Display current/estimated operating profit.
FR-DASH-006
Display recent business activity.
FR-DASH-007
Provide quick actions for common create operations (invoice, estimate, customer, product/service, expense, delivery).

8. Products & Services
Product model
Fields:
Name
Type
SKU/code
Description
Selling price
Cost price
Unit
VAT/tax applicability
Inventory tracking enabled
Opening stock
Low-stock threshold
Active/inactive
Types
PRODUCT
SERVICE

Services do not require inventory tracking.
Functional Requirements
FR-PROD-001
Create product/service.
FR-PROD-002
Edit product/service.
FR-PROD-003
Archive/deactivate product/service.
FR-PROD-004
Search and filter products/services.
FR-PROD-005
View product/service transaction history.
FR-PROD-006
Track product stock where inventory tracking is enabled.
FR-PROD-007
Show low-stock products.
FR-PROD-008
Allow product cost and selling price to differ.

9. Inventory
Inventory is intentionally lightweight.
Supported transactions
STOCK_IN
STOCK_OUT
ADJUSTMENT

Requirements
FR-INVEN-001
Record stock-in.
FR-INVEN-002
Record stock-out.
FR-INVEN-003
Record manual adjustment.
FR-INVEN-004
Display current quantity.
FR-INVEN-005
Display low-stock status.
FR-INVEN-006
Maintain inventory transaction history.
FR-INVEN-007
Product sales/invoicing must be capable of reducing stock.
FR-INVEN-008
Prevent negative stock where inventory enforcement is enabled.

10. Customers
Customer fields
Name/business name
Phone
Email
Address
Customer type
Notes
Active/inactive
Requirements
FR-CUST-001
Create customer.
FR-CUST-002
Edit customer.
FR-CUST-003
Search customers.
FR-CUST-004
View customer profile.
FR-CUST-005
Display customer transaction history.
FR-CUST-006
Display:
Estimates
Invoices
Payments
Deliveries
Outstanding balance


11. Estimates / Quotations
Estimates allow a business to formally quote a customer.
Estimate fields
Estimate number
Customer
Issue date
Expiry date
Items
Quantity
Unit price
Discount
VAT/tax
Subtotal
Total
Notes
Terms
Status
Statuses
DRAFT
SENT
VIEWED
ACCEPTED
REJECTED
EXPIRED
CONVERTED

Requirements
FR-EST-001
Create estimate.
FR-EST-002
Add products/services to estimate.
FR-EST-003
Calculate line totals automatically.
FR-EST-004
Calculate subtotal.
FR-EST-005
Apply optional discount.
FR-EST-006
Apply optional VAT/tax.
FR-EST-007
Calculate final total.
FR-EST-008
Edit draft estimates.
FR-EST-009
Change estimate status.
FR-EST-010
Generate estimate PDF.
FR-EST-011
Print estimate.
FR-EST-012
Share estimate through WhatsApp.
FR-EST-013
Convert accepted estimate into invoice.
FR-EST-014
Conversion must preserve customer and line-item information.
FR-EST-015
Do not require the user to manually re-enter converted estimate data.

12. Invoicing
Invoices are a central MVP function.
Invoice fields
Invoice number
Customer (optional — omitted for walk-in/direct sales)
Issue date
Due date
Items
Quantity
Unit price
Discount
VAT/tax
Subtotal
Total
Amount paid
Balance due
Notes
Payment instructions
Status
Statuses
DRAFT
ISSUED
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED

Requirements
FR-INV-001
Create invoice manually.
FR-INV-002
Create invoice from estimate.
FR-INV-003
Add products/services.
FR-INV-004
Calculate totals automatically.
FR-INV-005
Support optional VAT/tax.
FR-INV-006
Support discounts.
FR-INV-007
Track amount paid.
FR-INV-008
Calculate outstanding balance.
FR-INV-009
Automatically identify overdue invoices based on due date and unpaid balance.
FR-INV-010
Record partial payments.
FR-INV-011
Mark invoice paid when balance reaches zero.
FR-INV-012
Generate professional PDF invoice.
FR-INV-013
Print invoice.
FR-INV-014
Share invoice through WhatsApp.
FR-INV-015
Allow invoice cancellation with appropriate permission.
FR-INV-016
Invoice numbering must be sequential within a business.
Example:
INV-00001
INV-00002
INV-00003
FR-INV-017
Support walk-in/direct sales by allowing an invoice to be created without a customer record.


13. Payments / Income
The system tracks recorded business income. It is not a payment processor.
Payment methods
BANK_TRANSFER
POS
CASH
CARD
OTHER

Payment fields
Invoice
Customer
Amount
Date
Payment method
Reference
Description
Notes
Requirements
FR-PAY-001
Record payment against an invoice.
FR-PAY-002
Allow partial payment.
FR-PAY-003
Prevent payment greater than outstanding invoice balance.
FR-PAY-004
Automatically update invoice payment status.
FR-PAY-005
Display payment history.
FR-PAY-006
Allow standalone income records where no invoice exists.
FR-PAY-007
Calculate income by date range.
FR-PAY-008
Display outstanding customer balances.

14. Expenses
Expense fields
Category
Description
Amount
Date
Vendor
Payment method
Reference
Receipt attachment
Notes
Payment method reuses the same enum as income: BANK_TRANSFER, POS, CASH, CARD, OTHER.
Default categories
Inventory
Transport
Fuel
Rent
Utilities
Salaries
Marketing
Equipment
Repairs
Logistics
Other
Categories should be configurable in future, but the default categories must be seeded.
Requirements
FR-EXP-001
Create expense.
FR-EXP-002
Edit expense.
FR-EXP-003
Delete/cancel expense according to permissions.
FR-EXP-004
Attach receipt/photo.
FR-EXP-005
Search/filter expenses.
FR-EXP-006
Calculate expenses by date range.
FR-EXP-007
Group expenses by category.

15. Profit / Business Performance
The MVP must provide a simple operating view.
Revenue
- Expenses
= Operating Profit

Do not implement formal accounting profit/loss statements.
Requirements
FR-PROFIT-001
Calculate revenue from recorded income/payments within the selected date range. Revenue is the sum of all payments (against invoices or standalone income) recorded in that range.
FR-PROFIT-002
Calculate total expenses.
FR-PROFIT-003
Calculate operating profit.
FR-PROFIT-004
Support date filters.
Example:
Today
This week
This month
Last month
Custom range


16. Deliveries / Fulfilment
Deliveries apply primarily to physical products.
Delivery fields
Delivery number
Customer
Invoice
Delivery address
Recipient
Phone
Items
Delivery fee
Assigned rider/driver
Tracking/reference number
Notes
Status
Delivery date/time
Recipient confirmation
Optional proof photo
Statuses
PENDING
PROCESSING
OUT_FOR_DELIVERY
DELIVERED
FAILED
CANCELLED

Requirements
FR-DEL-001
Create delivery from invoice.
FR-DEL-002
Preserve invoice/customer/item information.
FR-DEL-003
Edit delivery before dispatch.
FR-DEL-004
Assign delivery personnel manually.
FR-DEL-005
Update delivery status.
FR-DEL-006
Record recipient name.
FR-DEL-007
Record delivery completion timestamp.
FR-DEL-008
Allow optional proof-of-delivery photo.
FR-DEL-009
View delivery history.
FR-DEL-010
Filter deliveries by status/date.
No route optimization or live driver tracking is required.

17. Reports
Implement simple operational reports.
Sales report
Display:
Revenue
Invoice count
Paid amount
Outstanding amount
Expense report
Display:
Total expenses
Expenses by category
Profit report
Revenue
Expenses
Operating profit

Product report
Best-selling products
Low-stock products
Customer report
Top customers
Outstanding balances
Requirements
FR-REPORT-001
All reports must support date filtering.
FR-REPORT-002
Reports must use real database data.
FR-REPORT-003
Display reports responsively on mobile.
CSV/PDF export may be implemented if straightforward but is not a blocker for core MVP completion.

18. Business Settings
Business profile
Support:
Business name
Logo
CAC/business registration number
Address
Phone
Email
Currency
Invoice prefix
Estimate prefix
Delivery prefix
Tax/VAT configuration
Payment instructions
Currency defaults to:
₦

Number formats
Examples:
EST-00001
INV-00001
DEL-00001

Number sequences must be isolated per business.

19. PDF Documents
Generate professional PDFs for:
Estimates
Invoices
Documents should contain:
Business logo
Business information
Customer information
Document number
Dates
Line items
Quantity
Unit price
Discount
Tax where applicable
Subtotal
Total
Payment instructions
Notes/terms
PDFs must be printable and mobile-shareable.

20. WhatsApp Sharing
Do not integrate WhatsApp Business API in MVP.
For estimates/invoices:
Generate PDF.
Provide download/share capability.
Provide a WhatsApp action using a deep link/pre-filled message where supported.
Example message concept:
Hello [Customer Name],

Please find your invoice [INV-00001] for ₦[amount].

Thank you.
[Business Name]

Do not claim successful delivery through WhatsApp. The application only initiates the user's sharing flow.

21. Attachments
Use Google Cloud Storage for uploaded files.
Initial attachment use cases:
Expense receipts
Proof-of-delivery photos
Business logo
Requirements:
Validate file type.
Validate file size.
Store metadata in PostgreSQL.
Store actual files in GCS.
Never expose private bucket credentials to the frontend.
Use signed URLs or backend-mediated access for private files.

22. Notifications
MVP notifications are in-app.
Trigger examples:
Invoice overdue
Estimate expiring
Low stock
Payment recorded
Delivery pending
Delivery completed
Email/SMS/WhatsApp notifications are not required.

23. Database Model
Use PostgreSQL with Prisma ORM or an equivalent type-safe ORM.
All business-owned entities must include businessId.
User
id
name
email
phone
passwordHash
createdAt
updatedAt

Business
id
name
logoAttachmentId
cacNumber
address
phone
email
createdAt
updatedAt

BusinessMember
id
businessId
userId
role
createdAt
updatedAt

Role:
OWNER
MANAGER
STAFF


BusinessSettings
id
businessId
currency
invoicePrefix
estimatePrefix
deliveryPrefix
taxEnabled
taxRate
paymentInstructions
createdAt
updatedAt


Customer
id
businessId
name
phone
email
address
customerType
notes
isActive
createdAt
updatedAt


Product
id
businessId
name
type
sku
description
sellingPrice
costPrice
unit
taxEnabled
inventoryTracking
openingStock
lowStockThreshold
isActive
createdAt
updatedAt

Type:
PRODUCT
SERVICE


InventoryTransaction
id
businessId
productId
type
quantity
referenceType
referenceId
reason
createdById
createdAt

Type:
STOCK_IN
STOCK_OUT
ADJUSTMENT

Current stock may be derived from transactions rather than treated as an independently editable source of truth.

Estimate
id
businessId
customerId
number
status
issueDate
expiryDate
subtotal
discount
tax
total
notes
terms
createdById
createdAt
updatedAt

EstimateItem
id
estimateId
productId
description
quantity
unitPrice
discount
tax
lineTotal


Invoice
id
businessId
customerId
estimateId
number
status
issueDate
dueDate
subtotal
discount
tax
total
amountPaid
balanceDue
notes
paymentInstructions
createdById
createdAt
updatedAt

estimateId is nullable.
customerId is nullable to support walk-in/direct sales where no customer record exists.
InvoiceItem
id
invoiceId
productId
description
quantity
unitPrice
discount
tax
lineTotal


Payment
id
businessId
invoiceId
customerId
amount
paymentMethod
paymentDate
reference
description
notes
createdById
createdAt
updatedAt

invoiceId is nullable for standalone income.
customerId is nullable for payments against walk-in/direct sales.

ExpenseCategory
id
businessId
name
createdAt
updatedAt

Seed default categories for each new business.

Expense
id
businessId
categoryId
description
amount
date
vendor
paymentMethod
reference
notes
createdById
createdAt
updatedAt


Delivery
id
businessId
invoiceId
customerId
number
deliveryAddress
recipientName
recipientPhone
deliveryFee
assignedPerson
trackingReference
status
notes
deliveredAt
recipientConfirmation
proofPhotoAttachmentId
createdById
createdAt
updatedAt

customerId is nullable for deliveries originating from walk-in/direct sales; recipient details are captured directly.
recipientConfirmation captures the recipient's name/signature acknowledgement on delivery.
proofPhotoAttachmentId is nullable and references an Attachment record for the optional proof-of-delivery photo.

DeliveryItem
id
deliveryId
productId
description
quantity


Attachment
id
businessId
entityType
entityId
fileName
mimeType
fileSize
storageKey
createdById
createdAt


Notification
id
businessId
userId
type
title
message
isRead
createdAt


AuditLog
Recommended for MVP where practical:
id
businessId
userId
action
entityType
entityId
metadata
createdAt

Use it for important actions such as invoice cancellation and financial record changes.

24. Database Constraints
Implement:
Foreign keys.
Business-level tenant isolation.
Unique (businessId, email) where appropriate.
Unique (businessId, number) for estimates/invoices/deliveries.
Unique (businessId, sku) for products where sku is provided.
Non-negative monetary values.
Positive quantities.
Valid status enums.
Cascading behavior defined explicitly.
Timestamps on all major entities.
Use PostgreSQL DECIMAL/NUMERIC for monetary values. Never use floating-point values for financial calculations.

25. API Architecture
Use:
Node.js
Express
TypeScript
REST API
PostgreSQL
Prisma

Authentication: JWT (JSON Web Tokens). Issue access tokens on login/register; verify on every protected route. Use AUTH_SECRET to sign tokens. Support token refresh.

Base path:
/api/v1


26. Authentication API
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me


27. Business API
GET    /api/v1/business
PATCH  /api/v1/business
DELETE /api/v1/business
GET    /api/v1/business/settings
PATCH  /api/v1/business/settings

Business Members
GET    /api/v1/business/members
POST   /api/v1/business/members
GET    /api/v1/business/members/:id
PATCH  /api/v1/business/members/:id
DELETE /api/v1/business/members/:id

POST /api/v1/business/invite

Used to invite/add staff and manage roles (Owner, Manager, Staff).
Only the Owner may add/remove members or change roles.


28. Customer API
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id
GET    /api/v1/customers/:id/transactions

DELETE deactivates the customer (sets isActive = false). It does not hard-delete the record, preserving transaction history.


29. Product API
GET    /api/v1/products
POST   /api/v1/products
GET    /api/v1/products/:id
PATCH  /api/v1/products/:id
DELETE /api/v1/products/:id
GET    /api/v1/products/:id/inventory
POST   /api/v1/products/:id/inventory
GET    /api/v1/inventory/transactions

DELETE deactivates the product/service (sets isActive = false). It does not hard-delete the record.
GET /api/v1/inventory/transactions returns business-wide inventory transaction history (supports filtering by productId, type, and date range).


30. Estimate API
GET    /api/v1/estimates
POST   /api/v1/estimates
GET    /api/v1/estimates/:id
PATCH  /api/v1/estimates/:id
DELETE /api/v1/estimates/:id
POST   /api/v1/estimates/:id/convert-to-invoice
POST   /api/v1/estimates/:id/status
GET    /api/v1/estimates/:id/pdf


31. Invoice API
GET    /api/v1/invoices
POST   /api/v1/invoices
GET    /api/v1/invoices/:id
PATCH  /api/v1/invoices/:id
POST   /api/v1/invoices/:id/status
POST   /api/v1/invoices/:id/cancel
GET    /api/v1/invoices/:id/pdf
GET    /api/v1/invoices/:id/payments


32. Payment / Income API
GET    /api/v1/payments
POST   /api/v1/payments
GET    /api/v1/payments/:id
PATCH  /api/v1/payments/:id
DELETE /api/v1/payments/:id


33. Expense API
GET    /api/v1/expenses
POST   /api/v1/expenses
GET    /api/v1/expenses/:id
PATCH  /api/v1/expenses/:id
DELETE /api/v1/expenses/:id

GET    /api/v1/expense-categories
POST   /api/v1/expense-categories
PATCH  /api/v1/expense-categories/:id


34. Delivery API
GET    /api/v1/deliveries
POST   /api/v1/deliveries
GET    /api/v1/deliveries/:id
PATCH  /api/v1/deliveries/:id
POST   /api/v1/deliveries/:id/status


35. Dashboard & Reports API
GET /api/v1/dashboard
GET /api/v1/sales/overview
GET /api/v1/reports/sales
GET /api/v1/reports/expenses
GET /api/v1/reports/profit
GET /api/v1/reports/products
GET /api/v1/reports/customers

Support query parameters:
from
to
status
category
customerId
productId


36. Attachment API
POST   /api/v1/attachments
GET    /api/v1/attachments/:id
DELETE /api/v1/attachments/:id

Upload must be authorized and business-scoped.

37. Notification API
GET  /api/v1/notifications
POST /api/v1/notifications/:id/read
POST /api/v1/notifications/read-all


38. API Standards
Every API must:
Validate request bodies.
Validate route parameters.
Validate query parameters.
Authenticate protected routes.
Authorize business membership.
Enforce role permissions.
Return consistent JSON.
Return appropriate HTTP status codes.
Never expose internal errors/secrets.
Log server-side errors.
Use pagination for potentially large collections.
Recommended response structure:
{
  "success": true,
  "data": {},
  "message": "..."
}

Error:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}


39. Frontend Architecture
Use:
React
TypeScript
Vite
React Router
TanStack Query
Zod
Tailwind CSS
shadcn/ui (component library built on Radix UI primitives)

Structure the frontend around feature modules rather than one large component tree.
Suggested:
src/
  app/
  components/
  features/
    auth/
    dashboard/
    sales/
    customers/
    products/
    estimates/
    invoices/
    payments/
    expenses/
    deliveries/
    reports/
    settings/
  hooks/
  lib/
  routes/
  types/
  utils/


40. Frontend Routes
/login
/register

/dashboard

/sales
/products
/products/new
/products/:id

/customers
/customers/new
/customers/:id

/estimates
/estimates/new
/estimates/:id

/invoices
/invoices/new
/invoices/:id

/payments
/payments
/payments/new
/payments/:id

/expenses
/expenses/new

/deliveries
/deliveries/new
/deliveries/:id

/reports

/settings
/settings/business
/settings/users


41. UX Requirements
The UI must be:
Mobile-first.
Fast.
Simple.
Professional.
Nigerian SME appropriate.
Usable with one hand where practical.
Clear about financial values.
Minimal in unnecessary configuration.
Avoid enterprise-style complexity.
Navigation
Primary navigation:
Dashboard
Sales
Products
Customers
Expenses
Deliveries
Reports
Settings

Provide a prominent creation action.

42. Sales UX
The /sales route is a dedicated overview page that provides a convenient entry point to:
Estimates
Invoices
Payments
Outstanding invoices
It surfaces quick actions (new estimate, new invoice, record payment) and a summary of outstanding invoices.
Do not force users to navigate through multiple menus for common sales operations.

43. Forms
All forms must:
Validate before submission.
Display inline validation errors.
Preserve entered values after validation failure.
Disable submit during submission.
Show success/failure feedback.
Handle network errors.
Support mobile keyboards appropriately.

44. Validation Rules
General
Required fields cannot be empty.
Strings must have sensible maximum lengths.
Monetary values must be >= 0.
Quantities must be > 0.
Dates must be valid.
Email must be valid where provided.
Phone numbers must support Nigerian formats.
IDs must be validated server-side.
Products
Selling price >= 0.
Cost price >= 0.
Stock quantity >= 0.
Low-stock threshold >= 0.
SKU unique within business when provided.
Estimates
Must contain at least one item.
Quantity > 0.
Unit price >= 0.
Expiry date cannot precede issue date.
Totals calculated server-side.
Invoices
Must contain at least one item.
Quantity > 0.
Unit price >= 0.
Customer is optional (walk-in/direct sales).
Due date must be valid.
Payment cannot exceed outstanding balance.
Totals calculated server-side.
Expenses
Amount > 0.
Category required.
Date required.
Deliveries
Invoice required when delivery originates from an invoice.
Delivery cannot contain invalid/non-existent products.
Delivered status should require recipient confirmation information unless explicitly configured otherwise.

45. Financial Calculation Rules
Never trust totals supplied by the frontend.
The backend must calculate:
lineTotal
subtotal
discount
tax
total
amountPaid
balanceDue

Conceptually:
lineTotal = quantity × unitPrice - lineDiscount

lineTax = (lineTotal or unitPrice, as configured) × lineTaxRate
documentTax = sum(lineTax) + documentTaxAdjustment

subtotal = sum(lineTotals)

total = subtotal - documentDiscount + documentTax

balanceDue = total - amountPaid

Line-level discount and tax are captured per EstimateItem/InvoiceItem.
Document-level discount and tax are captured on the Estimate/Invoice itself.
documentTax is the sum of all line-level taxes (when line-level tax is enabled) plus any document-level tax adjustment.
The document-level tax field on Estimate/Invoice stores the final rolled-up documentTax.
The document-level discount field stores the document-level discount applied after summing line totals.

Use decimal-safe arithmetic.
All monetary calculations must occur server-side before persistence.

46. Invoice State Rules
Basic state transitions:
DRAFT
  ↓
ISSUED
  ↓
PARTIALLY_PAID
  ↓
PAID

Alternative:
ISSUED → OVERDUE
PARTIALLY_PAID → OVERDUE

An invoice is OVERDUE when its due date has passed and its balance is greater than zero, regardless of whether it is ISSUED or PARTIALLY_PAID.

Cancellation:
DRAFT → CANCELLED
ISSUED → CANCELLED

A paid invoice should not be silently deleted.

47. Estimate State Rules
DRAFT → SENT
SENT → VIEWED
VIEWED → ACCEPTED
VIEWED → REJECTED
SENT → EXPIRED
ACCEPTED → CONVERTED

An accepted estimate converted into an invoice must preserve the source relationship.

48. Delivery State Rules
PENDING
   ↓
PROCESSING
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED

Failure/cancellation states:
PENDING → CANCELLED
PROCESSING → CANCELLED
OUT_FOR_DELIVERY → FAILED


49. Permission Matrix
Action
Owner
Manager
Staff
View dashboard
Yes
Yes
Yes
Manage products
Yes
Yes
Configurable
Manage customers
Yes
Yes
Yes
Create estimates
Yes
Yes
Yes
Manage invoices
Yes
Yes
Configurable
Record payments
Yes
Yes
Configurable
Manage expenses
Yes
Yes
Configurable
Manage deliveries
Yes
Yes
Configurable
View reports
Yes
Yes
Configurable
Business settings
Yes
Limited
No
Manage users
Yes
No
No
Cancel financial records
Yes
Configurable
No
Delete business
Yes
No
No

Implement permission checks on the backend. Frontend hiding alone is insufficient.
Manager "Limited" business settings: a Manager may view all business settings and edit operational settings (payment instructions, invoice/estimate/delivery prefixes, tax/VAT configuration). A Manager may NOT edit the core business profile (name, logo, CAC number) or delete the business.

50. PWA Requirements
The application must be installable as a PWA.
Required
Web App Manifest.
Service worker.
Installable on Android.
Responsive desktop/tablet/mobile UI.
App icons.
Splash/loading experience.
HTTPS in production.
Offline application shell.
Offline behavior
MVP does not require complete offline database synchronization.
However:
Previously loaded static application assets should remain available.
Display clear offline state.
Do not pretend that failed writes succeeded.
Queueing/synchronizing business transactions can be a future enhancement.

51. Performance Requirements
Target:
Fast initial load on mobile.
Lazy-load feature modules where practical.
Paginate large datasets.
Avoid unnecessary API requests.
Cache frequently accessed query data.
Optimize images before upload.
Generate documents without blocking the entire UI.

52. Security Requirements
Implement:
Password hashing (bcrypt).
JWT-based authentication using AUTH_SECRET for signing.
HTTPS in production.
Server-side authorization.
Tenant isolation.
Input validation.
SQL injection protection through ORM/parameterized queries.
File upload validation.
Rate limiting on authentication endpoints.
Secure environment variables.
No secrets in frontend code.
No GCS credentials in frontend.
Appropriate CORS configuration.

53. Auditability
Record important financial/business actions.
At minimum:
Invoice created
Invoice cancelled
Payment recorded
Payment modified/deleted
Expense created/modified/deleted
Inventory adjusted
Delivery status changed
User/role changes
Audit records should identify:
Who
What
Which record
When


54. Seed Data
Create seed data for development/demo environments:
Expense categories
Inventory
Transport
Fuel
Rent
Utilities
Salaries
Marketing
Equipment
Repairs
Logistics
Other
Do not seed fake financial transactions in production.

55. Development Requirements
Monorepo structure:
/app    (frontend — React + Vite PWA)
/api    (backend — Node.js + Express + Prisma)

Root-level package.json for workspace scripts.
Each package has its own package.json and tsconfig.
Provide:
.env.example
Database migration system
Seed script
Development startup scripts
Production build scripts
README
API documentation
Basic test setup
Environment variables must include appropriate values for:
DATABASE_URL
AUTH_SECRET
GCS_PROJECT_ID
GCS_CLIENT_EMAIL
GCS_PRIVATE_KEY
GCS_BUCKET_NAME

Use environment-specific configuration.

Deployment target: Render.
- /api deployed as a Render Web Service.
- /app deployed as a Render Static Site (build output from Vite).
- PostgreSQL provisioned as a Render PostgreSQL database.
- GCS credentials provided via Render environment variables.

56. Testing Requirements
Implement tests for critical business logic.
Unit tests
Test:
Invoice calculations
Estimate calculations
Tax calculations
Discounts
Payment balance
Invoice status transitions
Inventory calculations
Profit calculations
Validation
API/integration tests
Test:
Authentication
Business isolation
Customer CRUD
Product CRUD
Estimate creation
Estimate → invoice conversion
Invoice creation
Payment recording
Overpayment rejection
Expense creation
Delivery creation
Role authorization
Frontend tests
At minimum test critical workflows:
Create customer
Create product
Create estimate
Convert estimate to invoice
Record payment
Create expense
Create delivery


57. End-to-End Acceptance Workflows
The following workflows must work from the UI against a real PostgreSQL database.
Workflow A — Product Sale
Create customer.
Create product.
Set price and stock.
Create invoice.
Add product.
Issue invoice.
Record payment.
Invoice becomes PAID.
Customer balance updates.
Product inventory updates appropriately.

Workflow B — Estimate Conversion
Create customer.
Create estimate.
Add products/services.
Save estimate.
Mark as sent/accepted.
Convert to invoice.
Verify invoice contains same customer/items/prices.
Verify source estimate relationship exists.

Workflow C — Partial Payment
Create invoice for ₦100,000.
Record ₦40,000 payment.
Invoice becomes PARTIALLY_PAID.
Balance displays ₦60,000.
Record ₦60,000.
Invoice becomes PAID.
Balance becomes ₦0.
Attempting a payment above the outstanding balance must fail.

Workflow D — Expense & Profit
Record ₦100,000 income.
Record ₦30,000 expense.
Report displays:
Revenue: ₦100,000
Expenses: ₦30,000
Operating Profit: ₦70,000


Workflow E — Delivery
Create/issue invoice.
Create delivery from invoice.
Verify customer and items are inherited.
Set address.
Assign delivery personnel.
Move through delivery statuses.
Mark delivered.
Enter recipient name.
Verify completion timestamp.
Optionally attach proof photo.

58. Definition of Done
The MVP is complete only when:
Authentication works.
Business workspace works.
Tenant isolation works.
Roles/permissions work.
Products/services work.
Basic inventory works.
Customers work.
Estimates work.
Estimate → invoice conversion works.
Invoices work.
Payments/income work.
Expenses work.
Deliveries work.
Dashboard works from real data.
Reports work from real data.
PDF estimates work.
PDF invoices work.
WhatsApp sharing flow works.
GCS attachments work.
PWA installation works.
Mobile UI is usable.
Validation exists on frontend and backend.
Financial calculations are server-side and decimal-safe.
Critical API/business logic is tested.
No mock production data remains.
No secrets are committed.
Production build succeeds.
Database migrations run successfully.
README contains setup/deployment instructions.

59. Agent Execution Rules
The coding agent must treat this document as the source of truth for the MVP scope.
Implementation order
Build in this sequence:
1. Project scaffolding
2. PostgreSQL + ORM
3. Authentication
4. Business/workspace + roles
5. Customers
6. Products/services
7. Inventory
8. Estimates
9. Invoices
10. Payments/income
11. Expenses
12. Deliveries
13. Dashboard
14. Reports
15. Attachments/GCS
16. PDF generation
17. WhatsApp sharing
18. Notifications
19. PWA
20. Testing
21. Security hardening
22. Production build/deployment

Execution principles
Do not implement excluded features.
Do not replace PostgreSQL with another database.
Do not replace the specified React/TypeScript/Node/Express architecture without a compelling technical reason.
Prefer simple implementations over premature abstraction.
Keep business logic on the backend.
Reuse shared components and validation schemas.
Maintain strict business/tenant isolation.
Do not use mock data to satisfy acceptance criteria.
Do not mark a feature complete until its UI, API, database behavior, validation, authorization, and critical tests are functional.
Run tests and builds after each major module.
Fix errors before proceeding.
Keep the codebase production-oriented but avoid unnecessary enterprise complexity.

60. MVP Success Criteria
A Nigerian SME owner should be able to open the PWA and, without accounting expertise:
Create my business
      ↓
Add products/services
      ↓
Add customers
      ↓
Create an estimate
      ↓
Convert it to an invoice
      ↓
Record payment
      ↓
Arrange delivery
      ↓
Record expenses
      ↓
See income, expenses,
outstanding balances and profit

If that complete journey works reliably on a mobile device, the MVP has achieved its primary objective.

