# AFFILIATE OS — DEMAND DISCOVERY ENGINE v1.0

**Status:** Product Architecture  
**Version:** v1.0  
**Module:** Demand Intelligence  
**Product:** Affiliate OS  
**Primary Market:** TikTok Shop Affiliate  
**Primary User:** Affiliate Creator  
**Core Function:** Detect → Validate → Score → Explain Demand

---

# 1. PURPOSE

Demand Discovery Engine adalah mesin yang bertugas menemukan dan memvalidasi **signal kebutuhan pasar** sebelum sebuah produk dianggap sebagai affiliate opportunity.

Engine tidak bertugas mengatakan:

> “Produk ini viral, jadi pasti bagus.”

Engine harus menjawab:

> **“Apakah terdapat evidence bahwa audience tertentu memiliki kebutuhan/problem terhadap sesuatu yang dapat diselesaikan oleh produk ini?”**

---

# 2. CORE PRINCIPLE

Demand ≠ Viral.

Demand ≠ High Views.

Demand ≠ High Commission.

Demand ≠ Banyak Seller.

Demand harus diperlakukan sebagai kombinasi beberapa signal.

```text
Demand
=
Problem Signal
+
Attention Signal
+
Intent Signal
+
Product Signal
+
Content Signal
```

---

# 3. CORE DEMAND LOOP

```text
DISCOVER
   ↓
COLLECT SIGNAL
   ↓
NORMALIZE
   ↓
VALIDATE
   ↓
SCORE
   ↓
CLASSIFY
   ↓
GENERATE OPPORTUNITY
```

---

# 4. WHAT COUNTS AS DEMAND?

Engine mengenali beberapa bentuk demand.

## 4.1 Explicit Demand

User secara langsung menyatakan kebutuhan.

Contoh:

```text
"Bagaimana cara menghilangkan noda..."
"Ada rekomendasi..."
"Produk apa yang..."
"Di mana beli..."
"Apakah ada yang..."
```

Signal ini memiliki nilai tinggi karena terdapat explicit intent.

---

# 5. 4.2 Problem Demand

Audience tidak menyebut produk.

Mereka menyebut masalah.

Contoh:

```text
Masalah:
Sepatu cepat kotor.

Potential solution:
Cleaning product.
```

Ini sangat penting.

Affiliate OS tidak boleh hanya mencari:

> “orang mencari produk X.”

Tetapi juga:

> **“orang sedang mengalami masalah yang bisa diselesaikan produk X.”**

---

# 6. 4.3 Search Demand

Signal dapat berasal dari:

- search behavior;
- search suggestions;
- keyword patterns;
- query frequency;
- repeated questions.

Namun search signal **tidak otomatis berarti purchase intent**.

Karena itu harus dikombinasikan dengan signal lain.

---

# 7. 4.4 Content Demand

Content yang terus muncul mengenai problem tertentu menunjukkan adanya attention.

Contoh:

```text
Problem X
↓
Multiple creators
↓
Multiple videos
↓
Repeated audience interaction
```

Namun:

> high content volume ≠ guaranteed commercial demand.

Engine harus memisahkan **attention** dari **intent**.

---

# 8. 4.5 Comment Demand

Komentar merupakan signal penting.

Contoh:

```text
"Link?"
"Belinya dimana?"
"Harganya berapa?"
"Ada ukuran..."
"Ini cocok untuk..."
"Apakah bisa..."
```

Komentar seperti ini memiliki commercial intent yang lebih kuat daripada sekadar:

```text
"Wow"
"Bagus"
"FYP"
```

---

# 9. 4.6 Transactional Demand

Signal paling kuat berasal dari actual commercial activity.

Contoh:

```text
Orders
GMV
Product sales
Conversion
Affiliate commissions
```

Jika data tersedia secara legitimate, transactional signal mendapat bobot tinggi.

---

# 10. 4.7 Creator Demand

Jika banyak creator mulai membuat content untuk produk/problem tertentu, itu dapat menjadi signal.

```text
Product
↓
Creator adoption
↓
Multiple content
↓
Audience response
```

Namun creator count harus dibaca bersama:

- sales;
- content age;
- engagement;
- competition.

---

# 11. DEMAND SIGNAL TAXONOMY

Engine menggunakan taxonomy:

```text
D1 — Problem Signal
D2 — Search Signal
D3 — Conversation Signal
D4 — Content Signal
D5 — Commercial Intent
D6 — Transaction Signal
D7 — Creator Signal
D8 — Trend Signal
```

---

# 12. SIGNAL HIERARCHY

Tidak semua signal memiliki bobot sama.

Initial hierarchy:

```text
Tier A — Strong Evidence
├── Transaction
├── Purchase Intent
└── Repeated Commercial Questions

Tier B — Strong Supporting
├── Search
├── Problem
└── Creator Adoption

Tier C — Attention
├── Content Volume
├── Views
└── Trend

Tier D — Weak
├── Likes
└── Generic Engagement
```

---

# 13. WHY VIEWS ARE NOT ENOUGH

Contoh:

```text
Product A
10M views
100 sales

Product B
500K views
10K sales
```

Product A terlihat lebih viral.

Tetapi Product B menunjukkan commercial efficiency yang jauh lebih menarik.

Maka engine tidak boleh menggunakan:

> Views = Demand.

---

# 14. DEMAND ENTITY

Setiap demand disimpan sebagai entity.

```text
Demand ID
Problem
Audience
Category
Keyword
Signal Type
Signal Value
Source
Timestamp
Confidence
Evidence
Status
```

---

# 15. EXAMPLE

```text
Demand ID:
DMD-00124

Problem:
Sepatu putih cepat kotor

Audience:
Young adults / sneaker users

Category:
Cleaning

Signals:
Search ↑
Comments ↑
Content ↑
Product Sales ↑

Confidence:
HIGH
```

---

# 16. SOURCE MODEL

Setiap signal wajib memiliki source.

```text
Source Type
├── TikTok
├── TikTok Shop
├── Search
├── Social
├── Marketplace
├── Creator Content
├── User Input
└── External Research
```

---

# 17. SOURCE TRACEABILITY

Setiap data harus memiliki:

```text
Source
Observed At
Collected At
Evidence
Confidence
```

Contoh:

```text
Signal:
"portable blender"

Source:
TikTok content observation

Observed:
2026-09-02

Confidence:
Medium
```

---

# 18. DEMAND NORMALIZATION

Problem yang sama dapat muncul dengan banyak kata.

Contoh:

```text
"sepatu putih kotor"
"cara bersihin sneakers"
"cleaning sepatu putih"
"sepatu gampang kusam"
```

Engine harus dapat mengelompokkan:

```text
Canonical Problem:
Shoe Cleaning
```

---

# 19. DEMAND CLUSTER

```text
Raw Signals
     ↓
Keyword normalization
     ↓
Problem clustering
     ↓
Audience clustering
     ↓
Demand Cluster
```

Contoh:

```text
Cluster #027

Problem:
Cleaning White Shoes

Keywords:
sepatu putih
clean sneakers
shoe cleaner
sepatu kusam
```

---

# 20. AUDIENCE MODEL

Demand tidak cukup tanpa audience.

Entity:

```text
Audience ID
Age Range
Interest
Problem
Behavior
Context
Buying Motivation
```

Contoh:

```text
Audience:
Sneaker users

Problem:
Dirty shoes

Motivation:
Keep shoes looking new

Purchase Trigger:
Visible before/after result
```

---

# 21. DEMAND CONTEXT

Engine harus memahami konteks munculnya demand.

```text
WHY NOW?
```

Contoh:

```text
Seasonal
Event
Trend
Lifestyle
Problem Spike
Product Innovation
Price Change
Creator Influence
```

---

# 22. TEMPORAL DEMAND

Demand memiliki waktu.

```text
Emerging
Growing
Stable
Declining
Seasonal
Unknown
```

Contoh:

```text
Demand:
Halloween decoration

Status:
Emerging

Expected:
Seasonal spike
```

---

# 23. DEMAND MOMENTUM

Initial formula:

```text
Momentum =
Current Signal
-
Historical Baseline
```

Kemudian dapat dikembangkan menjadi:

```text
Momentum Score =
Growth Rate
+
Acceleration
+
Signal Diversity
```

Tujuan:

> membedakan demand yang sedang tumbuh dari demand yang memang sudah besar tetapi stagnan.

---

# 24. SIGNAL DIVERSITY

Satu signal saja tidak cukup.

Contoh:

```text
Search ↑
Comments ↑
Sales ↑
Creators ↑
```

lebih kuat daripada:

```text
Views ↑
```

Engine memberikan bonus jika beberapa independent signals mengarah ke kesimpulan yang sama.

---

# 25. CROSS-SIGNAL VALIDATION

```text
             SEARCH
                ↓
PROBLEM → DEMAND ENGINE ← COMMENTS
                ↑
             SALES
                ↑
             CONTENT
```

Semakin banyak signal yang converge:

> semakin tinggi confidence.

---

# 26. DEMAND CONFIDENCE

Initial model:

```text
LOW
MEDIUM
HIGH
VERY_HIGH
```

### LOW

Evidence lemah atau hanya satu source.

### MEDIUM

Beberapa supporting signals.

### HIGH

Multiple independent signals.

### VERY_HIGH

Strong commercial + behavioral evidence.

---

# 27. DEMAND SCORE

Initial scoring model:

```text
Problem Strength       20%
Intent Strength        20%
Commercial Signal      20%
Momentum               15%
Signal Diversity       10%
Creator Adoption       10%
Content Potential       5%
```

Total:

```text
100%
```

---

# 28. IMPORTANT

Score tidak boleh menjadi:

> absolute truth.

Score adalah:

> **decision-support mechanism.**

Karena data platform dapat berubah dan sebagian signal bersifat proxy.

---

# 29. DEMAND STATUS

```text
DISCOVERED
    ↓
OBSERVING
    ↓
VALIDATING
    ↓
CONFIRMED
    ↓
OPPORTUNITY_READY
```

Alternative:

```text
WEAK
UNCERTAIN
EMERGING
VALIDATED
DECLINING
```

---

# 30. OPPORTUNITY GENERATION

Demand tidak otomatis menjadi opportunity.

Flow:

```text
Demand
   ↓
Product Match
   ↓
Competition Check
   ↓
Commission Check
   ↓
Content Potential
   ↓
Risk Check
   ↓
Opportunity
```

---

# 31. DEMAND-TO-PRODUCT MATCH

Engine harus menjawab:

> “Apakah ada produk yang benar-benar menyelesaikan demand ini?”

Contoh:

```text
Demand:
Sepatu putih cepat kotor

Product:
Shoe cleaning foam

Match:
HIGH
```

---

# 32. PRODUCT MATCH SCORE

```text
Problem Fit        30%
Solution Strength  25%
Demonstrability    15%
Audience Fit       15%
Commercial Fit     10%
Risk                5%
```

---

# 33. DEMAND GAP

Salah satu output penting:

> **Demand exists, but supply/content response may be weak.**

Contoh:

```text
High Search
High Comments
Low Quality Content
Low Creator Coverage
```

Ini dapat menjadi opportunity.

---

# 34. DEMAND-SUPPLY GAP

```text
Demand ↑
Supply ↓
    =
Potential Opportunity
```

Namun:

> low supply tidak selalu berarti opportunity.

Bisa juga berarti:

- demand sebenarnya rendah;
- product unavailable;
- problem sulit diselesaikan;
- category restricted;
- economics buruk.

Karena itu gap harus divalidasi.

---

# 35. CONTENT GAP

Contoh:

```text
Demand:
High

Existing content:
High

But:

Most content uses same angle.
```

Output:

```text
Content Gap:
HIGH
```

Ini berarti opportunity dapat berasal dari **new angle**, bukan product baru.

---

# 36. DEMAND PATTERN

Engine menyimpan pattern:

```text
Problem
+
Audience
+
Context
+
Trigger
+
Solution
```

Contoh:

```text
Audience:
Pet owners

Problem:
Fur everywhere

Trigger:
Cleaning frustration

Solution:
Portable pet hair remover
```

---

# 37. DISCOVERY INPUTS

MVP input dapat berasal dari:

```text
Manual Product Input
Manual Keyword Input
Manual Problem Input
TikTok Research
TikTok Shop Research
Creator Observation
Comment Observation
External Research
```

---

# 38. MVP DATA COLLECTION

Pada tahap awal:

> **Manual + semi-automated collection diperbolehkan.**

Tidak perlu membangun massive scraper.

Contoh:

```text
Creator finds signal
        ↓
Paste evidence
        ↓
Affiliate OS structures data
        ↓
Engine scores it
```

---

# 39. WHY MANUAL-FIRST?

Karena tujuan MVP bukan:

> membuktikan scraping technology.

Tujuan MVP adalah:

> membuktikan bahwa demand intelligence menghasilkan keputusan affiliate yang lebih baik.

---

# 40. AI ROLE

AI digunakan untuk:

```text
Classification
Clustering
Summarization
Pattern Detection
Reasoning
Scoring Assistance
Opportunity Explanation
```

AI **tidak boleh menjadi satu-satunya source of truth**.

---

# 41. AI ARCHITECTURE

```text
RAW EVIDENCE
     ↓
STRUCTURED DATA
     ↓
AI ANALYSIS
     ↓
RULES / SCORING
     ↓
DECISION
```

Bukan:

```text
AI
 ↓
"Menurut saya produk ini bagus."
```

---

# 42. EVIDENCE-FIRST AI

AI wajib bisa menjelaskan:

```text
WHY?
```

Contoh:

> Demand score 81 karena terdapat kombinasi problem signal, repeated purchase-intent comments, growing content activity, dan product-level commercial evidence.

---

# 43. NO-EVIDENCE RULE

Jika evidence tidak cukup:

```text
Status:
INSUFFICIENT DATA
```

Bukan:

```text
AI GUESS
```

---

# 44. DEMAND ALERTS

Future capability:

```text
New Emerging Demand
Demand Spike
Demand Acceleration
Demand Decline
New Problem Cluster
New Product Match
```

---

# 45. MVP ALERT

Untuk MVP cukup:

```text
Opportunity-ready
Demand spike
Demand confirmed
Demand declining
```

---

# 46. DEMAND DASHBOARD

Dashboard:

```text
DEMAND OVERVIEW

Emerging          12
Validating         8
Confirmed         17
Declining          4
```

---

# 47. DEMAND CARD

```text
┌───────────────────────────────────┐
│ DEMAND #DMD-124                   │
├───────────────────────────────────┤
│ Problem                           │
│ White shoes getting dirty         │
│                                   │
│ Audience                          │
│ Sneaker users                     │
│                                   │
│ Momentum          ↑ HIGH          │
│ Intent            HIGH            │
│ Commercial        MEDIUM          │
│ Competition       MEDIUM          │
│                                   │
│ DEMAND SCORE      82/100          │
│ CONFIDENCE        HIGH            │
│                                   │
│ → FIND PRODUCTS                   │
└───────────────────────────────────┘
```

---

# 48. DEMAND EXPLANATION

Every score must have explanation.

```text
WHY 82?

+ Strong problem evidence
+ Repeated commercial intent
+ Growing content volume
+ Multiple creators covering topic
- Competition increasing
```

---

# 49. DEMAND DECISION

Engine outputs:

```text
OBSERVE
INVESTIGATE
VALIDATE
TEST
IGNORE
```

---

# 50. DEMAND → OPPORTUNITY CONTRACT

```text
Demand Engine
      ↓
Demand Object
      ↓
Product Matching
      ↓
Opportunity Engine
```

Demand Engine **tidak menentukan final opportunity score**.

Opportunity Engine tetap menjadi owner untuk:

```text
Demand
Product
Competition
Commission
Content
Risk
```

---

# 51. API CONCEPT

```text
POST /demands

GET /demands

GET /demands/:id

POST /demands/:id/signals

POST /demands/:id/validate

POST /demands/:id/score

GET /demands/:id/opportunities
```

---

# 52. CORE DATA MODEL

```text
Demand
├── id
├── canonical_problem
├── category
├── audience
├── context
├── momentum
├── score
├── confidence
├── status
├── created_at
└── updated_at

DemandSignal
├── id
├── demand_id
├── type
├── source
├── value
├── evidence
├── observed_at
├── confidence
└── created_at
```

---

# 53. TRACEABILITY

Relationship:

```text
Source
 ↓
Signal
 ↓
Demand
 ↓
Product Match
 ↓
Opportunity
 ↓
Experiment
 ↓
Performance
```

Ini menjadi salah satu fondasi data moat Affiliate OS.

---

# 54. DEMAND LIFECYCLE

```text
RAW
 ↓
STRUCTURED
 ↓
CLUSTERED
 ↓
VALIDATED
 ↓
MATCHED
 ↓
OPPORTUNITY
 ↓
TESTED
 ↓
LEARNED
```

---

# 55. LEARNING LOOP

Hasil experiment harus kembali ke Demand Engine.

Contoh:

```text
Demand:
"Pet hair removal"

Product A:
Failed

Product B:
Won

Learning:
Portable demonstration
+
Low-friction use
+
Before/after visual
```

Demand engine kemudian dapat meningkatkan future recommendation.

---

# 56. DEMAND ENGINE NORTH STAR

Primary metric:

> **Validated Demand Signals → Qualified Opportunities**

Bukan:

> jumlah keyword ditemukan.

Bukan:

> jumlah products scraped.

---

# 57. QUALITY METRICS

```text
Signal Accuracy
Demand Validation Rate
Opportunity Conversion Rate
False Positive Rate
False Negative Rate
Time-to-Opportunity
```

---

# 58. MVP SUCCESS CRITERIA

Demand Engine MVP berhasil jika:

### 1

Creator dapat memasukkan raw evidence.

### 2

System dapat mengubah evidence menjadi structured signal.

### 3

System dapat mengelompokkan signal menjadi demand.

### 4

System dapat memberikan confidence.

### 5

System dapat menjelaskan alasan score.

### 6

Demand dapat dicocokkan dengan product.

### 7

Demand dapat diteruskan ke Opportunity Engine.

---

# 59. MVP NON-GOALS

Jangan membangun dulu:

```text
Massive web crawler
Massive TikTok scraper
Real-time global trend engine
Predictive AI forecasting
Autonomous product discovery
Full social listening
Enterprise data warehouse
```

---

# 60. FIRST MVP VERSION

Versi pertama cukup:

```text
INPUT
↓
Evidence
↓
Signal Extraction
↓
Demand Cluster
↓
Demand Score
↓
Confidence
↓
Product Match
↓
Opportunity
```

---

# 61. INITIAL USER FLOW

```text
Creator menemukan content/problem
        ↓
Copy evidence
        ↓
Paste ke Affiliate OS
        ↓
System membaca evidence
        ↓
System menemukan demand
        ↓
System memberikan score
        ↓
System mencari/mencocokkan product
        ↓
Opportunity dibuat
        ↓
Creator test
```

---

# 62. REAL-WORLD PRINCIPLE

Affiliate OS harus selalu memisahkan:

```text
WHAT PEOPLE NOTICE
        ≠
WHAT PEOPLE WANT
        ≠
WHAT PEOPLE BUY
```

Ketiganya dapat berbeda.

---

# 63. EXAMPLE

```text
10M Views
      ↓
Attention

100K Comments
      ↓
Interest

10K "Link?" / purchase-intent comments
      ↓
Intent

2K Orders
      ↓
Commercial validation
```

Masing-masing signal memiliki makna berbeda.

---

# 64. STRATEGIC DIFFERENTIATION

TikTok sudah memiliki native product discovery dan creator affiliate tools.

Maka Affiliate OS tidak perlu membuat:

> “another product marketplace.”

Affiliate OS harus membuat:

> **demand reasoning layer.**

---

# 65. DEMAND ENGINE POSITIONING

```text
TikTok
     ↓
Raw Market Signals
     ↓
┌──────────────────────────┐
│    DEMAND ENGINE         │
│                          │
│ Detect                   │
│ Normalize                │
│ Validate                 │
│ Score                    │
│ Explain                  │
└──────────────────────────┘
     ↓
Opportunity Engine
```

---

# 66. FINAL DEFINITION

> **Demand Discovery Engine adalah intelligence layer yang mengubah raw market evidence menjadi structured, scored, explainable demand signals yang dapat digunakan Affiliate OS untuk menentukan opportunity affiliate.**

---

# 67. FINAL SCOPE LOCK

### BUILD NOW

```text
✓ Demand Entity
✓ Signal Entity
✓ Signal Taxonomy
✓ Evidence Capture
✓ Normalization
✓ Demand Clustering
✓ Confidence
✓ Demand Scoring
✓ Product Matching
✓ Opportunity Handoff
✓ Explainable Decision
```

### LATER

```text
→ Automated scraping
→ Real-time monitoring
→ Predictive forecasting
→ Cross-platform demand graph
→ Autonomous discovery
```

---

# 68. FOUNDATION DECISION

**DEMAND DISCOVERY ENGINE v1.0 — APPROVED**

Core philosophy:

> **Don't chase what is viral. Detect what is demanded.**

Core system:

```text
EVIDENCE
   ↓
SIGNAL
   ↓
DEMAND
   ↓
VALIDATION
   ↓
PRODUCT MATCH
   ↓
OPPORTUNITY
```

Next document:

# `05 — OPPORTUNITY ENGINE & SCORING SYSTEM v1.0`