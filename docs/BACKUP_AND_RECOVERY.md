# CIVOARA — Backup and Disaster Recovery Procedures

This document outlines the backup policy, point-in-time recovery (PITR) strategy, and disaster recovery procedures for CIVOARA.

---

## 1. Data Classification and Recovery Objectives

| Data Type | Primary Storage | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) |
| :--- | :--- | :--- | :--- |
| **Audit Logs & Issue Events** | PostgreSQL (`issue_events`, `issues`) | < 5 minutes | < 30 minutes |
| **Ownership Segments & SLA History** | PostgreSQL (`ownership_segments`) | < 5 minutes | < 30 minutes |
| **Geospatial Boundaries & Wards** | PostgreSQL PostGIS (`wards`) | < 24 hours | < 1 hour |
| **Citizen Uploaded Evidence** | Supabase Storage (`incident-media`) | < 1 hour | < 2 hours |

---

## 2. Automated Backups

### 2.1 Continuous Write-Ahead Log (WAL) Archiving
In production, Supabase Point-In-Time Recovery (PITR) continuously archives PostgreSQL Write-Ahead Logs to secure cloud storage (AWS S3 / Google Cloud Storage with multi-region replication). This allows restoring the database state to any specific second within the last 7 to 30 days.

### 2.2 Nightly Logical Backups (pg_dump)
A scheduled GitHub Actions workflow or cron runner executes a nightly logical dump of all CIVOARA tables:

```bash
#!/usr/bin/env bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="civoara_backup_${TIMESTAMP}.dump"

# Dump schema and data excluding transient auth sessions
pg_dump \
  --format=custom \
  --blobs \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="${DATABASE_URL}" \
  --file="${BACKUP_FILE}"

# Encrypt backup with GPG
gpg --symmetric --cipher-algo AES256 "${BACKUP_FILE}"

# Ship to cold storage bucket
aws s3 cp "${BACKUP_FILE}.gpg" "s3://civoara-backups-cold/${BACKUP_FILE}.gpg"
```

---

## 3. Disaster Recovery Procedures

### Scenario A: Accidental Administrative Restructuring Error
If an administrator incorrectly merges departments or transfers ward responsibility:
1. Every restructuring action creates an immutable `organization_versions` and `organization_change_events` entry.
2. The `ownership_segments` table is strictly append-only; historical segments are marked `closed` with locked elapsed times.
3. **Recovery Action**: Execute a compensatory restructuring action using the `ReorganizationService` targeting the previous version parameters. No database restore is needed because historical data is never mutated.

### Scenario B: Database Corruption or Infrastructure Failure
1. **Initiate PITR Restore**:
   - Access Supabase Management Console > **Database > Backups > Point in Time**.
   - Select the timestamp immediately prior to the incident (e.g., `2026-11-18 01:00:00 UTC`).
   - Trigger the automated restore to a new database instance.
2. **Update DNS / Vercel Environment**:
   - Point `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the restored instance.
   - Trigger redeployment on Vercel.
3. **Verify Integrity**:
   - Run the automated test suites:
     ```bash
     npx tsx scripts/test-e2e-complete-workflow.ts
     npx tsx scripts/test-security-suite.ts
     ```

### Scenario C: Storage Bucket Deletion or Loss
1. Daily object storage replication mirrors `incident-media` to an immutable backup bucket.
2. Restore command:
   ```bash
   aws s3 sync s3://civoara-media-backup/ s3://civoara-media-primary/
   ```

---

## 4. Disaster Recovery Testing Cadence

- **Quarterly Table Restore Drill**: Full restore of nightly pg_dump onto an isolated staging server.
- **Bi-annual Failover Drill**: Switching Vercel connection pool from primary to standby database.
- **Monthly Audit Verification**: Verify that `issue_events` and `ownership_segments` cryptographic checksums match expected records.
