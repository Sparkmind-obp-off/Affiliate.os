# 11 — AFFILIATE EXPERIMENTATION & GROWTH LOOP ENGINE v1.0

**Product:** Affiliate OS  
**Module:** 11  
**Version:** v1.0  
**Status:** Product Architecture

---

# 1. PURPOSE

Affiliate Experimentation & Growth Loop Engine adalah mesin yang mengubah hasil analytics menjadi:

```text
INSIGHT
↓
HYPOTHESIS
↓
EXPERIMENT
↓
EXECUTION
↓
MEASUREMENT
↓
LEARNING
↓
NEXT EXPERIMENT
```

Tujuan utamanya:

> **Membuat Affiliate OS mampu terus belajar dari hasil nyata dan menghasilkan eksperimen berikutnya secara sistematis.**

---

# 2. POSITIONING

Module ini bukan sekadar:

> A/B Testing Tool.

Dan bukan:

> Content Planner.

Tetapi:

> **Affiliate Growth Experimentation Engine.**

Engine menentukan:

```text
APA yang diuji
KENAPA diuji
BAGAIMANA diuji
METRIC apa yang digunakan
KAPAN dianggap menang
KAPAN dianggap gagal
APA yang dilakukan setelah hasil keluar
```

---

# 3. CORE PRINCIPLE

Affiliate growth bukan:

```text
POST
↓
WAIT
↓
HOPE
```

Tetapi:

```text
POST
↓
MEASURE
↓
LEARN
↓
CHANGE
↓
TEST
↓
MEASURE AGAIN
```

---

# 4. GROWTH LOOP

Core loop:

```text
DISCOVER
   ↓
SELECT
   ↓
CREATE
   ↓
DISTRIBUTE
   ↓
MEASURE
   ↓
ANALYZE
   ↓
EXPERIMENT
   ↓
LEARN
   ↓
SCALE
   ↓
DISCOVER AGAIN
```

---

# 5. INPUT

Engine menerima data dari:

```text
04 Demand Discovery
05 Opportunity Engine
06 Creator Fit
07 Content Production
08 Distribution
09 Performance Intelligence
10 Revenue Intelligence
```

---

# 6. OUTPUT

Engine menghasilkan:

```text
Experiment
Hypothesis
Variant
Target Metric
Expected Outcome
Experiment Status
Experiment Result
Learning
Decision
Next Action
```

---

# 7. EXPERIMENT OBJECT

Canonical object:

```text
Experiment
```

Fields:

```text
id
name
objective
hypothesis
opportunity_id
product_id
creator_id
content_id
channel
variable
control
variant
primary_metric
secondary_metrics
sample_target
duration
status
result
decision
learning
created_at
completed_at
```

---

# 8. EXPERIMENT STATUS

```text
DRAFT
↓
READY
↓
RUNNING
↓
COLLECTING_DATA
↓
COMPLETED
↓
ANALYZED
↓
DECIDED
```

---

# 9. EXPERIMENT TYPES

Affiliate OS mendukung:

```text
CONTENT
HOOK
ANGLE
CTA
FORMAT
PRODUCT
OFFER
PRICE
COMMISSION
DISTRIBUTION
POSTING_TIME
CONTENT_LENGTH
THUMBNAIL
CAPTION
HASHTAG
AUDIENCE
```

---

# 10. IMPORTANT

Jangan menguji semuanya sekaligus.

Contoh buruk:

```text
Hook berubah
+
Product berubah
+
CTA berubah
+
Video length berubah
+
Audience berubah
```

Jika hasil naik:

> tidak tahu apa penyebabnya.

---

# 11. ONE PRIMARY VARIABLE

Default rule:

> **Satu eksperimen = satu primary variable.**

Contoh:

```text
CONTROL
Hook A

VARIANT
Hook B
```

Variable:

```text
HOOK
```

---

# 12. HYPOTHESIS

Setiap experiment wajib memiliki hypothesis.

Format:

```text
IF
[change]

THEN
[expected result]

BECAUSE
[reason/evidence]
```

Contoh:

```text
IF
hook diubah dari generic menjadi problem-first

THEN
CTR akan meningkat

BECAUSE
audience langsung mengenali masalah yang ingin mereka selesaikan.
```

---

# 13. EVIDENCE-BASED HYPOTHESIS

Hypothesis tidak boleh muncul hanya dari feeling.

Prioritas evidence:

```text
Historical Performance
↓
Revenue Data
↓
Demand Data
↓
Competitor Pattern
↓
Creator Pattern
↓
Qualitative Signal
↓
Intuition
```

---

# 14. EXPERIMENT PRIORITY

Tidak semua eksperimen harus dijalankan.

Priority Score:

```text
Experiment Priority =
Impact
×
Confidence
×
Learning Value
÷
Effort
```

---

# 15. IMPACT

Impact menjawab:

> Jika eksperimen berhasil, seberapa besar dampaknya?

Score:

```text
1 = Very Low
2 = Low
3 = Medium
4 = High
5 = Very High
```

---

# 16. CONFIDENCE

Confidence berasal dari:

```text
Historical Evidence
Data Quality
Pattern Consistency
Previous Experiments
```

---

# 17. LEARNING VALUE

Eksperimen yang gagal tetapi memberikan pembelajaran besar tetap bernilai.

Contoh:

```text
Experiment A:
CTR +2%
Learning Low

Experiment B:
CTR -3%
But discovers audience mismatch
Learning High
```

Experiment B tetap valuable.

---

# 18. EFFORT

Estimasi:

```text
CONTENT CREATION
EDITING
DISTRIBUTION
DATA COLLECTION
ANALYSIS
```

---

# 19. EXPERIMENT QUEUE

System membuat:

```text
EXPERIMENT BACKLOG
```

Contoh:

```text
#01 Hook Test
Priority: 92

#02 CTA Test
Priority: 84

#03 Product Test
Priority: 78

#04 Posting Time
Priority: 51
```

---

# 20. BOTTLENECK-DRIVEN EXPERIMENT

Engine harus mencari bottleneck terlebih dahulu.

Contoh:

```text
Views:
HIGH

CTR:
LOW

CVR:
HIGH
```

Maka:

> Jangan fokus memperbaiki CVR.

Fokus:

> **CTR experiment.**

---

# 21. FUNNEL DIAGNOSIS

```text
VIEWS
↓
CTR
↓
PRODUCT VISIT
↓
CVR
↓
ORDER
↓
COMMISSION
```

System mencari titik terlemah.

---

# 22. EXAMPLE

```text
Views:
100K

CTR:
0.8%

CVR:
8%
```

Diagnosis:

```text
Traffic = Strong
CTR = Weak
CVR = Strong
```

Recommendation:

> Test hooks / product presentation / CTA.

---

# 23. SECOND EXAMPLE

```text
Views:
20K

CTR:
4%

CVR:
0.8%
```

Diagnosis:

```text
Traffic = Moderate
CTR = Strong
CVR = Weak
```

Recommendation:

> Test product fit, offer, positioning, dan expectation alignment.

---

# 24. EXPERIMENT GENERATOR

Engine dapat menghasilkan:

```text
Experiment Recommendation
```

berdasarkan bottleneck.

Contoh:

```text
BOTTLENECK:
LOW CTR

RECOMMENDED TEST:
Hook A vs Hook B
```

---

# 25. HOOK EXPERIMENT

```text
CONTROL:
“Ini barang yang aku pakai...”

VARIANT:
“Kalau kamu sering mengalami X,
coba lihat ini.”
```

Metric:

```text
CTR
```

Secondary:

```text
Watch Time
Completion Rate
Orders
Revenue
```

---

# 26. CTA EXPERIMENT

```text
CONTROL:
“Link ada di bawah.”

VARIANT:
“Kalau kamu sedang cari solusi ini,
cek produknya di sini.”
```

Primary:

```text
CTR
```

---

# 27. ANGLE EXPERIMENT

Product yang sama:

```text
ANGLE A:
Problem

ANGLE B:
Benefit

ANGLE C:
Comparison

ANGLE D:
Demonstration
```

System membandingkan:

```text
CTR
CVR
Revenue
```

---

# 28. FORMAT EXPERIMENT

```text
Talking Head
vs
Faceless Demo
vs
Screen Recording
vs
Product Demonstration
```

Metric:

```text
Revenue / 1K Views
```

---

# 29. PRODUCT EXPERIMENT

Jika dua product memiliki:

```text
Similar Demand
```

system dapat membuat test:

```text
Product A
vs
Product B
```

Metric utama:

```text
Expected Commission / 1K Views
```

---

# 30. DISTRIBUTION EXPERIMENT

```text
Platform A
vs
Platform B
```

atau:

```text
Posting Strategy A
vs
Posting Strategy B
```

Metric:

```text
Revenue Efficiency
```

---

# 31. TIME EXPERIMENT

Test:

```text
Time Slot A
vs
Time Slot B
```

Tetapi:

> Jangan langsung menyimpulkan waktu terbaik dari satu posting.

Harus ada repeated observations.

---

# 32. SAMPLE REQUIREMENT

Engine memiliki:

```text
Minimum Sample
```

berdasarkan metric.

Contoh:

```text
Views Test:
Need sufficient impressions.

CTR Test:
Need sufficient product impressions.

CVR Test:
Need sufficient clicks/orders.
```

---

# 33. NO PREMATURE WINNER

Jika:

```text
Variant A:
100 impressions

Variant B:
120 impressions
```

dan B lebih tinggi:

> belum cukup untuk menyebut B winner.

---

# 34. STATISTICAL CONFIDENCE

Future layer dapat menggunakan:

```text
Statistical Significance
Confidence Interval
Bayesian Probability
Sequential Testing
```

Namun:

> MVP tidak harus membangun statistical engine kompleks.

---

# 35. MVP DECISION MODEL

Gunakan:

```text
RESULT
+
SAMPLE SUFFICIENCY
+
EFFECT SIZE
+
CONSISTENCY
```

---

# 36. EXPERIMENT RESULT

Output:

```text
WIN
LOSS
INCONCLUSIVE
PROMISING
```

---

# 37. WIN

Jika:

```text
Primary Metric ↑
+
Revenue Metric ↑
+
Evidence Sufficient
```

maka:

```text
WIN
```

---

# 38. LOSS

Jika:

```text
Primary Metric ↓
+
Revenue ↓
+
Evidence Sufficient
```

maka:

```text
LOSS
```

---

# 39. INCONCLUSIVE

Jika:

```text
Sample Insufficient
```

atau:

```text
Results Too Close
```

maka:

```text
INCONCLUSIVE
```

---

# 40. PROMISING

Jika:

```text
Primary Metric Strong
```

tetapi:

```text
Revenue Evidence
belum cukup
```

maka:

```text
PROMISING
```

---

# 41. EXPERIMENT RESULT OBJECT

```text
ExperimentResult
```

Fields:

```text
experiment_id
control_metric
variant_metric
lift
sample_size
confidence
revenue_impact
decision
learning
next_action
```

---

# 42. LIFT

Formula:

```text
Lift =
(Variant - Control)
/
Control
× 100%
```

Contoh:

```text
Control CTR:
2%

Variant CTR:
2.6%

Lift:
+30%
```

---

# 43. REVENUE IMPACT

Jangan hanya melihat CTR.

Contoh:

```text
CTR:
+30%

CVR:
-40%
```

Result:

> CTR winner ≠ Revenue winner.

---

# 44. NORTH STAR

Untuk Affiliate OS:

> **Net Revenue / 1,000 Views**

menjadi salah satu commercial north-star metrics.

Namun metric utama dapat berbeda sesuai bottleneck.

---

# 45. METRIC HIERARCHY

```text
LEVEL 1
Revenue

LEVEL 2
Commission / Profit

LEVEL 3
Orders / CVR

LEVEL 4
Clicks / CTR

LEVEL 5
Views / Engagement
```

---

# 46. DECISION PRIORITY

Jika metric atas bertentangan dengan metric bawah:

```text
Revenue
>
Conversion
>
Click
>
Engagement
>
Views
```

untuk eksperimen commercial.

---

# 47. GROWTH LEARNING

Setiap experiment menghasilkan:

```text
Learning
```

Format:

```text
WHAT HAPPENED?
WHY IT MAY HAVE HAPPENED?
WHAT DID WE LEARN?
WHAT SHOULD WE DO NEXT?
```

---

# 48. LEARNING OBJECT

```text
Learning
```

Fields:

```text
id
experiment_id
category
observation
interpretation
confidence
recommendation
created_at
```

---

# 49. LEARNING CATEGORIES

```text
AUDIENCE
PRODUCT
HOOK
ANGLE
CONTENT
FORMAT
CTA
DISTRIBUTION
TIMING
OFFER
CONVERSION
REVENUE
```

---

# 50. KNOWLEDGE LOOP

```text
Experiment
↓
Result
↓
Learning
↓
Knowledge
↓
Recommendation
↓
New Experiment
```

---

# 51. WINNER REPLICATION

Jika experiment menang:

```text
WIN
↓
REPICATE
↓
GENERALIZE
↓
SCALE
```

Jangan langsung:

> duplicate 100%.

---

# 52. REPLICATION TEST

Winner:

```text
Hook B
```

Test kembali:

```text
Product A
Product B
Product C
```

Jika tetap menang:

> evidence semakin kuat bahwa pattern tersebut reusable.

---

# 53. PATTERN EXTRACTION

Engine mencari:

```text
Winning Pattern
```

Contoh:

```text
Problem-first hook
+
Product demonstration
+
Short video
```

menghasilkan:

```text
High CTR
+
High CVR
```

---

# 54. PATTERN LIBRARY

Affiliate OS membangun:

```text
Winning Pattern Library
```

Contoh:

```text
PATTERN-001
Problem → Demo → CTA

PATTERN-002
Comparison → Proof → CTA

PATTERN-003
Before/After → Product → CTA
```

---

# 55. PATTERN CONFIDENCE

Pattern memiliki:

```text
Evidence Count
Success Rate
Revenue Impact
Consistency
Confidence
```

---

# 56. PATTERN REUSE

Module 07 Content Production OS dapat mengambil:

```text
Winning Pattern
```

dan mengubahnya menjadi:

```text
New Content Brief
```

---

# 57. CLOSED LOOP WITH CONTENT OS

```text
Module 11
WINNING PATTERN
        ↓
Module 07
CONTENT GENERATION
        ↓
Module 08
DISTRIBUTION
        ↓
Module 09
PERFORMANCE
        ↓
Module 10
REVENUE
        ↓
Module 11
NEW EXPERIMENT
```

---

# 58. GROWTH FLYWHEEL

```text
MORE TESTS
     ↓
MORE DATA
     ↓
BETTER LEARNING
     ↓
BETTER CONTENT
     ↓
BETTER CONVERSION
     ↓
MORE REVENUE
     ↓
MORE DATA
```

---

# 59. EXPERIMENT FATIGUE

Jangan terus-menerus menguji hal kecil.

System memantau:

```text
Experiment Frequency
Experiment Impact
Learning Yield
```

Jika learning yield rendah:

> ubah experiment strategy.

---

# 60. LEARNING YIELD

```text
Learning Yield =
Useful Learnings / Experiments
```

---

# 61. GROWTH VELOCITY

```text
Growth Velocity =
Validated Winning Experiments
/
Time
```

---

# 62. EXPERIMENT ROI

```text
Experiment ROI =
Incremental Revenue
/
Experiment Cost
```

Ini membantu memilih:

> eksperimen mana yang layak dilakukan lagi.

---

# 63. OPPORTUNITY → EXPERIMENT

Module 05 menemukan:

```text
Opportunity:
High Potential
```

Module 11 membuat:

```text
Experiment
```

untuk memvalidasinya.

---

# 64. EXAMPLE

Opportunity:

```text
Portable kitchen tools
```

Experiment:

```text
Product A
vs
Product B
```

Result:

```text
A:
Rp7K / 1K views

B:
Rp15K / 1K views
```

Learning:

> Product B memiliki commercial efficiency lebih tinggi pada audience ini.

---

# 65. OPPORTUNITY SCORE UPDATE

```text
Opportunity Score
       ↓
Experiment Evidence
       ↓
Revenue Evidence
       ↓
Updated Score
```

---

# 66. CREATOR FIT UPDATE

Jika creator berhasil berulang kali pada:

```text
Category X
```

Creator Fit Engine menerima:

```text
Commercial Evidence
```

dan meningkatkan confidence untuk:

```text
Category X
```

---

# 67. DISTRIBUTION UPDATE

Jika:

```text
Format A
```

lebih profitable pada:

```text
Platform X
```

Distribution OS menerima:

```text
Winning Distribution Pattern
```

---

# 68. AUTOMATED RECOMMENDATION

System dapat menghasilkan:

```text
NEXT BEST EXPERIMENT
```

Contoh:

```text
Bottleneck:
CTR

Best Evidence:
Problem-first hooks

Recommended:
Test 3 new problem-first hooks
on the current winning product.
```

---

# 69. EXPERIMENT STACK

Prioritas:

```text
P0
Fix Critical Bottleneck

P1
Test High Impact Variable

P2
Replicate Winner

P3
Explore New Opportunity

P4
Optimization Experiment
```

---

# 70. EXPERIMENT BOARD

```text
BACKLOG
↓
READY
↓
RUNNING
↓
ANALYZING
↓
WINNERS
↓
REPLICATION
```

---

# 71. DAILY GROWTH LOOP

```text
1. Check performance
2. Identify bottleneck
3. Select experiment
4. Create variant
5. Publish
6. Collect data
7. Evaluate
8. Record learning
9. Select next experiment
```

---

# 72. WEEKLY GROWTH REVIEW

System menghasilkan:

```text
WEEKLY EXPERIMENT REPORT
```

Isi:

```text
Experiments Run
Wins
Losses
Inconclusive
Top Learning
Top Winner
Top Loser
Revenue Impact
Best Pattern
Next Priority
```

---

# 73. EXAMPLE REPORT

```text
WEEKLY GROWTH REPORT

Experiments:
12

Wins:
4

Losses:
5

Inconclusive:
3

Best Experiment:
Problem-first Hook

CTR:
+31%

Revenue / 1K Views:
+24%

Best Product:
Product A

Best Pattern:
Problem → Demo → CTA

NEXT:
Replicate pattern across 3 related products.
```

---

# 74. GROWTH MEMORY

Affiliate OS tidak boleh melupakan experiment lama.

System menyimpan:

```text
Experiment History
Learning History
Winning Patterns
Failed Patterns
Product Learnings
Audience Learnings
Creator Learnings
Distribution Learnings
```

---

# 75. FAILED EXPERIMENT LIBRARY

Kegagalan juga disimpan.

Contoh:

```text
FAILED PATTERN

Long generic introduction
+
Low product relevance
+
Weak CTA

Result:
Low CTR
Low Revenue
```

Tujuannya:

> jangan mengulang kesalahan yang sama.

---

# 76. KNOWLEDGE GRAPH

Future architecture:

```text
CREATOR
 ↕
CONTENT
 ↕
HOOK
 ↕
PRODUCT
 ↕
AUDIENCE
 ↕
CHANNEL
 ↕
REVENUE
```

Experiment menjadi evidence di antara node-node tersebut.

---

# 77. AI ROLE

AI boleh membantu:

```text
Generate Hypothesis
Generate Variants
Analyze Results
Find Patterns
Summarize Learning
Recommend Next Experiment
```

Tetapi AI **tidak boleh mengarang data**.

---

# 78. AI DECISION RULE

AI harus memisahkan:

```text
OBSERVED DATA
vs
INTERPRETATION
vs
HYPOTHESIS
```

Contoh:

```text
OBSERVED:
CTR turun 24%.

INTERPRETATION:
Hook kemungkinan kurang menarik.

HYPOTHESIS:
Problem-first hook dapat meningkatkan CTR.
```

---

# 79. CONFIDENCE LANGUAGE

System menggunakan:

```text
HIGH CONFIDENCE
MEDIUM CONFIDENCE
LOW CONFIDENCE
```

bukan:

> “Pasti berhasil.”

---

# 80. NO GUARANTEED REVENUE

Affiliate OS tidak boleh mengatakan:

> “Eksperimen ini pasti menghasilkan RpX.”

Yang benar:

> “Eksperimen ini memiliki expected upside berdasarkan historical evidence.”

---

# 81. MVP

### BUILD NOW

```text
✓ Experiment object
✓ Experiment backlog
✓ Hypothesis generator
✓ Variable selection
✓ Control / variant
✓ Primary metric
✓ Secondary metrics
✓ Experiment status
✓ Result recording
✓ Lift calculation
✓ Basic confidence
✓ Win/loss/inconclusive
✓ Learning capture
✓ Winner replication
✓ Pattern library
✓ Next experiment recommendation
✓ Weekly growth report
```

---

# 82. NOT MVP

```text
✗ Full autonomous experimentation
✗ Automatic publishing
✗ Automatic budget allocation
✗ Advanced Bayesian engine
✗ Fully autonomous AI agent
✗ Automatic financial decisions
```

---

# 83. FUTURE

```text
Adaptive Experimentation
Multi-Armed Bandit
Bayesian Optimization
Sequential Testing
Automated Variant Generation
Automated Experiment Scheduling
Predictive Winner Detection
Cross-Platform Experimentation
Autonomous Growth Agent
```

---

# 84. CORE DATA MODEL

```text
Experiment
ExperimentVariant
ExperimentMetric
ExperimentResult
ExperimentLearning
ExperimentDecision
WinningPattern
FailedPattern
ExperimentQueue
GrowthSnapshot
```

---

# 85. ENGINE ARCHITECTURE

```text
             PERFORMANCE
                  ↓
             BOTTLENECK
                  ↓
            HYPOTHESIS
                  ↓
          EXPERIMENT ENGINE
                  ↓
             VARIANTS
                  ↓
             DISTRIBUTION
                  ↓
             MEASUREMENT
                  ↓
              ANALYSIS
                  ↓
              LEARNING
                  ↓
              DECISION
                  ↓
          PATTERN LIBRARY
                  ↓
          NEXT EXPERIMENT
```

---

# 86. FULL AFFILIATE OS LOOP

```text
01 VISION
 ↓
02 MVP
 ↓
03 MARKET
 ↓
04 DEMAND
 ↓
05 OPPORTUNITY
 ↓
06 CREATOR FIT
 ↓
07 CONTENT
 ↓
08 DISTRIBUTION
 ↓
09 PERFORMANCE
 ↓
10 REVENUE
 ↓
11 EXPERIMENTATION
 ↓
LEARNING
 ↓
BACK TO 04
```

---

# 87. THE REAL MOAT

Moat Affiliate OS bukan:

```text
Dashboard
```

atau:

```text
AI Content Generator
```

Tetapi:

> **Accumulated proprietary learning from experiments, conversion, revenue, products, creators, content, and distribution.**

Semakin lama sistem digunakan:

```text
MORE EXPERIMENTS
↓
MORE EVIDENCE
↓
BETTER PATTERNS
↓
BETTER RECOMMENDATIONS
↓
BETTER RESULTS
```

---

# 88. FINAL DEFINITION

> **Affiliate Experimentation & Growth Loop Engine adalah mesin yang mengubah performance dan revenue data menjadi eksperimen terprioritas, mengukur hasilnya, menyimpan learning, menemukan winning patterns, dan secara terus-menerus menghasilkan next-best experiment untuk meningkatkan conversion dan revenue Affiliate OS.**

---

# 89. SCOPE LOCK

**11 — AFFILIATE EXPERIMENTATION & GROWTH LOOP ENGINE v1.0 — APPROVED**

Core loop:

```text
MEASURE
→
DIAGNOSE
→
HYPOTHESIZE
→
EXPERIMENT
→
MEASURE
→
LEARN
→
REPLICATE
→
SCALE
→
REPEAT
```

**Next module:**

# `12 — AFFILIATE INTELLIGENCE & RECOMMENDATION ENGINE v1.0`