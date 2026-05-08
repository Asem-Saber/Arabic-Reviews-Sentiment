import psycopg2
from psycopg2 import OperationalError
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_sentiment_database():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="postgres",          
            user="postgres",
            password="Asemesm##A0321##esm",
            port="5432"
        )
        
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        cursor.execute("CREATE DATABASE arabic_sentiment;")
        
        print("✅ Database 'arabic_sentiment' created successfully!")
        
    except OperationalError as e:
        print(f"❌ Connection error: '{e}'")
    except psycopg2.errors.DuplicateDatabase:
        print("⚠️ Database 'arabic_sentiment' already exists! You are good to go.")
        
    finally:
        if 'conn' in locals() and conn is not None:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    create_sentiment_database()