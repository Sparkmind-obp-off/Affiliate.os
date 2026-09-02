# AFFILIATE OS — OPPORTUNITY ENGINE & SCORING SYSTEM v1.0

**Status:** Product Architecture  
**Version:** v1.0  
**Module:** Opportunity Intelligence  
**Product:** Affiliate OS  
**Input:** Demand Discovery Engine  
**Output:** Qualified Affiliate Opportunity

---

# 1. PURPOSE

Opportunity Engine adalah mesin yang mengubah:

> **Validated Demand + Product + Competition + Economics + Content Potential**

menjadi:

> **Qualified Affiliate Opportunity**

Tujuan utamanya bukan mencari produk sebanyak mungkin.

Tujuannya:

> **menentukan opportunity mana yang paling layak diuji oleh creator dengan resource terbatas.**

---

# 2. CORE PRINCIPLE

```text
PRODUCT ≠ OPPORTUNITY
```

Sebuah produk bisa:

- laris;
- viral;
- komisinya tinggi;
- banyak creator menjual;

tetapi belum tentu menjadi opportunity yang bagus untuk creator tertentu.

Karena:

```text
Opportunity
=
Demand
×
Product Fit
×
Creator Fit
×
Content Potential
×
Economics
×
Timing
÷
Risk
```

---

# 3. OPPORTUNITY LOOP

```text
DEMAND
   ↓
PRODUCT MATCH
   ↓
CREATOR FIT
   ↓
COMPETITION
   ↓
ECONOMICS
   ↓
CONTENT POTENTIAL
   ↓
RISK
   ↓
OPPORTUNITY SCORE
   ↓
DECISION
```

---

# 4. INPUT FROM DEMAND ENGINE

Opportunity Engine menerima:

```text
Demand ID
Problem
Audience
Demand Score
Demand Confidence
Momentum
Evidence
```

Contoh:

```text
Demand:
White Shoes Cleaning

Demand Score:
82

Confidence:
HIGH

Momentum:
GROWING
```

---

# 5. PRODUCT INPUT

Setiap product opportunity memiliki:

```text
Product ID
Product Name
Category
Price
Commission
Sales
GMV
Rating
Reviews
Seller
Stock
Product Age
Campaign
```

Jika data tersedia.

---

# 6. CREATOR CONTEXT

Ini penting.

Opportunity tidak boleh dinilai hanya dari product.

Engine harus memahami creator:

```text
Creator ID
Niche
Audience
Content Style
Follower Count
Historical Performance
Available Resources
Content Capability
```

---

# 7. ZERO-FOLLOWER PRINCIPLE

Affiliate OS harus tetap bisa bekerja untuk creator:

```text
Followers = 0
```

Karena objective:

> menemukan opportunity yang dapat diuji melalui content/distribution,

bukan:

> hanya merekomendasikan produk kepada creator besar.

---

# 8. CREATOR FIT

Product yang bagus untuk creator A belum tentu bagus untuk creator B.

Contoh:

```text
Creator A:
Beauty

Product:
Kitchen Tool

Fit:
LOW
```

Sedangkan:

```text
Creator B:
Home & Kitchen

Product:
Kitchen Tool

Fit:
HIGH
```

---

# 9. OPPORTUNITY DIMENSIONS

Initial model menggunakan:

```text
01 Demand
02 Product Fit
03 Creator Fit
04 Content Potential
05 Economics
06 Competition
07 Momentum
08 Risk
```

---

# 10. SCORING MODEL

Initial score:

```text
Demand Strength        20%
Product Fit            15%
Creator Fit            15%
Content Potential      15%
Economics              10%
Competition            10%
Momentum                5%
Risk                    10%
```

Total:

```text
100%
```

---

# 11. DEMAND STRENGTH — 20%

Mengambil data dari Demand Discovery Engine.

Input:

```text
Problem Strength
Intent
Commercial Signal
Signal Diversity
Confidence
```

Range:

```text
0–100
```

---

# 12. PRODUCT FIT — 15%

Pertanyaan:

> Apakah produk benar-benar menyelesaikan demand?

Scoring:

```text
90–100
Direct solution

70–89
Strong solution

50–69
Partial solution

30–49
Weak relation

0–29
Not relevant
```

---

# 13. CREATOR FIT — 15%

Faktor:

```text
Niche Match
Audience Match
Content Style Match
Creator Capability
Existing Audience Signal
```

Contoh:

```text
Product:
Hair Styling Tool

Creator:
Beauty creator

Creator Fit:
92
```

---

# 14. CONTENT POTENTIAL — 15%

Ini salah satu komponen paling penting.

Produk harus mudah dijadikan content.

Signal:

```text
Visual Demo
Before/After
Transformation
Problem/Solution
Comparison
Unboxing
Tutorial
Reaction
Test
```

Semakin mudah didemonstrasikan:

> semakin tinggi content potential.

---

# 15. CONTENT DEMONSTRABILITY

Contoh:

```text
Product A:
Shoe Cleaner

Can demonstrate:
Before → Process → After

Score:
95
```

Sedangkan:

```text
Product B:
Generic USB Cable

Demonstration:
Weak

Score:
35
```

---

# 16. ECONOMICS — 10%

Economics tidak hanya:

> commission %.

Engine memperhitungkan:

```text
Product Price
Commission
Estimated Commission / Order
Conversion Potential
Refund Risk
Content Cost
```

---

# 17. COMMISSION VALUE

Contoh:

```text
Product A

Price:
Rp50.000

Commission:
10%

Expected commission:
Rp5.000
```

Bandingkan dengan:

```text
Product B

Price:
Rp300.000

Commission:
10%

Expected commission:
Rp30.000
```

Tetapi:

> commission besar ≠ otomatis lebih baik.

Karena conversion bisa berbeda.

---

# 18. EXPECTED VALUE

Initial concept:

```text
Expected Affiliate Value
=
Expected Conversion
×
Commission / Sale
```

Kemudian dapat dikurangi:

```text
Content Cost
Refund Risk
Testing Cost
```

---

# 19. COMPETITION — 10%

Competition harus dibaca secara relatif.

Signal:

```text
Number of Creators
Content Saturation
Seller Count
Product Similarity
Dominant Creators
```

---

# 20. COMPETITION ≠ BAD

High competition:

```text
Demand HIGH
Competition HIGH
```

masih bisa menjadi opportunity.

Karena:

```text
High Demand
+
Weak Content Angle
=
Opportunity
```

---

# 21. COMPETITION GAP

Engine harus mencari:

> **Where are competitors weak?**

Contoh:

```text
100 creators
mostly making:
"Product showcase"
```

Potential opportunity:

```text
Problem-first content
Comparison content
Real test
Before/after
```

---

# 22. MOMENTUM — 5%

Momentum berasal dari Demand Engine.

Status:

```text
DECLINING
STABLE
EMERGING
GROWING
ACCELERATING
```

---

# 23. TIMING

Timing menjadi multiplier.

Contoh:

```text
Demand:
High

Product:
Good

Timing:
Poor
```

Opportunity dapat turun.

Sebaliknya:

```text
Demand:
Growing

Season:
Approaching

Product:
Strong
```

Opportunity dapat naik.

---

# 24. RISK — 10%

Risk categories:

```text
Product Risk
Seller Risk
Refund Risk
Competition Risk
Platform Risk
Content Risk
Compliance Risk
Economic Risk
```

---

# 25. PRODUCT RISK

Signal:

```text
Low Rating
Negative Reviews
Frequent Complaints
Low Product Quality
Inconsistent Reviews
```

---

# 26. SELLER RISK

Signal:

```text
Poor Seller Rating
Shipping Problems
High Complaint Rate
Unstable Stock
```

Jika data tersedia.

---

# 27. REFUND RISK

Produk dengan:

```text
Sizing Issues
Expectation Gap
Quality Problems
```

dapat memiliki higher refund risk.

---

# 28. PLATFORM / POLICY RISK

Produk yang berpotensi melanggar policy harus:

```text
FLAG
```

bukan dipaksakan masuk opportunity.

---

# 29. OPPORTUNITY SCORE

Formula konseptual:

```text
Opportunity Score =
(
Demand × 0.20
+
ProductFit × 0.15
+
CreatorFit × 0.15
+
ContentPotential × 0.15
+
Economics × 0.10
+
Competition × 0.10
+
Momentum × 0.05
+
RiskAdjustedScore × 0.10
)
```

---

# 30. RISK-ADJUSTED SCORE

Risk harus dibalik.

Contoh:

```text
Risk Score:
20 = Low Risk
50 = Medium Risk
80 = High Risk
```

Maka:

```text
RiskAdjustedScore = 100 - Risk
```

---

# 31. OPPORTUNITY CLASSIFICATION

```text
90–100
🔥 EXCEPTIONAL

80–89
🟢 STRONG

70–79
🟡 TESTABLE

60–69
🟠 WATCH

<60
🔴 PASS
```

---

# 32. DECISION ENGINE

Score tidak langsung berarti:

> POST NOW.

Engine menghasilkan decision.

```text
TEST NOW
TEST WITH ANGLE
WATCH
RESEARCH MORE
PASS
```

---

# 33. TEST NOW

Conditions:

```text
High Demand
High Product Fit
High Content Potential
Acceptable Risk
```

Output:

> **TEST NOW**

---

# 34. TEST WITH ANGLE

Conditions:

```text
Product good
Demand good
Competition high
```

Tetapi:

```text
Content Gap exists
```

Output:

> **TEST WITH DIFFERENT ANGLE**

---

# 35. WATCH

Conditions:

```text
Demand emerging
Evidence insufficient
```

Output:

> monitor before investing.

---

# 36. RESEARCH MORE

Conditions:

```text
Conflicting signals
Missing data
Low confidence
```

Output:

> collect additional evidence.

---

# 37. PASS

Conditions:

```text
Weak demand
Poor product fit
Bad economics
High risk
```

Output:

> don't spend content resources.

---

# 38. OPPORTUNITY CARD

```text
┌─────────────────────────────────────┐
│ OPPORTUNITY #OPP-00124              │
├─────────────────────────────────────┤
│ Product                             │
│ Shoe Cleaning Foam                  │
│                                     │
│ Demand Score          82            │
│ Product Fit          94             │
│ Creator Fit          88             │
│ Content Potential     95            │
│ Economics             72            │
│ Competition           64            │
│ Momentum              86            │
│ Risk                  18            │
│                                     │
│ OPPORTUNITY SCORE     84            │
│                                     │
│ 🟢 STRONG                           │
│                                     │
│ → TEST NOW                          │
└─────────────────────────────────────┘
```

---

# 39. WHY THIS OPPORTUNITY?

Engine wajib menghasilkan explanation.

Contoh:

```text
WHY?

✓ Strong demand evidence
✓ Direct product-problem fit
✓ Highly demonstrable
✓ Creator niche aligned
✓ Growing demand momentum

⚠ Competition is moderate-high
```

---

# 40. RECOMMENDED CONTENT ANGLE

Opportunity Engine tidak berhenti pada:

> “jual produk X.”

Engine memberikan:

```text
Recommended Angle
Content Format
Problem Hook
Proof Mechanism
CTA Direction
```

---

# 41. ANGLE ENGINE

Contoh:

```text
Demand:
Dirty white shoes

Product:
Shoe Cleaner

Possible angles:

01 — Before / After
02 — 30-second cleaning test
03 — "Jangan buang sepatu dulu"
04 — Cheap vs expensive cleaner
05 — Real-world test
```

---

# 42. ANGLE SCORE

Setiap angle dapat score:

```text
Hook Strength
Problem Relevance
Demonstrability
Novelty
Proof
Audience Fit
```

---

# 43. OPPORTUNITY → CONTENT

Flow:

```text
Opportunity
    ↓
Best Angle
    ↓
Hook
    ↓
Content Template
    ↓
Production
    ↓
Publish
    ↓
Performance
```

---

# 44. TEST DESIGN

Affiliate OS harus menganggap setiap opportunity sebagai experiment.

```text
Hypothesis
↓
Content
↓
Publish
↓
Measure
↓
Learn
```

---

# 45. EXPERIMENT OBJECT

```text
Experiment ID
Opportunity ID
Product
Angle
Hook
Format
Published At
Views
Clicks
Orders
GMV
Commission
CTR
Conversion
Refund
Status
```

---

# 46. SUCCESS CRITERIA

Setiap test harus memiliki metric.

Contoh:

```text
Primary:
Product Clicks

Secondary:
Orders
Conversion
Commission
```

---

# 47. FEEDBACK LOOP

```text
OPPORTUNITY
     ↓
CONTENT
     ↓
RESULT
     ↓
LEARNING
     ↓
OPPORTUNITY MODEL
```

Hasil nyata harus kembali ke engine.

---

# 48. WINNER

Jika test berhasil:

```text
WINNER
```

System dapat:

```text
Scale
Create variations
Test new hooks
Test new angles
Test related products
```

---

# 49. LOSER

Jika gagal:

```text
FAILED
```

Tetapi failure harus dianalisis.

Possible reasons:

```text
Wrong product
Wrong angle
Wrong hook
Wrong audience
Wrong timing
Weak offer
Poor content execution
```

---

# 50. IMPORTANT

Jangan langsung menyimpulkan:

> product bad.

Karena:

```text
Product Failed
```

belum tentu:

```text
Demand Failed
```

Bisa saja:

```text
Demand = Strong
Product = Strong
Angle = Weak
```

---

# 51. OPPORTUNITY MATRIX

```text
                 DEMAND
              LOW        HIGH

PRODUCT
HIGH          WATCH      TEST

LOW           PASS       INVESTIGATE
```

Kemudian diperkuat dengan:

```text
Creator Fit
Content Potential
Economics
Risk
```

---

# 52. HIGH DEMAND + HIGH COMPETITION

Decision:

```text
Don't automatically reject.
```

Cari:

```text
Content Gap
Audience Gap
Angle Gap
Format Gap
Proof Gap
```

---

# 53. HIGH DEMAND + LOW COMPETITION

Potential:

> **Early Opportunity**

Tetapi harus dicek:

```text
Why is competition low?
```

Kemungkinan:

```text
Bad economics
Bad product
Low availability
Hard content
Low conversion
```

---

# 54. LOW DEMAND + HIGH COMMISSION

Decision:

> PASS / WATCH

Commission tidak boleh mengalahkan demand.

---

# 55. HIGH SALES + LOW CREATOR FIT

Decision:

> Not necessarily your opportunity.

Karena product bisa sangat bagus tetapi tidak cocok dengan creator.

---

# 56. HIGH CREATOR FIT + LOW DEMAND

Decision:

> WATCH / TEST SMALL

Creator fit saja belum cukup.

---

# 57. OPPORTUNITY PRIORITY

Jika terdapat 100 opportunity:

Engine harus menghasilkan:

```text
TOP 5
```

bukan:

```text
100 recommendations.
```

---

# 58. PRIORITIZATION

Initial priority:

```text
Priority Score
=
Opportunity Score
×
Confidence
×
Execution Feasibility
```

---

# 59. EXECUTION FEASIBILITY

Faktor:

```text
Can creator create content?
Can creator access product?
Can product be promoted?
Can content be produced cheaply?
Can creator test quickly?
```

---

# 60. ZERO-BUDGET MODE

Karena creator dapat memiliki resource terbatas, Affiliate OS menyediakan:

```text
ZERO-BUDGET
LOW-BUDGET
NORMAL
HIGH-BUDGET
```

---

# 61. ZERO-BUDGET OPPORTUNITY

Prioritaskan:

```text
No sample required
Easy demonstration
Existing product footage allowed where permitted
Low production complexity
Strong problem hook
```

Tetap harus memperhatikan platform rules dan hak penggunaan content.

---

# 62. LOW-BUDGET OPPORTUNITY

Prioritaskan:

```text
Simple setup
Cheap props
Simple filming
Phone-only production
```

---

# 63. RESOURCE-AWARE SCORING

Opportunity yang membutuhkan:

```text
Studio
Camera
Sample
Paid Ads
Large Audience
```

harus turun untuk creator yang tidak memiliki resource tersebut.

---

# 64. PERSONALIZED OPPORTUNITY

Output bukan:

> “Best product on TikTok.”

Output:

> **“Best opportunity for YOU right now.”**

---

# 65. STRATEGIC DIFFERENTIATION

TikTok sudah menyediakan product discovery, rankings, affiliate marketplace, dan berbagai analytics.

Maka Affiliate OS tidak perlu mencoba menggantikan seluruh native ecosystem.

Positioning:

```text
TikTok:
"What products exist?"

Affiliate OS:
"Which opportunity should I test,
why, and how?"
```

---

# 66. COMPETITIVE MOAT

Potential moat:

```text
Demand Graph
+
Opportunity History
+
Creator Performance
+
Content Performance
+
Experiment Results
```

Semakin banyak experiment:

> semakin banyak proprietary learning.

---

# 67. OPPORTUNITY GRAPH

Future architecture:

```text
Demand
  ↓
Product
  ↓
Creator
  ↓
Content
  ↓
Audience
  ↓
Transaction
```

Relationship:

```text
Demand → Product
Product → Creator
Creator → Content
Content → Audience
Audience → Transaction
```

---

# 68. LEARNING GRAPH

Contoh:

```text
Problem:
Dirty Shoes

Product:
Shoe Cleaner

Angle:
Before/After

Hook:
"Jangan buang sepatu ini dulu."

Result:
High CTR
High conversion

Learning:
Before/after + problem urgency
```

System menyimpan relationship tersebut.

---

# 69. FUTURE PREDICTION

Setelah cukup banyak data:

```text
New Demand
+
Known Pattern
+
Known Creator
+
Known Product Type
+
Historical Result
```

dapat menghasilkan:

> predicted opportunity.

Namun ini **bukan MVP**.

---

# 70. MVP SCOPE

BUILD:

```text
✓ Opportunity Entity
✓ Product Match
✓ Creator Fit
✓ Content Potential
✓ Economics
✓ Competition
✓ Risk
✓ Opportunity Score
✓ Priority
✓ Decision
✓ Explanation
✓ Recommended Angle
✓ Experiment Creation
```

---

# 71. DO NOT BUILD YET

```text
✗ Autonomous purchasing
✗ Automatic mass publishing
✗ Guaranteed sales prediction
✗ Fully autonomous affiliate operation
✗ Massive predictive AI
✗ Enterprise-scale recommendation engine
```

---

# 72. API CONTRACT

```text
POST /opportunities

GET /opportunities

GET /opportunities/:id

POST /opportunities/:id/score

POST /opportunities/:id/decision

POST /opportunities/:id/angles

POST /opportunities/:id/experiments

GET /opportunities/:id/performance
```

---

# 73. DATA MODEL

```text
Opportunity
├── id
├── demand_id
├── product_id
├── creator_id
├── score
├── priority
├── decision
├── confidence
├── risk
├── recommended_angle
├── created_at
└── updated_at

OpportunityScore
├── demand
├── product_fit
├── creator_fit
├── content_potential
├── economics
├── competition
├── momentum
├── risk
└── total

Experiment
├── id
├── opportunity_id
├── angle
├── hook
├── format
├── status
└── result
```

---

# 74. CORE SYSTEM CONTRACT

```text
Demand Engine
       ↓
Opportunity Engine
       ↓
Content Production OS
       ↓
Distribution
       ↓
Performance
       ↓
Learning
       ↺
```

---

# 75. NORTH STAR

Affiliate OS bukan:

> product finder.

Bukan:

> trend finder.

Bukan:

> AI content generator.

Core value:

> **Opportunity Decision System.**

---

# 76. FINAL DEFINITION

> **Opportunity Engine adalah decision layer yang menggabungkan validated demand, product fit, creator fit, content potential, economics, competition, momentum, dan risk untuk menentukan affiliate opportunity yang paling layak diuji.**

---

# 77. FINAL OUTPUT

Setiap opportunity harus menghasilkan:

```text
WHAT
→ Product

WHY
→ Demand Evidence

FOR WHOM
→ Creator / Audience

WHY NOW
→ Momentum

HOW
→ Content Angle

HOW GOOD
→ Opportunity Score

WHAT NEXT
→ Test / Watch / Pass
```

---

# 78. FINAL SCOPE LOCK

**05 — OPPORTUNITY ENGINE & SCORING SYSTEM v1.0 — APPROVED**

Core philosophy:

> **Don't ask "What product is trending?"**

Ask:

> **"Which opportunity has enough evidence to deserve my next content test?"**

Core flow:

```text
DEMAND
   ↓
PRODUCT
   ↓
FIT
   ↓
ECONOMICS
   ↓
CONTENT
   ↓
COMPETITION
   ↓
RISK
   ↓
SCORE
   ↓
PRIORITY
   ↓
TEST
   ↓
LEARNING
```

**Next document:**

# `06 — CREATOR FIT & PERSONALIZATION ENGINE v1.0`