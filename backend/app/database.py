from pymongo import MongoClient
import mongomock
from datetime import datetime, timezone
import uuid
from app.config import settings
from app.utils.logger import logger
from app.utils.security import hash_password

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_mock = False
        self._initialize_connection()
        self.seed_demo_data()

    def _initialize_connection(self):
        try:
            # Try connecting to real MongoDB with a fast 1.5s timeout
            real_client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=1500)
            real_client.admin.command('ping')
            self.client = real_client
            self.db = self.client[settings.mongodb_db_name]
            self.is_mock = False
            logger.info(f"Connected successfully to real MongoDB at {settings.mongodb_uri} (db: {settings.mongodb_db_name})")
        except Exception as ex:
            logger.warning(f"MongoDB not available ({ex}). Falling back seamlessly to robust in-memory MongoMock.")
            self.client = mongomock.MongoClient()
            self.db = self.client[settings.mongodb_db_name]
            self.is_mock = True

    def get_collection(self, collection_name: str):
        return self.db[collection_name]

    def seed_demo_data(self):
        try:
            users_col = self.get_collection("users")
            demo_email = "lead.auditor@greenscale.io"
            existing = users_col.find_one({"email": demo_email})
            if not existing:
                now = datetime.now(timezone.utc)
                company_id = "comp_greenscale_demo"
                user_id = "usr_greenscale_auditor"

                # 1. Company
                companies_col = self.get_collection("companies")
                companies_col.update_one(
                    {"company_id": company_id},
                    {"$set": {
                        "company_id": company_id,
                        "company_name": "GreenScale Technologies Corp",
                        "industry": "CleanTech & Advanced Manufacturing",
                        "country": "United States",
                        "reporting_year": 2024,
                        "created_at": now
                    }},
                    upsert=True
                )

                # 2. Demo User
                users_col.insert_one({
                    "user_id": user_id,
                    "name": "Jane Sustainability Officer",
                    "email": demo_email,
                    "password_hash": hash_password("SecurePassword123!"),
                    "role": "admin",
                    "company_id": company_id,
                    "created_at": now
                })

                # 3. Sample initial uploads metadata only when user_test_data is absent
                import os
                user_test_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "user_test_data"))
                datasets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "datasets"))
                if not os.path.exists(user_test_dir):
                    uploads_col = self.get_collection("uploads")
                    env_sample = os.path.join(datasets_dir, "environmental_data.xlsx")
                    hr_sample = os.path.join(datasets_dir, "employee_data.xlsx")
                    uploads_col.insert_one({
                        "upload_id": "upl_demo_env_2024",
                        "company_id": company_id,
                        "filename": "facilities_energy_water_fy2024.xlsx",
                        "stored_filename": "upl_demo_env_2024_facilities.xlsx",
                        "file_path": env_sample if os.path.exists(env_sample) else None,
                        "department": "Environmental",
                        "reporting_year": 2024,
                        "status": "cleaned",
                        "total_rows": 36,
                        "total_columns": 6,
                        "data_quality_score": 98.5,
                        "uploaded_at": now
                    })

                    uploads_col.insert_one({
                        "upload_id": "upl_demo_hr_2024",
                        "company_id": company_id,
                        "filename": "workforce_headcount_fy2024.xlsx",
                        "stored_filename": "upl_demo_hr_2024_workforce.xlsx",
                        "file_path": hr_sample if os.path.exists(hr_sample) else None,
                        "department": "Human Resources",
                        "reporting_year": 2024,
                        "status": "cleaned",
                        "total_rows": 208,
                        "total_columns": 7,
                        "data_quality_score": 99.2,
                        "uploaded_at": now
                    })

                logger.info(f"Default demo account seeded: {demo_email} (Company: GreenScale Technologies Corp)")

            # Seed user test datasets if available
            self.seed_user_test_datasets("comp_greenscale_demo")
        except Exception as e:
            logger.error(f"Error seeding demo data: {e}")

    def seed_user_test_datasets(self, company_id: str):
        try:
            import os
            import pandas as pd
            import numpy as np

            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "user_test_data"))
            if not os.path.exists(base_dir):
                return

            uploads_col = self.get_collection("uploads")
            records_col = self.get_collection("esg_records")
            now = datetime.now(timezone.utc)

            file_configs = [
                {"file": "environmental_data.xlsx", "department": "Environmental", "year": 2024, "uid": "upl_user_env_2024"},
                {"file": "employee_data.xlsx", "department": "Human Resources", "year": 2026, "uid": "upl_user_hr_2026"},
                {"file": "safety_data.xlsx", "department": "Operations", "year": 2024, "uid": "upl_user_ops_2024"},
                {"file": "governance_data.xlsx", "department": "Governance", "year": 2024, "uid": "upl_user_gov_2024"},
            ]

            def _clean_val(val):
                if val is None:
                    return None
                try:
                    if pd.isna(val):
                        return None
                except Exception:
                    pass
                if isinstance(val, (pd.Timestamp, datetime)):
                    return val.isoformat()
                if isinstance(val, (np.integer, np.floating, np.bool_)):
                    return val.item()
                return val

            for cfg in file_configs:
                fpath = os.path.join(base_dir, cfg["file"])
                if not os.path.exists(fpath):
                    continue

                # Read & Clean
                df = pd.read_excel(fpath, engine="openpyxl")
                df = df.drop_duplicates()
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                for c in numeric_cols:
                    df[c] = df[c].apply(lambda v: abs(v) if pd.notnull(v) and v < 0 else v)
                    median_val = df[c].median()
                    fill_val = 0.0 if pd.isna(median_val) else median_val
                    df[c] = df[c].fillna(fill_val)

                # Compute real completeness
                total_cells = df.size if df.size > 0 else 1
                missing_cells = int(df.isna().sum().sum())
                completeness_pct = round((1.0 - (missing_cells / total_cells)) * 100.0, 1)

                # Clear old seeded records for this upload
                records_col.delete_many({"source_upload_id": cfg["uid"]})

                # Insert records
                records = []
                for idx, row in df.iterrows():
                    row_year = cfg["year"]
                    if "reporting_year" in row and pd.notnull(row["reporting_year"]):
                        try:
                            row_year = int(row["reporting_year"])
                        except Exception:
                            row_year = cfg["year"]
                    elif "date" in row and pd.notnull(row["date"]):
                        try:
                            pdt = pd.to_datetime(row["date"])
                            if pd.notnull(pdt):
                                row_year = int(pdt.year)
                        except Exception:
                            row_year = cfg["year"]

                    rec = {
                        "record_id": f"rec_{uuid.uuid4().hex[:12]}",
                        "company_id": company_id,
                        "department": cfg["department"],
                        "reporting_year": row_year,
                        "source_upload_id": cfg["uid"],
                        "validation_status": "cleaned",
                        "data": {str(k): _clean_val(v) for k, v in row.items()},
                        "created_at": now
                    }
                    records.append(rec)

                ingested_years = sorted({int(r["reporting_year"]) for r in records if r.get("reporting_year")})

                # Insert upload record with valid file_path
                uploads_col.update_one(
                    {"upload_id": cfg["uid"]},
                    {"$set": {
                        "upload_id": cfg["uid"],
                        "company_id": company_id,
                        "filename": cfg["file"],
                        "stored_filename": f"seeded_{cfg['file']}",
                        "file_path": fpath,
                        "department": cfg["department"],
                        "reporting_year": cfg["year"],
                        "status": "cleaned",
                        "total_rows": int(len(df)),
                        "total_columns": int(len(df.columns)),
                        "data_quality_score": completeness_pct,
                        "ingested_years": ingested_years,
                        "uploaded_at": now
                    }},
                    upsert=True
                )

                if records:
                    records_col.insert_many(records)

            logger.info("Successfully seeded user test datasets into active database instance.")
        except Exception as e:
            logger.error(f"Error seeding user test datasets: {e}")

# Singleton instance
db_manager = DatabaseManager()

def get_database():
    return db_manager.db

# Named collection getters
def get_users_collection():
    return db_manager.get_collection("users")

def get_companies_collection():
    return db_manager.get_collection("companies")

def get_uploads_collection():
    return db_manager.get_collection("uploads")

def get_esg_records_collection():
    return db_manager.get_collection("esg_records")

def get_reports_collection():
    return db_manager.get_collection("reports")

def get_audit_logs_collection():
    return db_manager.get_collection("audit_logs")

def get_compliance_collection():
    return db_manager.get_collection("compliance_disclosures")

def get_evidence_collection():
    return db_manager.get_collection("evidence_records")
