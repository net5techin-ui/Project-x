import json
import requests
from supabase import create_client, Client

# 🔑 CONFIG: Add your Supabase Keys here
SUPABASE_URL = "https://orzhjgrjpxrlikswwenc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE"

# 🛒 DATASET: The location of your products.json
DATA_SOURCE = "products.json"

def sync_data():
    try:
        # 1. Initialize Supabase Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("🔗 Connected to Supabase Cloud...")

        # 2. Fetch the Dataset (from GitHub or local file)
        # Using local products.json first for testing
        with open(DATA_SOURCE, 'r') as f:
            dataset = json.load(f)
        
        products = dataset.get('products', [])
        print(f"📦 Found {len(products)} products to assign...")

        # 3. Clean up existing IDs to avoid conflicts
        for p in products:
            if 'id' in p: del p['id']
            
        # 4. Bulk Insert/Assign to Supabase
        print("🔥 Starting Cloud Assignment...")
        data, count = supabase.table('products').insert(products).execute()
        
        print(f"✅ Success! {len(products)} products assigned to your Admin & Main panels.")
        print(f"📬 Target Email: sngagan54@gmail.com is now receiving orders for these items.")

    except Exception as e:
        print(f"❌ Error during sync: {e}")

if __name__ == "__main__":
    sync_data()
