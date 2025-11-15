# VM Resource Requirements

## Current Resource Usage

Based on actual Docker container monitoring:

- **MySQL Database**: ~350-400 MB RAM (unoptimized)
- **Spring Boot Backend**: ~850-900 MB RAM (unoptimized)
- **Caddy Web Server**: ~12 MB RAM
- **Docker Overhead**: ~100-200 MB RAM
- **Total Current Usage**: ~1.3-1.5 GB RAM

## Optimized Resource Usage (for 768MB RAM)

After aggressive optimizations (actual measurements):

- **MySQL Database**: ~200-250 MB RAM (128MB buffer pool, may use more during operations)
- **Spring Boot Backend**: ~240-260 MB RAM (256MB heap limit)
- **Caddy Web Server**: ~14 MB RAM
- **Docker Overhead**: ~50-100 MB RAM
- **Total Optimized Usage**: ~550-650 MB RAM
- **Remaining**: ~120-220 MB for OS and buffer

## VM Specifications

### Ultra-Low Resource (768MB RAM, 1 Core) ⚠️
- **RAM**: 768 MB
- **CPU**: 1 core
- **Storage**: 10 GB
- **Status**: **WORKABLE with optimizations applied**
- **Optimizations Applied**:
  - JVM heap limited to 256MB
  - MySQL buffer pool reduced to 128MB
  - Photo compression disabled on startup
  - Reduced MySQL connection pool and caches
  - Serial GC for minimal overhead

**Important Notes**:
- ⚠️ **Very tight** - uses ~550-650MB of 768MB (leaves ~120MB for OS)
- ⚠️ **Photo compression must be run manually** via `/api/compress-photos` endpoint (disabled on startup)
- ⚠️ **Monitor for OOM errors** - strongly recommend enabling swap space (512MB-1GB)
- ⚠️ **Startup may be slow** (30-60 seconds)
- ⚠️ **MySQL may use more RAM** during queries (buffer pool is 128MB but MySQL uses additional memory)
- ✅ **Should work for low-traffic scenarios** with swap enabled
- ✅ **All optimizations applied** - JVM heap 256MB, MySQL buffer pool 128MB

### Minimum (Tight but Workable)
- **RAM**: 2 GB
- **CPU**: 2 cores
- **Storage**: 10-15 GB

### Recommended (Comfortable)
- **RAM**: 4 GB
- **CPU**: 2-4 cores
- **Storage**: 20 GB

### Optimal (Production Ready)
- **RAM**: 4-8 GB
- **CPU**: 4 cores
- **Storage**: 40 GB (for logs, backups, growth)

## Database Size
- **Current**: 909 records, ~2.2 MB compressed photos
- **Estimated Growth**: ~100-200 MB per 1000 additional records

## Optimization Tips for 768MB RAM

All optimizations are already applied in the codebase:

1. ✅ **Backend JVM Settings**: `-Xmx256m -Xms128m -XX:+UseSerialGC`
2. ✅ **MySQL Settings**: Reduced buffer pool to 128MB, minimal caches
3. ✅ **Photo Compression**: Disabled on startup (run manually via API)
4. ✅ **Connection Pools**: Reduced to 20 connections max

