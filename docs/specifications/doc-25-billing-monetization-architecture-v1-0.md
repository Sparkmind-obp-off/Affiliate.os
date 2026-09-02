# DOC 25 — BILLING & MONETIZATION ARCHITECTURE v1.0

**Document:** Affiliate OS Billing & Monetization Architecture  
**Module:** 25  
**Status:** Architecture Reference  
**Purpose:** Menentukan arsitektur monetisasi Affiliate OS sebagai SaaS multi-revenue, termasuk pricing, subscription, entitlement, order, payment, provider abstraction, billing event, revenue separation, dan integrasi payment gateway.

---

# 386 — MONETIZATION PURPOSE

Affiliate OS harus dapat menghasilkan revenue dari beberapa sumber tanpa mencampurkan financial domain.

Primary:

```text
SaaS Revenue
```

Secondary:

```text
Affiliate Revenue
```

Additional:

```text
Ecosystem Revenue
```

Architecture:

```text
                         AFFILIATE OS
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
      SaaS Revenue      Affiliate Revenue    Ecosystem Revenue
          │                   │                   │
      Subscription         Commission         Products/Services
          │                   │                   │
      Billing Domain      Revenue Domain      Commerce Domain
```

---

# 387 — MONETIZATION PRINCIPLE

Affiliate OS bukan payment gateway.

```text
Affiliate OS
     │
     ▼
Billing & Monetization
     │
     ▼
Payment Provider Abstraction
     │
     ├── Duitku
     ├── Provider B
     └── Provider C
```

Dengan demikian:

```text
PAYMENT PROVIDER
≠
BILLING SYSTEM
```

Payment provider hanya menjalankan payment transaction.

Affiliate OS tetap menjadi authority untuk:

```text
PLAN
SUBSCRIPTION
ENTITLEMENT
ORDER
BILLING STATE
```

---

# 388 — REVENUE STREAM MODEL

## Revenue Stream A — SaaS

```text
Customer
   ↓
Subscription
   ↓
Payment
   ↓
SaaS Revenue
```

## Revenue Stream B — Affiliate

```text
Affiliate Account
   ↓
Click
   ↓
Conversion
   ↓
Commission
   ↓
Affiliate Revenue
```

## Revenue Stream C — Ecosystem

```text
Template
Course
Data
Service
Consulting
Digital Product
```

---

# 389 — REVENUE SEPARATION RULE

SaaS payment:

```text
module_25
```

Affiliate revenue:

```text
module_10 / module_19
```

Tidak boleh:

```text
SaaS payment
      ↓
Affiliate revenue table
```

atau:

```text
Affiliate commission
      ↓
Subscription balance
```

kecuali melalui explicit financial transfer contract yang memang didefinisikan kemudian.

---

# 390 — BILLING DOMAIN

Billing bertanggung jawab terhadap:

```text
Plans
Pricing
Subscriptions
Orders
Payments
Entitlements
Invoices
Refunds
Billing Events
```

Billing tidak bertanggung jawab terhadap:

```text
Affiliate attribution
Content performance
Creator scoring
Opportunity scoring
Platform commission calculation
```

---

# 391 — PLAN MODEL

Plan:

```text
FREE
STARTER
PRO
BUSINESS
```

Plan bukan permission.

Plan menentukan:

```text
ENTITLEMENT
LIMIT
QUOTA
FEATURE ACCESS
USAGE POLICY
```

Contoh:

```text
PRO
├── 10 Workspaces
├── 100 Opportunities/day
├── 50 Creator analyses/day
├── Advanced Analytics
├── Automation
└── Priority Support
```

---

# 392 — PLAN ≠ ROLE ≠ PERMISSION

Tiga konsep harus terpisah:

```text
ROLE
→ siapa user dalam organization

PERMISSION
→ apa yang boleh dilakukan

PLAN
→ capability apa yang dibeli organization
```

Contoh:

```text
User
Role = Analyst

Organization
Plan = PRO

Permission
= analytics.read
```

---

# 393 — ENTITLEMENT ENGINE

Flow:

```text
USER
 ↓
WORKSPACE
 ↓
ORGANIZATION
 ↓
PLAN
 ↓
ENTITLEMENT
 ↓
ACTION
```

Entitlement menentukan:

```text
ALLOW
DENY
LIMIT
QUOTA
```

Tetapi:

```text
ENTITLEMENT
≠
SECURITY AUTHORIZATION
```

Security policy tetap memiliki authority tertinggi.

---

# 394 — PRICING MODEL

Pricing harus versioned.

```text
pricing_version
plan_id
currency
amount
billing_interval
effective_from
effective_until
```

Contoh:

```text
STARTER
Rp99.000
MONTHLY
v1
```

Jika harga berubah:

```text
v1 → Rp99K
v2 → Rp129K
```

historical subscription tidak boleh berubah secara silent.

---

# 395 — BILLING INTERVAL

MVP:

```text
MONTHLY
YEARLY
```

Future:

```text
WEEKLY
QUARTERLY
CUSTOM
```

Billing engine harus menyimpan interval sebagai data, bukan hardcode.

---

# 396 — SUBSCRIPTION LIFECYCLE

Canonical:

```text
TRIAL
 ↓
PENDING_PAYMENT
 ↓
ACTIVE
 ↓
PAST_DUE
 ↓
SUSPENDED
 ↓
CANCELLED
 ↓
EXPIRED
```

Tidak semua state wajib dilalui.

---

# 397 — SUBSCRIPTION RULE

Subscription memiliki:

```text
subscription_id
organization_id
plan_id
pricing_version
status
started_at
current_period_start
current_period_end
cancel_at_period_end
cancelled_at
provider_reference
```

Historical state wajib dipertahankan.

---

# 398 — ORDER MODEL

Setiap payment harus berasal dari order internal.

```text
Order
│
├── order_id
├── organization_id
├── customer
├── plan
├── amount
├── currency
├── status
└── payment_reference
```

External provider order ID tidak boleh menjadi primary business identity.

---

# 399 — PAYMENT LIFECYCLE

```text
CREATED
 ↓
PENDING
 ↓
PROCESSING
 ↓
PAID
```

Alternative:

```text
PENDING
 ↓
FAILED
```

atau:

```text
PENDING
 ↓
EXPIRED
```

atau:

```text
PAID
 ↓
REFUNDED
```

---

# 400 — PAYMENT AUTHORITY

Payment status tidak boleh ditentukan hanya dari:

```text
redirect
frontend
query parameter
```

Canonical:

```text
PROVIDER CALLBACK
       ↓
SIGNATURE VALIDATION
       ↓
ORDER MATCH
       ↓
AMOUNT VALIDATION
       ↓
IDEMPOTENCY CHECK
       ↓
OPTIONAL PROVIDER STATUS CHECK
       ↓
INTERNAL PAYMENT STATE
```

Duitku secara eksplisit membedakan callback dari redirect dan menyatakan `returnUrl`/redirect tidak boleh digunakan sebagai dasar utama untuk mengubah status pembayaran.

---

# 401 — PAYMENT PROVIDER ABSTRACTION

Contract:

```ts
interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<PaymentIntent>;

  getPaymentStatus(
    providerReference: string
  ): Promise<PaymentStatus>;

  handleCallback(
    payload: unknown
  ): Promise<ProviderCallbackResult>;
}
```

Provider-specific code berada di adapter.

---

# 402 — DUITKU ADAPTER

```text
PaymentProvider
      │
      ▼
DuitkuAdapter
      │
      ├── createPayment
      ├── verifyCallback
      ├── getStatus
      └── normalizeResponse
```

Duitku credentials:

```text
MERCHANT_CODE
API_KEY
```

harus disimpan sebagai secret, bukan source code. Dokumentasi Duitku menyebut merchant code dan API key sebagai credential untuk akses API.

---

# 403 — DUITKU TRANSACTION FLOW

```text
Affiliate OS
     │
     ▼
Create Internal Order
     │
     ▼
Duitku Adapter
     │
     ▼
Duitku Transaction
     │
     ▼
Payment URL / Payment Interface
     │
     ▼
Customer Payment
     │
     ▼
Duitku Callback
     │
     ▼
Affiliate OS
```

Duitku menyediakan request transaksi untuk berbagai metode pembayaran dan callback untuk memberikan status transaksi.

---

# 404 — CALLBACK SECURITY

Callback harus:

```text
RECEIVE
 ↓
VALIDATE PROVIDER
 ↓
VERIFY SIGNATURE
 ↓
VALIDATE ORDER
 ↓
VALIDATE AMOUNT
 ↓
DEDUPE
 ↓
PERSIST RAW CALLBACK
 ↓
PROCESS
 ↓
ACKNOWLEDGE
```

Duitku saat ini mendokumentasikan HMAC-SHA256 untuk signature callback API umum. Implementasi harus mengikuti kontrak provider yang berlaku saat connector dibuat, bukan mengasumsikan metode signature lama.

---

# 405 — PAYMENT IDEMPOTENCY

Callback dapat diterima lebih dari sekali.

Maka:

```text
same provider reference
+
same event
=
same business result
```

Tidak boleh:

```text
Callback #1
→ PAID

Callback #2
→ tambah revenue lagi
```

---

# 406 — AMOUNT VALIDATION

Sebelum payment dianggap valid:

```text
provider_amount
==
internal_order_amount
```

dan:

```text
provider_currency
==
internal_order_currency
```

Jika mismatch:

```text
PAYMENT_REVIEW_REQUIRED
```

bukan otomatis `PAID`.

---

# 407 — ENTITLEMENT ACTIVATION

```text
PAYMENT CONFIRMED
       ↓
ORDER PAID
       ↓
SUBSCRIPTION ACTIVE
       ↓
ENTITLEMENT ACTIVATED
```

Tidak:

```text
Payment URL opened
       ↓
Premium activated
```

---

# 408 — PAYMENT FAILURE

Jika payment gagal:

```text
Order
→ FAILED
```

Subscription:

```text
tetap status sebelumnya
```

kecuali failure tersebut terjadi pada renewal aktif.

Untuk renewal:

```text
ACTIVE
 ↓
PAYMENT FAILED
 ↓
PAST_DUE
 ↓
GRACE PERIOD
 ↓
SUSPENDED
```

---

# 409 — GRACE PERIOD

Grace period harus configurable:

```text
grace_period_days
```

Contoh:

```text
3 days
7 days
14 days
```

Selama grace:

```text
Subscription = PAST_DUE
```

Entitlement dapat:

```text
REMAIN
LIMIT
SUSPEND
```

sesuai policy plan.

---

# 410 — CANCELLATION

User dapat:

```text
Cancel Immediately
```

atau:

```text
Cancel At Period End
```

Default SaaS:

```text
cancel_at_period_end = true
```

agar user tetap memperoleh entitlement sampai akhir periode yang telah dibayar, kecuali policy bisnis menyatakan berbeda.

---

# 411 — REFUND

Refund bukan delete payment.

```text
PAID
 ↓
REFUND_REQUESTED
 ↓
REFUNDED
```

Historical payment tetap immutable.

Refund harus menghasilkan:

```text
Refund Event
```

dan financial adjustment.

---

# 412 — INVOICE

Invoice:

```text
invoice_id
organization_id
order_id
invoice_number
currency
subtotal
discount
tax
total
status
issued_at
paid_at
```

Invoice harus immutable setelah finalized.

---

# 413 — DISCOUNT / COUPON

MVP optional.

Jika digunakan:

```text
Coupon
 ↓
Pricing Engine
 ↓
Discount
 ↓
Final Amount
```

Jangan mengubah original price.

Simpan:

```text
list_price
discount_amount
final_price
```

---

# 414 — TAX

Tax tidak boleh hardcode.

Model:

```text
subtotal
+
tax
-
discount
=
total
```

Tax rules harus versioned jika nanti diimplementasikan.

---

# 415 — USAGE-BASED MONETIZATION

Future capability:

```text
BASE SUBSCRIPTION
+
USAGE
```

Contoh:

```text
PRO
Rp249K

Additional AI generations
+
Additional automation executions
```

Architecture:

```text
Usage Event
 ↓
Usage Meter
 ↓
Usage Aggregation
 ↓
Billing Calculation
```

Belum menjadi MVP.

---

# 416 — FREE PLAN

FREE dapat digunakan untuk:

```text
PRODUCT VALIDATION
LEAD GENERATION
USER ACQUISITION
```

Tetapi tetap menggunakan entitlement engine.

```text
FREE
≠
NO BILLING MODEL
```

FREE adalah plan dengan:

```text
price = 0
```

---

# 417 — SAAS REVENUE ACCOUNTING BOUNDARY

Affiliate OS menyimpan:

```text
Gross Billing
Refund
Discount
Net Billing
```

Tetapi tidak otomatis mengklaim:

```text
Accounting Revenue Recognition
Tax Liability
Bank Settlement
```

sebagai final accounting truth tanpa accounting integration.

---

# 418 — BUSINESS REVENUE METRICS

Minimum:

```text
MRR
ARR
Paid Organizations
Active Subscriptions
New Subscriptions
Churn
Expansion
Contraction
Refunds
Net SaaS Revenue
ARPU
```

Formula harus versioned.

---

# 419 — MRR

Simplified MVP:

```text
MRR
=
sum(monthly-equivalent recurring subscription value)
```

Annual subscription:

```text
annual_price / 12
```

Tidak memasukkan:

```text
one-time payment
affiliate commission
refund
```

kecuali metric definition secara eksplisit menyatakannya.

---

# 420 — CHURN

Customer churn:

```text
Cancelled Customers
/
Customers At Start of Period
× 100
```

Revenue churn berbeda dari customer churn.

Jangan mencampurkan keduanya.

---

# 421 — SaaS LIFETIME VALUE

Future metric:

```text
LTV
```

tidak menjadi financial truth untuk MVP.

Jika digunakan, label:

```text
ESTIMATED
```

bukan:

```text
CONFIRMED
```

---

# 422 — MULTI-TENANT BILLING

Billing owner:

```text
ORGANIZATION
```

bukan individual user.

Flow:

```text
Organization
 ↓
Subscription
 ↓
Plan
 ↓
Entitlements
 ↓
Workspace
 ↓
Users
```

Satu organization dapat memiliki banyak workspace.

---

# 423 — BILLING ADMIN

Owner/Admin dapat:

```text
VIEW PLAN
VIEW BILLING
VIEW PAYMENT
VIEW INVOICE
CHANGE PLAN
CANCEL SUBSCRIPTION
```

Operator/Analyst/Viewer tidak otomatis memperoleh billing permissions.

---

# 424 — BILLING SECURITY

Payment operation wajib:

```text
AUTHENTICATED
AUTHORIZED
AUDITED
IDEMPOTENT
```

Sensitive financial operation:

```text
REFUND
PLAN CHANGE
CANCEL
PAYMENT METHOD CHANGE
```

harus memiliki audit trail.

---

# 425 — AUDIT EVENT

Minimum:

```text
billing.plan.changed
billing.subscription.created
billing.subscription.cancelled
billing.payment.created
billing.payment.confirmed
billing.payment.failed
billing.payment.refunded
billing.invoice.issued
billing.entitlement.changed
```

---

# 426 — BILLING EVENT MODEL

```text
Billing Action
     ↓
Domain Event
     ↓
Outbox
     ↓
Event Bus
     ↓
Consumers
```

Contoh:

```text
payment.confirmed
```

consumer:

```text
Subscription Service
Entitlement Service
Notification Service
Analytics
Audit
```

---

# 427 — PAYMENT PROVIDER FAILURE

Jika Duitku down:

```text
Affiliate OS
      ↓
Payment Provider Error
      ↓
Payment = PROVIDER_UNAVAILABLE
```

Bukan:

```text
Payment = FAILED
```

karena:

```text
PROVIDER_UNAVAILABLE
≠
CUSTOMER_PAYMENT_FAILED
```

---

# 428 — PAYMENT RETRY

Retry hanya dilakukan untuk error yang retryable.

```text
NETWORK_ERROR
TIMEOUT
5xx
RATE_LIMIT
```

Tidak retry otomatis untuk:

```text
INVALID_AMOUNT
INVALID_SIGNATURE
INVALID_CREDENTIAL
CUSTOMER_CANCELLED
```

---

# 429 — PAYMENT RECONCILIATION

Billing harus memiliki reconciliation:

```text
Affiliate OS Orders
        ↕
Provider Transactions
```

Detect:

```text
MISSING PAYMENT
DUPLICATE PAYMENT
AMOUNT MISMATCH
UNKNOWN REFERENCE
STATUS MISMATCH
```

---

# 430 — DAILY RECONCILIATION

Future operational job:

```text
Daily
 ↓
Fetch Provider Transactions
 ↓
Compare Internal Orders
 ↓
Detect Variance
 ↓
Create Reconciliation Record
 ↓
Alert
```

Tidak mengubah status secara silent.

---

# 431 — MONETIZATION ARCHITECTURE

```text
                         MONETIZATION
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
            PLANS        SUBSCRIPTIONS      ORDERS
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                           PAYMENT
                              │
                     Provider Abstraction
                              │
                         ┌────┴────┐
                         ▼         ▼
                      Duitku   Provider B
                         │
                         ▼
                    External Payment
                         │
                         ▼
                      CALLBACK
                         │
                         ▼
                    VERIFICATION
                         │
                         ▼
                    PAYMENT CONFIRMED
                         │
                  ┌──────┴──────┐
                  ▼             ▼
             SUBSCRIPTION   ENTITLEMENT
                  │             │
                  └──────┬──────┘
                         ▼
                    SaaS ACCESS
```

---

# 432 — PERSONAL AFFILIATE SEPARATION

Personal affiliate account tidak dianggap sebagai SaaS customer.

```text
PERSONAL AFFILIATE
      │
      ▼
Affiliate Platform Account
      │
      ▼
Affiliate Revenue
```

berbeda dengan:

```text
AFFILIATE OS CUSTOMER
      │
      ▼
Organization
      │
      ▼
Subscription
      │
      ▼
SaaS Revenue
```

---

# 433 — MULTIPLE INCOME ARCHITECTURE

```text
                        OWNER / BUSINESS
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
      SaaS Revenue       Affiliate Revenue   Ecosystem
           │                  │                  │
      Subscription         Commission        Products
           │                  │                  │
        Billing           Attribution        Commerce
           │                  │                  │
        Duitku          Affiliate Platform   Payment
```

Semua revenue memiliki:

```text
SOURCE
OWNER
CURRENCY
AMOUNT
STATUS
DATE
REFERENCE
```

tetapi tetap berada dalam domain yang berbeda.

---

# 434 — MVP MONETIZATION SCOPE

MVP wajib:

```text
✓ Plans
✓ Pricing
✓ Free Plan
✓ Paid Plan
✓ Organization Subscription
✓ Order
✓ Payment
✓ Payment Provider Abstraction
✓ Duitku Adapter
✓ Callback
✓ Signature Validation
✓ Payment Verification
✓ Entitlement
✓ Billing Audit
✓ Basic Invoice
```

MVP belum wajib:

```text
✗ Usage Billing
✗ Complex Coupon Engine
✗ Multi-Currency Settlement
✗ Marketplace Payout
✗ Revenue Sharing
✗ Advanced Tax Engine
✗ Accounting ERP
✗ Multiple Payment Providers
✗ Automatic Dunning Engine
```

---

# 435 — IMPLEMENTATION BOUNDARY

Module 25 owns:

```text
Plan
Pricing
Subscription
Order
Payment
Invoice
Entitlement
Refund
Billing Event
```

Module 17 owns:

```text
Payment Provider Adapter
```

Module 16 owns:

```text
Security Policy
Authorization
Risk
```

Module 19 owns:

```text
Business Truth
Attribution
Reconciliation
```

---

# 436 — DATABASE OWNERSHIP

Recommended:

```text
module_25
├── plans
├── pricing_versions
├── subscriptions
├── orders
├── payments
├── invoices
├── refunds
├── entitlements
├── billing_events
└── billing_reconciliation
```

Provider-specific data:

```text
module_17
```

atau connector-owned storage sesuai connector architecture.

---

# 437 — PAYMENT DATA MODEL

Minimum:

```text
payments
│
├── id
├── organization_id
├── order_id
├── provider
├── provider_reference
├── amount
├── currency
├── status
├── payment_method
├── paid_at
├── failure_code
├── failure_reason
├── raw_reference
├── created_at
└── updated_at
```

Sensitive payment credentials tidak disimpan di tabel payment.

---

# 438 — ENTITLEMENT DATA MODEL

```text
entitlements
│
├── id
├── organization_id
├── plan_id
├── feature_key
├── limit_value
├── limit_unit
├── effective_from
├── effective_until
└── status
```

Contoh:

```text
automation.executions
limit = 1000
unit = monthly
```

---

# 439 — BILLING STATE MACHINE

```text
ORDER

CREATED
  ↓
PENDING_PAYMENT
  ↓
PAID
  │
  ├── REFUNDED
  └── COMPLETED

PENDING_PAYMENT
  ├── FAILED
  └── EXPIRED
```

Subscription:

```text
TRIAL
 ↓
ACTIVE
 ↓
PAST_DUE
 ↓
SUSPENDED
 ↓
CANCELLED
```

---

# 440 — PAYMENT UX

UX flow:

```text
Pricing
 ↓
Plan Detail
 ↓
Checkout
 ↓
Payment Method
 ↓
Payment Provider
 ↓
Payment Result
 ↓
Processing
 ↓
Confirmed
 ↓
Workspace Activated
```

Jika callback belum diterima:

```text
Payment Processing
```

bukan:

```text
Payment Failed
```

---

# 441 — PAYMENT RESULT UX

Success:

```text
Payment Confirmed
Your plan is now active.
```

Pending:

```text
Payment Processing
We are confirming your payment.
```

Failed:

```text
Payment Failed
Try another payment method.
```

Cancelled:

```text
Payment Cancelled
You can try again.
```

---

# 442 — BILLING DASHBOARD

Minimum:

```text
Current Plan
Subscription Status
Next Billing Date
Current Period
Payment History
Invoices
Upgrade
Downgrade
Cancel
```

---

# 443 — ADMIN MONETIZATION DASHBOARD

Internal admin:

```text
MRR
Active Subscriptions
New Customers
Churn
Failed Payments
Refunds
Revenue
Provider Health
Reconciliation Variance
```

---

# 444 — BILLING OBSERVABILITY

Metrics:

```text
payment_success_rate
payment_failure_rate
payment_callback_latency
provider_error_rate
provider_timeout_rate
subscription_activation_rate
billing_reconciliation_variance
```

---

# 445 — BILLING ALERTS

Alert:

```text
Provider unavailable
Callback failure spike
Payment failure spike
Reconciliation mismatch
Unexpected revenue variance
Webhook signature failures
Duplicate callback spike
```

---

# 446 — BILLING ACCEPTANCE CRITERIA

```text
AC-25-01
Plans are versioned.

AC-25-02
Pricing is versioned.

AC-25-03
Plan is separate from role and permission.

AC-25-04
Subscription belongs to organization.

AC-25-05
Orders have internal IDs.

AC-25-06
External provider references are not business identity.

AC-25-07
Payment status is not determined by redirect alone.

AC-25-08
Provider callbacks are signature-validated.

AC-25-09
Payment amount is validated.

AC-25-10
Payment processing is idempotent.

AC-25-11
Duplicate callbacks do not create duplicate financial effects.

AC-25-12
Confirmed payment activates subscription.

AC-25-13
Subscription activates entitlements.

AC-25-14
Failed payment does not incorrectly activate entitlement.

AC-25-15
Refund creates a separate financial event.

AC-25-16
Financial history remains auditable.

AC-25-17
Duitku is implemented behind provider abstraction.

AC-25-18
Duitku credentials are never stored in source code.

AC-25-19
Provider-specific logic is isolated.

AC-25-20
Provider outage is distinguished from customer payment failure.

AC-25-21
Billing reconciliation exists.

AC-25-22
SaaS revenue is separated from affiliate revenue.

AC-25-23
Personal affiliate accounts are separated from SaaS organizations.

AC-25-24
Entitlement is evaluated before paid feature access.

AC-25-25
Billing operations are audited.

AC-25-26
Critical billing events are versioned.

AC-25-27
Billing metrics are traceable.

AC-25-28
Payment lifecycle is deterministic.

AC-25-29
MVP does not require multiple payment providers.

AC-25-30
Architecture allows additional providers without changing billing domain.
```

---

# 447 — MASTER BILLING FLOW

```text
CUSTOMER
   ↓
PRICING
   ↓
PLAN
   ↓
CHECKOUT
   ↓
ORDER
   ↓
PAYMENT INTENT
   ↓
PAYMENT PROVIDER
   ↓
DUITKU
   ↓
CUSTOMER PAYS
   ↓
CALLBACK
   ↓
VERIFY
   ↓
PAYMENT CONFIRMED
   ↓
SUBSCRIPTION ACTIVE
   ↓
ENTITLEMENT ACTIVE
   ↓
SAAS ACCESS
   ↓
BILLING EVENT
   ↓
BUSINESS METRICS
```

---

# 448 — MASTER REVENUE FLOW

```text
                        REVENUE
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       SaaS            Affiliate         Ecosystem
          │                │                │
   Subscription        Commission        Product
          │                │                │
      Billing         Attribution        Commerce
          │                │                │
      Payment         Platform           Payment
          │             Payout              │
          ▼                ▼                ▼
      SaaS Truth      Affiliate Truth   Product Truth
```

---

# 449 — FINAL ARCHITECTURE LOCK

```text
SaaS MONETIZATION MODEL       = LOCKED
MULTI-REVENUE MODEL           = LOCKED
PLAN MODEL                    = LOCKED
PRICING VERSIONING            = LOCKED
SUBSCRIPTION MODEL            = LOCKED
ORDER MODEL                   = LOCKED
PAYMENT STATE MACHINE         = LOCKED
ENTITLEMENT MODEL             = LOCKED
PAYMENT PROVIDER ABSTRACTION  = LOCKED
DUITKU AS FIRST PROVIDER      = LOCKED
CALLBACK-FIRST VALIDATION     = LOCKED
PAYMENT IDEMPOTENCY            = LOCKED
AMOUNT VALIDATION              = LOCKED
REFUND MODEL                  = LOCKED
BILLING AUDIT                 = LOCKED
BILLING RECONCILIATION        = LOCKED
SaaS/AFFILIATE REVENUE SPLIT  = LOCKED
PERSONAL/PLATFORM SEPARATION  = LOCKED
MVP MONETIZATION BOUNDARY     = LOCKED
```

# 450 — DOCUMENT CHAIN UPDATE

```text
DOC 20
SYSTEM ARCHITECTURE
        ↓
DOC 21
DATA MODEL & DATABASE SCHEMA
        ↓
DOC 22
API & INTEGRATION CONTRACT
        ↓
DOC 23
UX/UI ARCHITECTURE
        ↓
DOC 24
IMPLEMENTATION BLUEPRINT
        ↓
DOC 25
BILLING & MONETIZATION
        ↓
IMPLEMENTATION
```

**DOC 25 = COMPLETE + LOCKED**

**Affiliate OS sekarang bukan hanya punya architecture untuk menjalankan affiliate workflow, tetapi sudah memiliki jalur SaaS monetization yang terpisah, provider-agnostic, dan siap menggunakan Duitku sebagai payment provider pertama.**