---
name: clickhouse-io
description: Design or review ClickHouse schemas and queries for analytical workloads where ordering keys, partitions, cardinality, or ingestion performance matter.
---

# ClickHouse guidance

- Choose `ORDER BY` for dominant filters and data skipping; do not mirror an OLTP primary key by habit.
- Use partitions for lifecycle operations and coarse pruning, not high-cardinality dimensions.
- Select MergeTree variants and deduplication semantics explicitly.
- Bound scans, inspect query plans and system tables, and validate representative data volume.
- Treat mutations, distributed tables, materialized views, and retention policies as operational decisions with rollback plans.
- Verify behavior against the deployed ClickHouse version and official documentation.
