# AFFILIATE OS — CREATOR FIT & PERSONALIZATION ENGINE v1.0

**Status:** Product Architecture  
**Version:** v1.0  
**Module:** Creator Intelligence  
**Product:** Affiliate OS  
**Input:** Creator Profile + Opportunity Engine  
**Output:** Personalized Opportunity Recommendation

---

# 1. PURPOSE

Creator Fit & Personalization Engine bertugas menjawab:

> **“Opportunity mana yang paling cocok untuk creator ini?”**

Bukan:

> “Produk apa yang sedang bagus?”

Karena satu opportunity bisa:

```text
GOOD FOR CREATOR A
≠
GOOD FOR CREATOR B
```

---

# 2. CORE PRINCIPLE

```text
GLOBAL OPPORTUNITY
        ↓
CREATOR CONTEXT
        ↓
PERSONALIZED OPPORTUNITY
```

Engine harus mengubah:

> **Best opportunity globally**

menjadi:

> **Best opportunity that this creator can realistically execute.**

---

# 3. CREATOR MODEL

Creator Profile terdiri dari:

```text
Creator
├── Identity
├── Niche
├── Audience
├── Content Style
├── Capability
├── Resources
├── Constraints
├── History
└── Goals
```

---

# 4. CREATOR IDENTITY

```text
Creator ID
Username
Account Type
Platform
Country
Language
Account Age
```

Tidak semua field wajib diisi.

MVP harus bisa berjalan dengan profile minimal.

---

# 5. CREATOR NICHE

Contoh:

```text
Beauty
Fashion
Tech
Home
Food
Fitness
Education
Parenting
Lifestyle
Gaming
```

Tetapi jangan memaksa creator memilih hanya satu niche.

Gunakan:

```text
Primary Niche
Secondary Niche
Adjacent Interests
```

---

# 6. AUDIENCE PROFILE

Engine menyimpan:

```text
Audience Interest
Audience Problem
Audience Intent
Audience Demographic
Audience Behavior
```

Contoh:

```text
Primary Audience:
Young adults

Interest:
Lifestyle

Behavior:
Product discovery

Buying Motivation:
Affordable solutions
```

---

# 7. CONTENT STYLE

Creator dapat memilih:

```text
Talking Head
Faceless
POV
Voice Over
Screen Recording
Tutorial
Review
Storytelling
Demo
Comparison
Live
```

---

# 8. FACeless MODE

Ini penting.

Creator tidak harus menunjukkan wajah.

Engine harus dapat melakukan:

```text
Creator:
Faceless

Opportunity:
Shoe Cleaner

Recommended format:
Hands-only demonstration
```

Jadi:

> **Faceless ≠ Low Opportunity.**

---

# 9. CREATOR CAPABILITY

Engine menyimpan kemampuan produksi:

```text
Video Editing
Copywriting
Voice Over
Camera
Lighting
Product Demonstration
Storytelling
Live Selling
Graphic Design
AI-assisted Production
```

---

# 10. CAPABILITY LEVEL

Setiap capability:

```text
0 = Tidak bisa
1 = Basic
2 = Intermediate
3 = Advanced
4 = Expert
```

Contoh:

```text
Video Editing:
2

Voice Over:
3

Talking Head:
0

Product Demo:
3
```

---

# 11. RESOURCE PROFILE

Creator memiliki resource berbeda.

```text
Phone
Camera
Mic
Lighting
Laptop
Editing Software
Product Samples
Budget
Time
```

---

# 12. BUDGET PROFILE

```text
ZERO
LOW
MEDIUM
HIGH
```

Contoh:

```text
Budget:
ZERO

Recommended opportunity:
Phone-only
No sample required
Low production cost
```

---

# 13. TIME PROFILE

```text
<30 min/day
30–60 min/day
1–2 hours/day
2–4 hours/day
4+ hours/day
```

Opportunity harus disesuaikan dengan kemampuan eksekusi.

---

# 14. CREATOR GOAL

Creator bisa memiliki tujuan berbeda:

```text
First Sale
Side Income
Max Commission
Build Audience
Build Authority
Test Niche
Scale Winning Product
Build Personal Brand
```

---

# 15. GOAL PRIORITY

Creator dapat memilih:

```text
Primary Goal
Secondary Goal
```

Contoh:

```text
Primary:
First Sale

Secondary:
Build Audience
```

Maka engine tidak akan terlalu agresif merekomendasikan opportunity yang membutuhkan audience besar.

---

# 16. CREATOR CONSTRAINT

Constraint penting.

```text
No Face
No Product Sample
No Budget
Limited Time
No Voice
No Camera
No Live
No Editing Skill
```

Constraint menjadi filter.

---

# 17. HARD VS SOFT CONSTRAINT

### HARD CONSTRAINT

Tidak boleh dilanggar.

Contoh:

```text
No Face
```

Engine tidak merekomendasikan:

> “Talking-head review.”

### SOFT CONSTRAINT

Bisa dilanggar jika opportunity sangat kuat.

Contoh:

```text
Prefer:
<30 min/day
```

---

# 18. CREATOR FIT SCORE

Creator Fit:

```text
Niche Match
+
Audience Match
+
Content Style Match
+
Capability Match
+
Resource Match
+
Goal Match
```

---

# 19. INITIAL WEIGHT

```text
Niche Match            20%
Audience Match         20%
Content Style          15%
Capability Match       15%
Resource Match         10%
Goal Match             10%
Historical Performance 10%
```

Total:

```text
100%
```

---

# 20. NICHE MATCH

Contoh:

```text
Creator:
Home & Kitchen

Opportunity:
Kitchen Organizer

Niche Match:
95
```

Sedangkan:

```text
Creator:
Tech

Opportunity:
Kitchen Organizer

Niche Match:
40
```

---

# 21. AUDIENCE MATCH

Pertanyaan:

> Apakah audience creator kemungkinan memiliki problem tersebut?

Contoh:

```text
Audience:
Parents

Demand:
Kids educational tools

Audience Match:
HIGH
```

---

# 22. CONTENT STYLE MATCH

Contoh:

```text
Creator Style:
Faceless Demo

Product:
Cleaning Tool

Match:
HIGH
```

Tidak perlu memaksa creator mengubah style.

---

# 23. CAPABILITY MATCH

Contoh:

```text
Opportunity:
Advanced beauty tutorial

Creator:
No beauty demonstration skill

Capability Match:
LOW
```

Opportunity dapat diturunkan.

---

# 24. RESOURCE MATCH

Contoh:

```text
Creator:
Phone only

Opportunity:
Requires studio setup

Resource Match:
LOW
```

Sebaliknya:

```text
Creator:
Phone only

Opportunity:
Hands-only product demo

Resource Match:
HIGH
```

---

# 25. GOAL MATCH

Contoh:

```text
Goal:
First Sale

Opportunity:
High demand
Low complexity
Low price
Easy demonstration

Goal Match:
HIGH
```

---

# 26. HISTORICAL FIT

Setelah creator mulai melakukan experiment, engine melihat:

```text
Past Products
Past Angles
Past Hooks
Past Formats
Past Results
```

Contoh:

```text
Creator repeatedly performs well with:
Problem/Solution
```

Maka engine menaikkan opportunity yang menggunakan format tersebut.

---

# 27. PERSONALIZATION LOOP

```text
PROFILE
   ↓
RECOMMENDATION
   ↓
EXECUTION
   ↓
RESULT
   ↓
LEARNING
   ↓
UPDATED PROFILE
```

---

# 28. CREATOR LEARNING

Engine dapat mempelajari:

```text
What works
What doesn't
What creator prefers
What audience responds to
```

---

# 29. PREFERENCE LEARNING

Contoh:

Creator selalu memilih:

```text
Faceless
Voice-over
Before/after
Low-cost products
```

Engine dapat menyimpulkan:

```text
Preferred Production Pattern
=
Faceless + VO + Demonstration
```

---

# 30. BEHAVIORAL PERSONALIZATION

Jangan hanya bertanya kepada creator.

Lihat juga:

```text
What creator actually does.
```

Jika profile mengatakan:

```text
Likes tutorials
```

tetapi 20 content terakhir:

```text
POV + Storytelling
```

behavior harus lebih dipercaya.

---

# 31. PREFERENCE VS PERFORMANCE

Pisahkan:

```text
Creator Preference
```

dan:

```text
Creator Performance
```

Karena:

> creator bisa suka format tertentu tetapi audience tidak menyukainya.

---

# 32. PERSONALIZATION MATRIX

```text
                 CREATOR FIT

               LOW          HIGH

OPPORTUNITY
LOW            PASS         WATCH

HIGH           RESEARCH     PRIORITY
```

---

# 33. OPPORTUNITY PERSONALIZATION

Opportunity Engine memberikan:

```text
Opportunity Score
```

Creator Engine memberikan:

```text
Creator Fit
```

Kemudian:

```text
Personalized Score
=
Opportunity Score
×
Creator Fit
```

---

# 34. EXECUTION FEASIBILITY

Tambahkan:

```text
Execution Feasibility
```

Formula:

```text
Personalized Opportunity
=
Opportunity
×
Creator Fit
×
Execution Feasibility
```

---

# 35. EXECUTION FEASIBILITY

Faktor:

```text
Time
Budget
Equipment
Skill
Product Access
Content Complexity
```

---

# 36. ZERO-FOLLOWER / EARLY CREATOR MODE

Creator baru harus memiliki mode khusus:

```text
EARLY CREATOR MODE
```

Prioritas:

```text
Easy Content
Strong Problem
Low Production Cost
Low Dependency on Existing Audience
Fast Testing
```

---

# 37. IMPORTANT

Affiliate OS tidak boleh mengatakan:

> “Follower kamu sedikit, jadi tidak cocok.”

Sebaliknya:

> “Karena account masih tahap awal, pilih opportunity yang dapat divalidasi dengan content quality dan problem relevance, bukan yang sangat bergantung pada existing audience.”

---

# 38. ACCOUNT MATURITY

```text
NEW
EARLY
GROWING
ESTABLISHED
ADVANCED
```

Contoh:

```text
0–1K:
NEW / EARLY

1K–10K:
GROWING

10K+:
ESTABLISHED
```

Threshold dapat dikonfigurasi berdasarkan platform.

---

# 39. PLATFORM-AWARENESS

Jangan hard-code satu angka follower untuk semua negara.

Alasannya:

> TikTok Shop eligibility dan fitur creator dapat berbeda menurut market dan account type.

Dokumentasi TikTok Shop terbaru menunjukkan perbedaan requirement dan creator types antar-market; karena itu Affiliate OS harus menyimpan **market + account type + eligibility status** sebagai data, bukan menjadikan satu angka global sebagai rule.

---

# 40. ELIGIBILITY LAYER

Sebelum opportunity dikirim ke creator:

```text
Opportunity
      ↓
Eligibility Check
      ↓
Creator Fit
```

Eligibility meliputi:

```text
Age
Country
Account Type
E-commerce Permission
Platform Eligibility
Product Eligibility
```

---

# 41. WHY THIS MATTERS

Opportunity score tinggi tetapi creator belum eligible:

```text
Opportunity:
92

Creator:
Not Eligible
```

Output:

```text
NOT ACTIONABLE
```

Bukan:

```text
TEST NOW
```

---

# 42. CREATOR PROFILE — MVP

MVP tidak perlu meminta 50 pertanyaan.

Minimal:

```text
Niche
Content Style
Face / Faceless
Budget
Time
Equipment
Skill
Goal
```

---

# 43. PROGRESSIVE PROFILING

Profile berkembang seiring penggunaan.

```text
START
 ↓
Minimal Profile
 ↓
First Tests
 ↓
Performance Data
 ↓
Behavioral Profile
 ↓
Advanced Personalization
```

---

# 44. WHY PROGRESSIVE?

Jika onboarding terlalu panjang:

> creator belum mendapatkan value tetapi sudah diminta mengisi banyak data.

MVP harus:

> **get value first, learn later.**

---

# 45. PERSONALIZED DASHBOARD

Dashboard utama creator:

```text
FOR YOU

🔥 Best Opportunity
🟢 Easy Win
🧪 Best Test
🎯 Best Fit
💰 Best Economics
📈 Emerging
```

---

# 46. BEST OPPORTUNITY

```text
Product:
Portable Blender

Opportunity:
84

Creator Fit:
93

Execution:
91

Personalized Score:
89
```

Output:

> **Recommended for You**

---

# 47. EASY WIN

Criteria:

```text
Low Complexity
High Creator Fit
Low Cost
Strong Content Potential
```

Tujuan:

> membantu creator mendapatkan kemenangan awal.

---

# 48. BEST TEST

Criteria:

```text
Strong hypothesis
Low testing cost
Fast feedback
```

Ini cocok untuk creator yang sedang mencari product-market fit.

---

# 49. BEST ECONOMICS

Criteria:

```text
Expected Value
×
Conversion Potential
×
Creator Fit
```

Bukan hanya:

> commission rate.

---

# 50. BEST FIT

Opportunity dengan:

```text
Highest Creator Fit
```

walaupun belum tentu memiliki Opportunity Score tertinggi secara global.

---

# 51. RECOMMENDATION EXPLANATION

Setiap recommendation wajib menjawab:

```text
WHY YOU?
```

Contoh:

> Produk ini direkomendasikan karena niche kamu relevan, bisa dibuat faceless, tidak membutuhkan setup mahal, dan format before/after cocok dengan pola content yang sebelumnya perform.

---

# 52. AVOID BLACK BOX

Jangan:

> “AI memilih produk ini.”

Harus:

```text
Recommended because:

✓ Niche match
✓ Audience problem match
✓ Faceless compatible
✓ Low production cost
✓ Strong demonstration
✓ Similar past content performed well
```

---

# 53. PERSONALIZATION CONFIDENCE

```text
LOW
MEDIUM
HIGH
```

Confidence rendah jika:

```text
Profile incomplete
Little history
No experiment data
```

---

# 54. COLD START

Creator baru:

```text
No history
No performance data
```

Engine menggunakan:

```text
Declared Preferences
+
Niche
+
Audience
+
Constraints
+
Global Opportunity
```

---

# 55. WARM START

Setelah beberapa experiment:

```text
Profile
+
Behavior
+
Performance
```

Recommendation menjadi lebih personal.

---

# 56. HOT PROFILE

Creator memiliki banyak historical data.

Engine dapat mengetahui:

```text
Winning Products
Winning Angles
Winning Hooks
Winning Formats
Winning Price Range
Winning Categories
```

---

# 57. CREATOR DNA

Future concept:

```text
CREATOR DNA
```

Contoh:

```text
Creator DNA

Niche:
Lifestyle

Best Format:
POV

Best Hook:
Problem-first

Best Product:
Low-ticket utility

Best Content Length:
20–35 sec

Best Angle:
Before/after

Best Production:
Faceless
```

---

# 58. CREATOR DNA SCORE

Setiap creator dapat memiliki:

```text
Content DNA
Audience DNA
Product DNA
Execution DNA
```

---

# 59. CONTENT DNA

```text
Format
Hook
Length
Style
Voice
Visual Pattern
```

---

# 60. PRODUCT DNA

```text
Price
Category
Problem
Visuality
Commission
Complexity
```

---

# 61. AUDIENCE DNA

```text
Problems
Interests
Purchase Intent
Response Patterns
```

---

# 62. EXECUTION DNA

```text
Production Speed
Editing Ability
Budget
Equipment
Availability
```

---

# 63. PERSONALIZATION ENGINE

Architecture:

```text
                    CREATOR
                       ↓
              ┌────────────────┐
              │ Creator Profile│
              └────────────────┘
                       ↓
             ┌──────────────────┐
             │ Personalization  │
             │     Engine       │
             └──────────────────┘
                       ↑
                       │
Opportunity ───────────┘
                       ↓
               Recommendation
```

---

# 64. RECOMMENDATION PIPELINE

```text
ALL OPPORTUNITIES
       ↓
Eligibility Filter
       ↓
Constraint Filter
       ↓
Creator Fit
       ↓
Execution Feasibility
       ↓
Personalized Score
       ↓
Top Opportunities
```

---

# 65. HARD FILTERS

Filter out:

```text
Not eligible
Policy risk
Impossible resource requirement
Wrong country/market
Unavailable product
Hard constraint violation
```

---

# 66. SOFT RANKING

Remaining opportunity diranking berdasarkan:

```text
Creator Fit
Opportunity Score
Execution Feasibility
Goal Match
Historical Evidence
```

---

# 67. RECOMMENDATION LIMIT

Jangan tampilkan 100 recommendation.

Default:

```text
TOP 5
```

Kemudian:

```text
See More
```

---

# 68. TOP 5 STRUCTURE

```text
#1 Best Overall
#2 Easiest Test
#3 Highest Potential
#4 Best Fit
#5 Emerging Opportunity
```

---

# 69. CREATOR FEEDBACK

Setelah recommendation:

```text
👍 Relevant
👎 Not relevant
❤️ Interested
🚫 Not for me
```

Feedback menjadi data.

---

# 70. EXPLICIT FEEDBACK

Creator dapat mengatakan:

```text
"I don't want beauty products."
```

Engine menyimpan:

```text
Negative Preference
```

---

# 71. NEGATIVE PREFERENCE

Contoh:

```text
Avoid:
Beauty
High-ticket
Talking-head
Live
```

Negative preference harus menjadi filter atau penalty.

---

# 72. EXPLORATION VS EXPLOITATION

Engine harus menyeimbangkan:

```text
EXPLOIT
Use what already works.

EXPLORE
Try something new.
```

---

# 73. EXPLORATION SCORE

Misalnya:

```text
80%
Known Fit
20%
Exploration
```

Untuk creator baru:

```text
60%
Known Fit
40%
Exploration
```

Tujuan:

> menemukan winning pattern tanpa membuat recommendation terlalu sempit.

---

# 74. PERSONALIZATION SHOULD NOT CREATE A BUBBLE

Jika creator selalu diberi:

> niche yang sama,

creator bisa kehilangan opportunity baru.

Maka engine sesekali memberikan:

```text
Adjacent Opportunity
```

---

# 75. ADJACENT OPPORTUNITY

Contoh:

```text
Primary:
Home

Adjacent:
Lifestyle
Organization
Cleaning
Kitchen
```

Bukan:

```text
Home
→
Cryptocurrency
```

---

# 76. OPPORTUNITY EXPLORATION

Engine dapat mengatakan:

> “Ini bukan niche utama kamu, tetapi audience overlap tinggi dan production fit sangat baik.”

---

# 77. PERSONALIZATION SCORE

Final model:

```text
Personalized Score =
Opportunity Score
×
Creator Fit
×
Execution Feasibility
×
Goal Alignment
```

Semua dinormalisasi ke 0–1.

---

# 78. EXAMPLE

```text
Opportunity Score:
84

Creator Fit:
93

Execution:
90

Goal Alignment:
95
```

Maka:

```text
Personalized Score
=
84 × 0.93 × 0.90 × 0.95
≈ 66.7
```

Score ini bukan pengganti Opportunity Score.

Ini:

> **priority score untuk creator tertentu.**

---

# 79. IMPORTANT DISTINCTION

```text
Opportunity Score
=
How good is the opportunity?

Personalized Score
=
How good is this opportunity
FOR THIS CREATOR?
```

---

# 80. RECOMMENDATION OBJECT

```text
Recommendation
├── opportunity_id
├── creator_id
├── personalized_score
├── creator_fit
├── execution_feasibility
├── goal_alignment
├── reason
├── confidence
└── recommended_action
```

---

# 81. API CONTRACT

```text
GET /creator/profile

PUT /creator/profile

GET /creator/fit/:opportunity_id

GET /creator/recommendations

POST /creator/preferences

POST /creator/feedback

GET /creator/dna
```

---

# 82. DATA MODEL

```text
CreatorProfile
├── id
├── niche
├── audience
├── content_style
├── capabilities
├── resources
├── constraints
├── goals
└── maturity

CreatorPreference
├── creator_id
├── preference_type
├── value
├── weight
└── source

CreatorPerformance
├── creator_id
├── product
├── category
├── format
├── angle
├── hook
├── views
├── clicks
├── orders
├── conversion
├── commission
└── result
```

---

# 83. DATA SOURCE PRIORITY

Untuk personalization:

```text
1. Actual Performance
2. Actual Behavior
3. Explicit Feedback
4. Declared Profile
5. Generic Assumption
```

Semakin ke bawah:

> semakin rendah confidence.

---

# 84. AI ROLE

AI digunakan untuk:

```text
Profile inference
Content classification
Audience pattern extraction
Preference detection
Recommendation explanation
Adjacent opportunity discovery
```

AI tidak boleh mengarang historical performance.

---

# 85. RULE ENGINE + AI

Architecture:

```text
Raw Data
   ↓
Structured Data
   ↓
Rules
   ↓
AI Analysis
   ↓
Scoring
   ↓
Recommendation
```

---

# 86. WHY HYBRID?

Rules bagus untuk:

```text
Eligibility
Constraints
Hard filters
Policy
Score calculation
```

AI bagus untuk:

```text
Semantic matching
Pattern recognition
Explanation
Clustering
```

---

# 87. MVP BUILD

### BUILD NOW

```text
✓ Creator Profile
✓ Niche
✓ Audience
✓ Content Style
✓ Face/Faceless
✓ Budget
✓ Time
✓ Equipment
✓ Skills
✓ Goals
✓ Constraints
✓ Creator Fit
✓ Execution Feasibility
✓ Personalized Ranking
✓ Recommendation Explanation
✓ Feedback
```

---

# 88. LATER

```text
→ Automatic Creator DNA
→ Behavioral embeddings
→ Advanced prediction
→ Cross-platform creator graph
→ Automated audience inference
→ Reinforcement learning
```

---

# 89. MVP USER JOURNEY

```text
Creator Sign Up
      ↓
Answer 7–10 questions
      ↓
Profile Created
      ↓
Affiliate OS loads opportunities
      ↓
Eligibility Filter
      ↓
Creator Fit
      ↓
Personalized Ranking
      ↓
Top 5 Recommendations
      ↓
Creator chooses one
      ↓
Experiment
      ↓
Result
      ↓
Engine learns
```

---

# 90. FIRST-TIME CREATOR EXPERIENCE

Creator melihat:

```text
WELCOME

Tell us:
1. Your niche
2. Your content style
3. Face or faceless
4. Budget
5. Time
6. Equipment
7. Main goal
```

Kemudian:

> **“We found your first opportunities.”**

---

# 91. FIRST RECOMMENDATION

Jangan menampilkan:

> 50 products.

Tampilkan:

```text
Your Best First Test

Why:
✓ Easy to produce
✓ Fits your niche
✓ No expensive equipment
✓ Strong problem
✓ Good demonstration
```

---

# 92. SUCCESS METRIC

Creator Fit Engine tidak dinilai dari:

> berapa banyak recommendation diberikan.

Tetapi:

```text
Recommendation → Test
Test → Positive Result
Positive Result → Repeat
```

---

# 93. PRIMARY METRICS

```text
Recommendation Acceptance Rate
Recommendation Test Rate
Opportunity-to-Experiment Rate
Personalized Win Rate
Creator Retention
```

---

# 94. PERSONALIZATION QUALITY

Metric penting:

> **Personalized Recommendation Win Rate**

Bandingkan:

```text
Generic Recommendation
vs
Personalized Recommendation
```

---

# 95. STRATEGIC MOAT

Semakin banyak creator menggunakan Affiliate OS:

```text
Creator
↓
Experiment
↓
Performance
↓
Pattern
↓
Better Recommendation
↓
More Creator Success
```

Data loop ini menjadi proprietary learning layer.

---

# 96. SYSTEM POSITION

Final architecture:

```text
              AFFILIATE OS

Demand Discovery
       ↓
Opportunity Engine
       ↓
Creator Fit
       ↓
Personalization
       ↓
Content Production
       ↓
Distribution
       ↓
Performance
       ↓
Learning
       ↺
```

---

# 97. FINAL DEFINITION

> **Creator Fit & Personalization Engine adalah intelligence layer yang menentukan opportunity, format, angle, dan execution path yang paling sesuai dengan niche, audience, capability, resource, goal, constraints, dan historical performance seorang creator.**

---

# 98. FINAL PRINCIPLE

Affiliate OS tidak boleh hanya bertanya:

> **“Apa yang sedang laku?”**

Tidak cukup juga:

> **“Apa yang cocok dengan niche?”**

Pertanyaan finalnya:

> **“Apa yang sedang memiliki opportunity, cocok dengan creator ini, realistis untuk dieksekusi sekarang, dan layak diuji berdasarkan evidence?”**

---

# 99. FINAL SCOPE LOCK

**06 — CREATOR FIT & PERSONALIZATION ENGINE v1.0 — APPROVED**

Core flow:

```text
CREATOR
   ↓
PROFILE
   ↓
ELIGIBILITY
   ↓
CONSTRAINTS
   ↓
CREATOR FIT
   ↓
EXECUTION FEASIBILITY
   ↓
PERSONALIZATION
   ↓
TOP OPPORTUNITIES
   ↓
EXPERIMENT
   ↓
LEARNING
```

**Next document:**

# `07 — CONTENT PRODUCTION OS v1.0`