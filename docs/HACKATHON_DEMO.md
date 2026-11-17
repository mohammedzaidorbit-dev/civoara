# CIVOARA — Hackathon Demonstration Guide (3-Minute Walkthrough)

This guide provides a rapid, high-impact demonstration script for hackathon judges and evaluators showcasing CIVOARA's core innovations: **Geospatial Ward Routing**, **Multi-Citizen Duplicate Clustering**, **Idempotent SLA Escalation**, and **Fair Organizational Restructuring**.

---

## 🎯 The Core Problem Solved
Traditional civic complaint portals suffer from three fatal flaws:
1. **Duplicate ticket storms**: 20 citizens report the same pothole, creating 20 disconnected tickets that overwhelm dispatchers.
2. **Accountability black holes**: When city boundaries or departments reorganize, open tickets lose their SLA timers or blame gets erased.
3. **Citizen distrust**: Lack of transparency breeds cynicism.

---

## ⏱️ 3-Minute Live Demonstration Flow

### Minute 1: Citizen Complaint Intake & Automatic Ward Identification
1. **Navigate to**: `http://localhost:3000/report`
2. **Action**:
   - Select Category: **Pothole**.
   - Issue Title: `"Severe road crater damaging car suspensions on 5th Ave"`.
   - Click the interactive Leaflet map to drop a pin near **Central Downtown (Ward 01)** (e.g., Lat: `40.7128`, Lng: `-74.0060`).
   - Notice the automatic reverse-geocoded address and PostGIS polygon ward determination.
   - Click **Submit Incident Report**.
3. **Result**:
   - Ticket reference generated: `CIV-2026-XXXX`.
   - PostGIS identifies Ward 01 &rarr; Routing engine assigns **Roads & Highways Department** &rarr; SLA clock starts at **24 hours**.

---

### Minute 2: Duplicate Clustering & Anti-Sybil Dynamic Priority
1. **Action**:
   - Open an incognito window or second browser tab.
   - Navigate to `/report` as a second citizen.
   - Report the same problem 10 meters away: Lat: `40.71282`, Lng: `-74.00602`.
   - Title: `"Hazardous deep crater pothole near 5th Ave and Pine"`.
   - Submit the complaint.
2. **Result (The "Magic" Moment)**:
   - CIVOARA runs spatial Haversine distance (`< 50m`), Dice-Sørensen text tokenization, and temporal proximity checks.
   - Confidence score evaluates to **> 90%** (above the 85% auto-merge threshold).
   - Rather than creating a redundant ticket, CIVOARA links the report to the canonical ticket, increments report count to **2**, and elevates priority from `medium` &rarr; `high`!
   - *Judge Callout*: If one user spams 10 reports, our anti-Sybil weighting algorithm prevents artificial priority manipulation!

---

### Minute 3: Fair SLA Restructuring & Public Transparency
1. **Navigate to**: `http://localhost:3000/admin/reorganization`
2. **Action**:
   - Walk the judges through an administrative ward transfer:
   - Source Department: **Roads & Highways**.
   - Target Department: **Water & Sewerage Board / Public Works**.
   - Migration Policy: **Fair Pro-Rata**.
   - Click **Preview Impact**: Show judges the non-destructive multi-segment preview.
   - Click **Execute Restructuring Transaction**.
3. **The Innovation**:
   - Show how the previous department's elapsed time remains locked (no blame erasure).
   - Show how the new department starts at 0.00h elapsed with an emergency grace buffer.
   - Total complaint age is preserved from day one.
4. **Navigate to**: `http://localhost:3000/public/performance`
   - Show live departmental rankings, SLA compliance percentages, and explainable composite scoring.
   - Demonstrate that citizen personal data (email, phone, address) is **100% redacted** from all public timelines.

---

## 🔑 Demo Account Personas

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@example.com` | `Password123!` | `/citizen/dashboard` |
| **Field Officer** | `officer@example.com` | `Password123!` | `/officer/dashboard` |
| **Supervisor** | `supervisor@example.com` | `Password123!` | `/officer/escalations` |
| **Administrator** | `admin@civoara.gov` | `AdminSecure2026!` | `/admin/reorganization` |
| **Public Observer** | Anonymous | N/A | `/public/performance` |
