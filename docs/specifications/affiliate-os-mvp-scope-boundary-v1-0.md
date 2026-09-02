# AFFILIATE OS — MVP SCOPE & BOUNDARY v1.0

**Status:** Foundation  
**Version:** v1.0  
**Product:** Affiliate OS  
**Primary Validation Environment:** TikTok Shop Affiliate  
**MVP Objective:** Validate Affiliate Opportunity → Test → Measure → Learn

---

# 1. PURPOSE

Dokumen ini mendefinisikan batas resmi MVP Affiliate OS.

Tujuannya:

1. menentukan capability yang wajib dibangun;
2. menentukan capability yang sengaja ditunda;
3. mencegah scope creep;
4. menjaga biaya dan waktu implementasi;
5. memastikan MVP menguji core hypothesis produk.

---

# 2. MVP CORE HYPOTHESIS

MVP harus menguji hipotesis berikut:

> **Jika creator mendapatkan opportunity affiliate yang telah dianalisis berdasarkan demand, product signal, competition, dan content potential, maka creator dapat melakukan eksperimen affiliate yang lebih terarah dibandingkan memilih produk secara acak.**

MVP **tidak perlu membuktikan bahwa Affiliate OS dapat mengotomatisasi seluruh aktivitas affiliate.**

MVP hanya perlu membuktikan:

```text
Better Discovery
      ↓
Better Selection
      ↓
Better Experiment
      ↓
Better Measurement
      ↓
Better Decision
```

---

# 3. MVP CORE LOOP

Core loop resmi:

```text
DISCOVER
   ↓
EVALUATE
   ↓
SELECT
   ↓
TEST
   ↓
MEASURE
   ↓
LEARN
   ↓
ITERATE
```

Jika sebuah fitur tidak membantu loop tersebut, fitur tersebut **bukan prioritas MVP**.

---

# 4. MVP USER

## Primary MVP User

Individual creator yang ingin menjalankan affiliate secara serius tetapi belum memiliki sistem riset dan eksperimen yang terstruktur.

Karakteristik:

- menggunakan TikTok sebagai channel utama;
- dapat mempromosikan produk affiliate;
- memiliki atau sedang membangun audience;
- dapat membuat atau memperoleh konten;
- ingin mengurangi trial-and-error;
- membutuhkan keputusan yang lebih terarah.

TikTok Shop sendiri menyediakan mekanisme bagi creator untuk menemukan produk, mempromosikannya melalui video/LIVE, dan memperoleh komisi dari penjualan.

---

# 5. MVP IN-SCOPE

MVP terdiri dari **7 capability utama**.

```text
01 Demand Discovery
02 Opportunity Engine
03 Product Intelligence
04 Competitor Intelligence
05 Content Strategy
06 Experiment & Distribution Tracking
07 Performance & Winner Analytics
```

---

# 6. MODULE 01 — DEMAND DISCOVERY

## Objective

Menemukan dan mengorganisasi signal yang menunjukkan adanya kebutuhan atau minat terhadap suatu problem/product/category.

### MVP capability

- input demand signal;
- category;
- problem;
- audience;
- source;
- evidence;
- trend direction;
- notes;
- confidence level.

### Output

```text
Demand Signal
       ↓
Structured Demand Record
```

### Tidak termasuk

- real-time global trend engine;
- predictive trend AI;
- massive scraping infrastructure;
- automatic crawling seluruh internet.

---

# 7. MODULE 02 — OPPORTUNITY ENGINE

## Objective

Mengubah demand + product + competition menjadi opportunity yang dapat diuji.

### Core inputs

```text
Demand
Product
Competition
Commission
Content Potential
Risk
```

### MVP output

```text
Opportunity Score
Opportunity Status
Opportunity Reason
Risk
Recommended Action
```

### Status

```text
DISCOVERED
EVALUATING
READY_TO_TEST
TESTING
VALIDATED
REJECTED
SCALED
```

### Prinsip

Opportunity score **bukan kebenaran absolut**.

Score adalah:

> **decision-support signal.**

Keputusan final tetap membutuhkan eksperimen nyata.

---

# 8. MODULE 03 — PRODUCT INTELLIGENCE

## Objective

Membantu creator memahami apakah sebuah produk layak dipertimbangkan untuk affiliate.

### MVP data

```text
Product Name
Category
Seller
Price
Commission
Rating
Review Count
Demand Signal
Competition Signal
Content Potential
Risk
Source
Last Checked
```

### MVP output

```text
Product Assessment
      ↓
Opportunity Candidate
```

TikTok Shop secara resmi menyediakan product marketplace/discovery bagi creator dan memungkinkan produk dipromosikan melalui video maupun LIVE.

### Tidak termasuk

- otomatis membeli produk;
- otomatis meminta sample;
- supplier sourcing;
- inventory management;
- seller management.

---

# 9. MODULE 04 — COMPETITOR INTELLIGENCE

## Objective

Memahami bagaimana produk/opportunity sudah dipromosikan oleh creator lain.

### MVP capability

Record:

```text
Creator
Product
Content
Hook
Angle
Format
Observed Engagement
Observed Positioning
Content Pattern
Gap
```

### Output

```text
Competitor Pattern
      ↓
Content Opportunity Gap
```

### Contoh

```text
Competitor:
"Produk ini murah."

Our potential angle:
"Apakah produk murah ini benar-benar menyelesaikan masalah X?"
```

### Tidak termasuk

- automated mass scraping;
- competitor account takeover;
- private data;
- unauthorized access;
- full social listening platform.

---

# 10. MODULE 05 — CONTENT STRATEGY

## Objective

Mengubah opportunity menjadi arahan konten yang dapat diproduksi.

### Input

```text
Opportunity
Audience
Problem
Product
Competitor Pattern
```

### Output

```text
Content Angle
Hook Direction
Problem
Proof Direction
Format
CTA
Content Brief
Experiment Variants
```

### Contoh

```text
OPPORTUNITY
      ↓
Problem:
"Noda sulit hilang"

      ↓
Angle:
Demonstration

      ↓
Hook:
"Kalau noda ini sudah dicuci berkali-kali..."

      ↓
CTA:
"Lihat produk"
```

### Boundary penting

**Content Strategy ≠ Content Production.**

Affiliate OS hanya menghasilkan **brief dan strategy**.

---

# 11. MODULE 06 — EXPERIMENT & DISTRIBUTION TRACKING

MVP tidak perlu menjadi social media scheduler.

Fungsi awalnya adalah **mencatat eksperimen**.

### Experiment object

```text
Experiment ID
Opportunity ID
Product ID
Content ID
Angle
Hook
Format
Publish Date
Platform
Status
```

### Distribution status

```text
PLANNED
READY
PUBLISHED
COLLECTING_DATA
COMPLETED
```

### MVP workflow

```text
Content Brief
      ↓
Creator produces content externally
      ↓
Creator publishes
      ↓
Creator records/pulls results
      ↓
Affiliate OS analyzes
```

---

# 12. MODULE 07 — PERFORMANCE & WINNER ANALYTICS

## Objective

Mengubah hasil eksperimen menjadi keputusan.

### MVP metrics

```text
Views
Engagement
Clicks
CTR
Orders
Conversion Rate
Commission
Revenue
```

Metrics tambahan dapat ditambahkan jika sumber datanya tersedia dan reliable.

### Winner classification

```text
WINNER
PROMISING
NEUTRAL
WEAK
FAILED
```

### Output

Contoh:

> **Experiment #014 = PROMISING**

Reason:

- strong click signal;
- conversion belum cukup;
- angle menarik;
- perlu additional test.

---

# 13. WINNER LOOP

Winner engine harus mengembalikan insight ke strategy.

```text
Experiment
     ↓
Performance
     ↓
Pattern Detection
     ↓
Winner
     ↓
New Experiment
```

Contoh:

```text
Winning Product
+
Winning Hook
+
Winning Angle
=
New Variations
```

Dengan demikian Affiliate OS memiliki **learning loop**.

---

# 14. MVP DASHBOARD

Dashboard MVP tidak perlu kompleks.

Minimal:

```text
HOME
│
├── Opportunities
├── Products
├── Competitors
├── Content Strategy
├── Experiments
├── Performance
└── Winners
```

### Home dashboard harus menjawab:

> **“Apa yang harus saya lakukan sekarang?”**

Contoh:

```text
3 Opportunities ready to test
2 Experiments collecting data
1 Winning pattern detected
4 Products need evaluation
```

---

# 15. MVP DECISION CARD

Setiap opportunity memiliki decision card.

```text
┌──────────────────────────────────┐
│ OPPORTUNITY #017                 │
├──────────────────────────────────┤
│ Product: XYZ                     │
│ Demand: Strong                   │
│ Competition: Medium              │
│ Commission: Good                 │
│ Content Potential: High          │
│ Risk: Medium                     │
│                                  │
│ SCORE: 82/100                    │
│                                  │
│ RECOMMENDATION: TEST             │
└──────────────────────────────────┘
```

User tidak perlu membaca seluruh database untuk mengambil keputusan.

---

# 16. MVP SCORING MODEL

Scoring awal menggunakan weighted signal.

Contoh:

```text
Demand Strength        25%
Product Quality        15%
Commission Potential   15%
Competition            15%
Content Potential      15%
Audience Fit           10%
Risk                    5%
```

Total:

```text
100%
```

### Important

Bobot tersebut adalah **starting hypothesis**, bukan angka final.

Setelah MVP menghasilkan data, bobot dapat dikalibrasi.

---

# 17. MVP DATA QUALITY

Setiap data penting harus mempunyai:

```text
Source
Timestamp
Confidence
```

Contoh:

```text
Demand Signal
Source: TikTok observation
Checked: 2026-09-02
Confidence: Medium
```

Tujuannya mencegah sistem memperlakukan data lama sebagai fakta terkini.

---

# 18. EXTERNAL CAPABILITIES

MVP boleh menggunakan layanan eksternal.

Contoh capability:

```text
AI reasoning
AI content assistance
External research
External analytics
External content production
```

Tetapi Affiliate OS harus memiliki abstraction layer.

```text
Affiliate OS
      ↓
Capability Interface
      ↓
External Provider
```

Sehingga provider dapat diganti tanpa mengubah core business logic.

---

# 19. CONTENT PRODUCTION BOUNDARY

## IN MVP

```text
Content Brief
Content Angle
Hook Direction
Script Direction
CTA Direction
Experiment Variant
```

## OUT MVP

```text
Video Editor
Video Renderer
AI Video Generator
AI Image Generator
AI Voice Engine
Asset Storage Platform
Advanced Timeline Editor
```

Konten dapat dibuat manual, AI-assisted, AI-first, atau hybrid di luar core Affiliate OS.

---

# 20. AUTOMATION BOUNDARY

## MVP boleh melakukan

- scoring;
- classification;
- recommendation;
- data organization;
- analytics;
- opportunity ranking;
- experiment tracking.

## MVP tidak memprioritaskan

- autonomous posting;
- autonomous purchasing;
- autonomous affiliate account management;
- autonomous negotiation;
- autonomous creator outreach;
- autonomous content publishing.

---

# 21. TIKTOK INTEGRATION BOUNDARY

TikTok tetap menjadi initial platform, tetapi integrasi native bukan dependency MVP.

### MVP

```text
Affiliate OS
      ↓
Export / Manual Input
      ↓
TikTok
      ↓
Performance
      ↓
Affiliate OS
```

### Future

```text
Affiliate OS
      ↓
TikTok API
      ↓
Draft / Direct Publishing
```

TikTok memang menyediakan mekanisme affiliate dan creator dapat mempromosikan produk melalui video maupun LIVE.

---

# 22. OUT OF SCOPE — V1.0

Fitur berikut secara resmi **tidak boleh masuk MVP**:

### Content Production

- full video editor;
- video rendering engine;
- AI video generator;
- AI avatar;
- AI voice infrastructure.

### Social Automation

- automated posting;
- auto-comment;
- auto-DM;
- auto-follow;
- bot engagement.

### Marketplace

- own product marketplace;
- seller inventory;
- order fulfillment.

### Enterprise

- agency management;
- multi-tenant enterprise;
- advanced team permissions;
- white-label.

### Multi-platform

- Instagram;
- YouTube;
- Shopee;
- Tokopedia;
- marketplace lain.

Semua dapat dipertimbangkan setelah core model terbukti.

---

# 23. MVP TECHNICAL PRINCIPLE

Technical architecture harus mendukung:

```text
Modularity
Provider Independence
Data Traceability
Replaceable Integrations
Simple Deployment
Low Initial Cost
```

Tidak perlu:

```text
Microservices everywhere
Complex Kubernetes
Own AI infrastructure
GPU infrastructure
Massive event streaming
```

pada tahap MVP.

---

# 24. MVP BUILD PRIORITY

Urutan implementasi:

```text
P0
Core Data Model
        ↓
P0
Opportunity Engine
        ↓
P0
Product Intelligence
        ↓
P0
Demand Discovery
        ↓
P1
Competitor Intelligence
        ↓
P1
Content Strategy
        ↓
P1
Experiment Tracking
        ↓
P1
Performance Analytics
        ↓
P2
Winner Detection
        ↓
P2
Recommendation Improvements
```

---

# 25. MVP VALIDATION LOOP

MVP harus digunakan dalam eksperimen nyata.

```text
Find Opportunity
      ↓
Select Product
      ↓
Create Content Externally
      ↓
Publish
      ↓
Collect Result
      ↓
Record
      ↓
Analyze
      ↓
Decide
```

Kemudian ulangi.

Target awal bukan jumlah fitur.

Target awal:

> **Jumlah eksperimen berkualitas yang berhasil dijalankan dan menghasilkan insight.**

---

# 26. MVP SUCCESS CRITERIA

MVP dianggap berhasil jika:

### Product

User dapat menemukan opportunity yang sebelumnya sulit ditemukan secara manual.

### Decision

User dapat menjelaskan alasan memilih opportunity.

### Execution

User dapat menjalankan experiment dari opportunity.

### Measurement

User dapat mencatat hasil experiment.

### Learning

System dapat mengidentifikasi pattern dari hasil experiment.

### Repeatability

User dapat menjalankan loop tersebut berulang kali.

---

# 27. MVP FAILURE CONDITIONS

MVP dianggap belum tervalidasi jika:

- user hanya menggunakan dashboard sebagai database;
- recommendation tidak lebih berguna daripada pencarian manual;
- scoring tidak membantu keputusan;
- tidak ada eksperimen nyata;
- tidak ada performance data;
- tidak ada learning loop;
- user tetap memilih produk secara acak.

Jika ini terjadi, **jangan langsung menambah fitur.**

Perbaiki core loop.

---

# 28. PRODUCT BOUNDARY

Boundary utama:

```text
                    AFFILIATE OS
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   INTELLIGENCE      EXPERIMENTATION    ANALYTICS
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                  DECISION SYSTEM
```

Affiliate OS **mengambil keputusan berbasis evidence**.

---

# 29. FUTURE EXPANSION

Setelah MVP tervalidasi:

### Phase 2

```text
Advanced Intelligence
Better Recommendations
Better Analytics
```

### Phase 3

```text
Automation
API Integrations
Native Publishing
```

### Phase 4

```text
Content Production OS
```

### Phase 5

```text
Multi-platform Affiliate OS
```

---

# 30. FINAL MVP DEFINITION

> **Affiliate OS v1.0 adalah sistem intelligence dan experimentation untuk membantu creator menemukan, menilai, menguji, mengukur, dan mempelajari peluang affiliate.**

MVP **bukan**:

> full affiliate automation platform.

MVP **bukan**:

> AI content production platform.

MVP **bukan**:

> social media management platform.

MVP adalah:

> **Opportunity → Experiment → Data → Learning.**

---

# 31. MVP NORTH STAR

### Primary North Star

**Validated Affiliate Opportunities**

### Supporting Metrics

```text
Opportunities Discovered
Opportunities Tested
Experiments Completed
Validated Winners
Revenue Generated
Learning Cycles Completed
```

---

# 32. FINAL SCOPE LOCK

### BUILD NOW

```text
✓ Demand Discovery
✓ Product Intelligence
✓ Opportunity Engine
✓ Competitor Intelligence
✓ Content Strategy
✓ Experiment Tracking
✓ Performance Analytics
✓ Basic Winner Detection
✓ Decision Dashboard
```

### USE EXTERNALLY

```text
✓ Content Production
✓ AI Generation
✓ Video Editing
✓ Initial Publishing
```

### BUILD LATER

```text
→ Native Content Production OS
→ Native AI Production
→ TikTok API Automation
→ Multi-platform
→ Advanced Automation
→ Enterprise Features
```

---

# 33. SCOPE LOCK PRINCIPLE

Setiap fitur baru harus menjawab:

> **“Apakah fitur ini memperkuat Discover → Evaluate → Test → Measure → Learn?”**

Jika jawabannya **tidak**, fitur tersebut masuk backlog.

Jika jawabannya **ya**, fitur tersebut harus dinilai berdasarkan priority dan effort.

---

# 34. FOUNDATION DECISION

**MVP Scope Approved**

Affiliate OS v1.0 akan dibangun sebagai:

> **Lean Affiliate Intelligence & Experimentation System**

dengan fokus:

**Find better opportunities → run better tests → learn from real results.**

Content Production OS tetap menjadi **future standalone SaaS** dan tidak menjadi bagian dari MVP Affiliate OS.