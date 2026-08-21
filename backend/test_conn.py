from database import engine

try:
    with engine.connect() as connection:
        print("✅ KONEKSI KE DATABASE BERHASIL!")
except Exception as e:
    print("❌ CAUSA ERROR SEBENARNYA:\n", e)