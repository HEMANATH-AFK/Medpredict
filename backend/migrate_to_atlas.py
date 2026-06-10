"""
MedPredict AI -- MongoDB Atlas Migration Script
Uses certifi CA bundle to fix Python 3.14 / Windows TLS issue
"""

import sys
import certifi
from pymongo import MongoClient

LOCAL_URI   = "mongodb://localhost:27017"
ATLAS_URI   = "mongodb+srv://afk:dafk@clusterd.7dfdhx3.mongodb.net/?appName=Clusterd"
DB_NAME     = "medpredict"
COLLECTIONS = ["users", "predictions", "audit_logs"]

def make_atlas_client():
    ca = certifi.where()
    print(f"      Using CA bundle: {ca}")

    last_error: Exception | None = None

    # Method 1: certifi CA file (primary fix for Python 3.14 Windows)
    try:
        print("      Trying method 1 (certifi CA)...")
        client = MongoClient(ATLAS_URI, serverSelectionTimeoutMS=20000, tlsCAFile=ca)
        client.admin.command("ping")
        print("      OK   Connected via method 1")
        return client
    except Exception as e:
        last_error = e
        print(f"      FAIL Method 1: {str(e).split(',')[0][:110]}")

    # Method 2: certifi CA + allow invalid hostname
    try:
        print("      Trying method 2 (certifi + allowInvalidHostname)...")
        client = MongoClient(ATLAS_URI, serverSelectionTimeoutMS=20000,
                             tlsCAFile=ca, tlsAllowInvalidHostnames=True)
        client.admin.command("ping")
        print("      OK   Connected via method 2")
        return client
    except Exception as e:
        last_error = e
        print(f"      FAIL Method 2: {str(e).split(',')[0][:110]}")

    # Method 3: allow invalid certs entirely (dev/migration only)
    try:
        print("      Trying method 3 (tlsAllowInvalidCertificates)...")
        client = MongoClient(ATLAS_URI, serverSelectionTimeoutMS=20000,
                             tlsAllowInvalidCertificates=True)
        client.admin.command("ping")
        print("      OK   Connected via method 3")
        return client
    except Exception as e:
        last_error = e
        print(f"      FAIL Method 3: {str(e).split(',')[0][:110]}")

    # Method 4: allow invalid certs + hostname
    try:
        print("      Trying method 4 (all TLS checks bypassed)...")
        client = MongoClient(ATLAS_URI, serverSelectionTimeoutMS=20000,
                             tlsAllowInvalidCertificates=True, tlsAllowInvalidHostnames=True)
        client.admin.command("ping")
        print("      OK   Connected via method 4")
        return client
    except Exception as e:
        last_error = e
        print(f"      FAIL Method 4: {str(e).split(',')[0][:110]}")

    if last_error is None:
        raise RuntimeError("All Atlas connection attempts failed with no captured error")
    raise last_error

def migrate():
    print("=" * 58)
    print("  MedPredict AI -- MongoDB Atlas Migration")
    print("=" * 58)

    # Connect to local
    print("\n[1/4] Connecting to local MongoDB...")
    try:
        local = MongoClient(LOCAL_URI, serverSelectionTimeoutMS=5000)
        local.admin.command("ping")
        local_db = local[DB_NAME]
        print("      OK   Local: mongodb://localhost:27017/medpredict")
    except Exception as e:
        print(f"      FAIL Cannot connect to local MongoDB: {e}")
        sys.exit(1)

    # Connect to Atlas
    print("\n[2/4] Connecting to MongoDB Atlas...")
    try:
        atlas = make_atlas_client()
        atlas_db = atlas[DB_NAME]
    except Exception as e:
        print(f"\n      FAIL All connection methods failed.")
        print(f"      Last error: {str(e)[:300]}")
        print("\n  ACTION REQUIRED:")
        print("  1. Log in to MongoDB Atlas (cloud.mongodb.com)")
        print("  2. Go to: Security -> Network Access")
        print("  3. Click 'Add IP Address' -> 'Allow Access From Anywhere' (0.0.0.0/0)")
        print("  4. Go to: Security -> Database Access")
        print("     -> Verify user 'afk' exists with readWriteAnyDatabase role")
        print("  5. Re-run this script after saving changes")
        sys.exit(1)

    # Migrate collections
    print("\n[3/4] Migrating collections...\n")
    for col_name in COLLECTIONS:
        local_col = local_db[col_name]
        atlas_col = atlas_db[col_name]

        docs = list(local_col.find({}))
        count = len(docs)

        if count == 0:
            print(f"      SKIP {col_name:<20} -- 0 docs")
            continue

        inserted = 0
        skipped  = 0
        for doc in docs:
            try:
                atlas_col.replace_one({"_id": doc["_id"]}, doc, upsert=True)
                inserted += 1
            except Exception as ex:
                print(f"           WARN Skipped doc {doc['_id']}: {ex}")
                skipped += 1

        print(f"      DONE {col_name:<20} -- {inserted} upserted, {skipped} skipped")

    # Verify counts
    print("\n[4/4] Verification (Atlas document counts)...\n")
    all_ok = True
    for col_name in COLLECTIONS:
        local_n  = local_db[col_name].count_documents({})
        atlas_n  = atlas_db[col_name].count_documents({})
        match    = "MATCH" if atlas_n >= local_n else "DIFF "
        if atlas_n < local_n:
            all_ok = False
        print(f"      {match} {col_name:<20} local={local_n}  atlas={atlas_n}")

    local.close()
    atlas.close()

    print("\n" + "=" * 58)
    if all_ok:
        print("  DONE  Migration complete -- all data is on Atlas!")
    else:
        print("  WARN  Migration finished with discrepancies.")
    print("=" * 58 + "\n")
    return all_ok

if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
