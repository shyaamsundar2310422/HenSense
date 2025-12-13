# create_admin.py
from db import SessionLocal, users
from passlib.context import CryptContext
from sqlalchemy import select

# Use argon2 as the primary scheme.
pwd_ctx = CryptContext(schemes=["argon2", "bcrypt"], deprecated="bcrypt")

def create_admin(username="admin", password="admin123"):
    db = SessionLocal()
    try:
        q = select(users).where(users.c.username == username)
        if db.execute(q).first():
            print("Admin already exists.")
            return

        # Hash with Argon2 (no 72-byte limit)
        hashed = pwd_ctx.hash(password)

        db.execute(
            users.insert().values(
                username=username,
                password_hash=hashed
            )
        )
        db.commit()
        print(f"Admin created: {username}")

    except Exception as e:
        print("Error creating admin:", e)

    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
