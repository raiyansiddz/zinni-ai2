#!/usr/bin/env python3

import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.seeder import seed_database

if __name__ == "__main__":
    print("🌱 Starting database seeding...")
    asyncio.run(seed_database())
    print("✅ Database seeding completed!")