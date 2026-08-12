# Student 04. Academic-Year & Lifetime Credit Progress Tracking

Your **Student Dashboard** ([`frontend/components/student/Dashboard.jsx`](file:///d:/Edutation(P)/SIH/smart-student-hub/frontend/components/student/Dashboard.jsx)) provides a real-time progress view of your co-curricular credit standings across both your current Academic Year and your overall degree lifecycle.

---

## 📊 Current Academic Year vs. Lifetime Progress Views

```
+-----------------------------------------------------------------------------------+
| AY 2025-26 CREDIT PROGRESS                                                        |
| Annual Target: 20.0 Credits (July 1 – June 30)                                    |
| [=======================================>                 ] 14.5 / 20.0 (72.5%)   |
|                                                                                   |
| NAAC Criterion Breakdown:                                                         |
| [Criterion 1: 3.0 pts]  [Criterion 3: 4.0 pts]  [Criterion 5: 7.5 pts]            |
|                                                                                   |
| • Lifetime Record: 32.5 total credits earned across 9 verified activities.       |
+-----------------------------------------------------------------------------------+
```

---

## 🎯 Understanding Your Progress Metrics

### 1. Current Academic Year Progress Bar
- **Academic Year Calendar**: Runs from **July 1 through June 30** of the following year.
- **Annual Credit Target**: The standard institutional target benchmark is **20.0 Credits** per academic year.
- **Progress Calculation**:

$$\text{Current AY Progress (\%)} = \min\left(100, \left( \frac{\text{Approved Credits in Current AY}}{20.0} \right) \times 100 \right)$$

### 2. NAAC Criterion Breakdown Chips
Your earned credits in the current Academic Year are automatically grouped into NAAC criteria chips so you can see which areas you are excelling in:
- **Criterion 1 (Curricular Aspects)**: Online courses, value-added certifications.
- **Criterion 3 (Research & Extension)**: Publications, NSS/NCC societal service.
- **Criterion 5 (Student Progression)**: Hackathons, sports, cultural competitions, internships.

### 3. Lifetime Cumulative Totals
Alongside your current-year standing, your dashboard displays your **Lifetime Record**:
- Total approved co-curricular credits accumulated since your admission year.
- Total number of faculty-verified activity achievements on your official record.
