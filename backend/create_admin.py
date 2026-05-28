"""Create admin user with proper bcrypt hash."""
import sqlite3
import uuid
from passlib.context import CryptContext

DB_PATH = r"C:\Users\rtgtx\Desktop\mulandance\backend\dance_org.db"

def main():
    ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Delete existing admin with this email
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM users WHERE email = ?", ("admin@mulandance.com",))
    conn.commit()
    
    # Generate proper bcrypt hash
    password = "admin123"
    hashed = ctx.hash(password)
    print(f"Generated hash: {hashed}")
    
    # Create admin user
    user_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO users (id, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)",
        (user_id, "admin@mulandance.com", hashed, "admin", 1)
    )
    conn.commit()
    
    # Verify password works
    verify_result = ctx.verify(password, hashed)
    print(f"Password verification: {verify_result}")
    print(f"Admin user created: admin@mulandance.com / admin123")
    print(f"User ID: {user_id}")
    
    conn.close()

if __name__ == "__main__":
    main()