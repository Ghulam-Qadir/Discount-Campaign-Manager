# Shopify Discount Campaign Manager
Version: 1.0

# Goal
Build a production-ready embedded Shopify app that allows merchants to create, schedule, manage and analyse discount campaigns from one dashboard.

# Target Users
- Small stores
- Medium stores
- Shopify agencies

# Tech Stack
## Shopify
- Remix App Template
- React
- Polaris
- App Bridge
- GraphQL Admin API
- Webhooks

## Backend
- Node.js
- Prisma ORM
- SQLite (dev)
- PostgreSQL (production)

# Features

## Authentication
- Shopify OAuth
- Install
- Uninstall
- Session management

## Dashboard
- Active campaigns
- Scheduled campaigns
- Expired campaigns
- Revenue generated
- Coupon usage

## Campaign Types
- Percentage Discount
- Fixed Amount Discount
- Free Shipping
- Buy X Get Y
- Order Discount
- Product Discount

## Campaign Form
Fields:
- Campaign Name
- Campaign Type
- Discount Value
- Products / Collections
- Customer Eligibility
- Usage Limit
- Start Date
- End Date
- Status

Validation:
- End date > Start date
- Positive discount values
- Required fields

## Products
- Search products
- Filter by collection
- Multi-select products

## Customers
- All customers
- Tagged customers
- VIP customers
- Logged-in customers only

## Scheduling
- Save draft
- Publish now
- Schedule
- Auto expire

## Analytics
- Total Uses
- Revenue
- Average Order Value
- Top Campaign
- Conversion Rate

## Settings
- Store timezone
- Currency
- Email notifications

## Logs
- Created
- Updated
- Activated
- Expired
- Deleted

# Database

## shops
- id
- shop
- accessToken
- createdAt

## campaigns
- id
- shopId
- name
- type
- value
- startDate
- endDate
- status
- usageLimit
- createdAt
- updatedAt

## campaign_products
- id
- campaignId
- productId

## campaign_logs
- id
- campaignId
- action
- message
- createdAt

# Routes

- /
- /dashboard
- /campaigns
- /campaigns/new
- /campaigns/:id
- /settings

# APIs

GET /campaigns
GET /campaigns/:id
POST /campaigns
PUT /campaigns/:id
DELETE /campaigns/:id

# Webhooks

- app/uninstalled
- products/update
- products/delete

# Folder Structure

```
app/
  components/
  routes/
  services/
  repositories/
  graphql/
  utils/
  hooks/
  lib/
prisma/
```

# Development Phases

## Phase 1
- Create Shopify app
- Configure OAuth
- Configure Prisma
- Setup database
- Install Polaris

## Phase 2
- Dashboard
- Navigation
- Layout
- Authentication

## Phase 3
- Campaign CRUD
- Validation
- Product selector

## Phase 4
- Scheduling
- Status management
- Logs

## Phase 5
- Analytics
- Charts
- Search
- Filters

## Phase 6
- Testing
- Deployment
- Documentation

# AI Development Rules

You are a Senior Shopify + Remix + React + GraphQL engineer.

Always:
1. Build one feature at a time.
2. Use reusable components.
3. Use service classes for business logic.
4. Keep routes/controllers thin.
5. Validate every request.
6. Handle every API error.
7. Never hardcode secrets.
8. Follow Shopify Polaris design.
9. Use GraphQL instead of REST where possible.
10. Write clean, typed code.
11. Add loading and error states.
12. Test every completed feature before moving on.
13. Do not skip security checks.
14. Keep commits small and meaningful.
15. Refactor duplicate code immediately.

# Required Skills

- Shopify App Development
- Remix
- React
- Polaris
- App Bridge
- GraphQL Admin API
- OAuth
- Prisma ORM
- CRUD
- Form Validation
- Search & Filters
- Scheduling
- Charts
- Error Handling
- Git
- Deployment

# Future Enhancements

- AI campaign suggestions
- A/B testing
- Email campaign integration
- Klaviyo integration
- Shopify Flow integration
- Multi-store support
- Subscription billing
- Team permissions

# Definition of Done

The app is complete when:
- Merchant can install it.
- Merchant can create, edit and delete campaigns.
- Campaigns can be scheduled.
- Dashboard displays campaign statistics.
- App is responsive.
- No critical errors remain.
- Code is modular, documented and production-ready.
