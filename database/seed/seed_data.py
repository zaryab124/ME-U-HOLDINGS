import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, async_engine, Base
from app.core.security import get_password_hash
from app.core.roles import UserRole
from app.models.branch import Branch
from app.models.user import User
from app.models.menu import Category, Product, ProductVariant, ProductAddon
from app.models.table import Table
from app.models.deal import Deal, DealItem
from app.models.inventory import InventoryItem, Expense
from app.models.feedback import Feedback
from app.utils.qr_generator import generate_qr_token

async def seed_database():
    print("Starting Database Seeding for 6 Branches & Full System Roles...")
    
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        res = await db.execute(select(Branch))
        if res.scalars().first():
            print("Database already contains seed data. Skipping...")
            return

        # 1. Create 6 Initial Branches
        branches_data = [
            {"name": "Main Branch", "code": "BR-MAIN", "address": "100 Main Boulevard, Downtown", "city": "Metropolis", "phone": "+1-555-0101", "latitude": 40.7128, "longitude": -74.0060},
            {"name": "City Branch", "code": "BR-CITY", "address": "45 Financial Center St", "city": "Metropolis", "phone": "+1-555-0102", "latitude": 40.7306, "longitude": -73.9352},
            {"name": "Mall Branch", "code": "BR-MALL", "address": "Grand Mall Food Court, Level 3", "city": "Metropolis", "phone": "+1-555-0103", "latitude": 40.7484, "longitude": -73.9857},
            {"name": "DHA Branch", "code": "BR-DHA", "address": "Block 5 Commercial Zone", "city": "Metropolis", "phone": "+1-555-0104", "latitude": 40.7061, "longitude": -74.0092},
            {"name": "Cantt Branch", "code": "BR-CANTT", "address": "12 Military Road, Cantt", "city": "Metropolis", "phone": "+1-555-0105", "latitude": 40.7282, "longitude": -73.7949},
            {"name": "University Branch", "code": "BR-UNI", "address": "8 University Avenue, Campus Square", "city": "Metropolis", "phone": "+1-555-0106", "latitude": 40.8075, "longitude": -73.9626},
        ]

        branches = []
        for b_data in branches_data:
            b = Branch(**b_data, opening_time="08:00", closing_time="23:00", status="ACTIVE")
            db.add(b)
            branches.append(b)
        
        await db.flush()
        print(f"Created {len(branches)} branches.")

        main_branch = branches[0]
        city_branch = branches[1]

        # 2. Create Users & Staff Roles
        hashed_pass = get_password_hash("password123")

        users_data = [
            # Owner & Admin
            User(email="owner@restaurant.com", username="owner", hashed_password=hashed_pass, full_name="Victoria Vance (Owner)", role=UserRole.OWNER.value, branch_id=None),
            User(email="admin@restaurant.com", username="admin", hashed_password=hashed_pass, full_name="Alexander Hamilton (Admin)", role=UserRole.ADMIN.value, branch_id=None),
            
            # Branch Managers
            User(email="manager.main@restaurant.com", username="mgr_main", hashed_password=hashed_pass, full_name="John Miller (Main Mgr)", role=UserRole.BRANCH_MANAGER.value, branch_id=main_branch.id),
            User(email="manager.city@restaurant.com", username="mgr_city", hashed_password=hashed_pass, full_name="Sarah Connor (City Mgr)", role=UserRole.BRANCH_MANAGER.value, branch_id=city_branch.id),

            # Kitchen Staff
            User(email="chef.main@restaurant.com", username="chef_main", hashed_password=hashed_pass, full_name="Gordon Ramsay (Head Chef)", role=UserRole.KITCHEN_MANAGER.value, branch_id=main_branch.id),
            User(email="cook.main@restaurant.com", username="cook_main", hashed_password=hashed_pass, full_name="Marco Pierre (Line Cook)", role=UserRole.KITCHEN_STAFF.value, branch_id=main_branch.id),

            # Cashier
            User(email="cashier.main@restaurant.com", username="cashier_main", hashed_password=hashed_pass, full_name="Emily Clarke (Cashier)", role=UserRole.CASHIER.value, branch_id=main_branch.id),

            # Riders
            User(email="rider1@restaurant.com", username="rider1", hashed_password=hashed_pass, full_name="Speedy Gonzales (Rider)", role=UserRole.RIDER.value, branch_id=main_branch.id, phone="+1-555-9999"),
            User(email="rider2@restaurant.com", username="rider2", hashed_password=hashed_pass, full_name="Jack Flash (Rider)", role=UserRole.RIDER.value, branch_id=city_branch.id, phone="+1-555-8888"),

            # Sample Customer
            User(email="customer@gmail.com", username="customer", hashed_password=hashed_pass, full_name="David Beckham (Customer)", role=UserRole.CUSTOMER.value, branch_id=None, phone="+1-555-7777")
        ]

        for u in users_data:
            db.add(u)
        await db.flush()
        print(f"Created {len(users_data)} users across all roles.")

        # 3. Create Categories
        categories_data = [
            {"name": "Gourmet Burgers", "slug": "gourmet-burgers", "description": "100% Prime Angus Beef and Crispy Chicken Burgers", "display_order": 1},
            {"name": "Artisanal Pizzas", "slug": "artisanal-pizzas", "description": "Wood-fired hand-tossed Neapolitan style pizzas", "display_order": 2},
            {"name": "Crispy Starters", "slug": "crispy-starters", "description": "Delicious fries, wings, and mozzarella sticks", "display_order": 3},
            {"name": "Refreshing Drinks", "slug": "refreshing-drinks", "description": "Craft sodas, fresh juices, and milkshakes", "display_order": 4},
            {"name": "Decadent Desserts", "slug": "decadent-desserts", "description": "Molten lava cakes, churros, and gourmet sundaes", "display_order": 5},
        ]

        categories = []
        for c_data in categories_data:
            cat = Category(**c_data)
            db.add(cat)
            categories.append(cat)
        await db.flush()
        print(f"Created {len(categories)} categories.")

        # 4. Create Food Products (Global & Branch Specific)
        burgers_cat = categories[0]
        pizzas_cat = categories[1]
        starters_cat = categories[2]
        drinks_cat = categories[3]

        products_data = [
            {
                "category_id": burgers_cat.id, "branch_id": None, "name": "Signature Double Cheeseburger",
                "description": "Double Angus beef patties, double cheddar cheese, caramelized onions, secret sauce.",
                "price": 12.99, "cost_price": 4.50, "preparation_time": 15, "featured": True,
                "variants": [
                    {"name": "Single Patty", "price": 9.99, "cost_price": 3.20},
                    {"name": "Double Patty", "price": 12.99, "cost_price": 4.50},
                    {"name": "Triple Monster", "price": 15.99, "cost_price": 5.80}
                ],
                "addons": [
                    {"name": "Extra Bacon", "price": 2.00, "cost_price": 0.50},
                    {"name": "Jalapenos", "price": 1.00, "cost_price": 0.20}
                ]
            },
            {
                "category_id": burgers_cat.id, "branch_id": None, "name": "Spicy Zinger Chicken Crunch",
                "description": "Crispy fried spicy chicken breast, lettuce, creamy mayo, dill pickles.",
                "price": 10.99, "cost_price": 3.80, "preparation_time": 12, "featured": True,
                "variants": [
                    {"name": "Regular", "price": 10.99, "cost_price": 3.80},
                    {"name": "XXL Crispy", "price": 13.99, "cost_price": 4.90}
                ],
                "addons": [
                    {"name": "Extra Cheese Slice", "price": 1.50, "cost_price": 0.30}
                ]
            },
            {
                "category_id": pizzas_cat.id, "branch_id": None, "name": "Classic Margherita Neapolitan",
                "description": "San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, extra virgin olive oil.",
                "price": 14.99, "cost_price": 3.90, "preparation_time": 18, "featured": True,
                "variants": [
                    {"name": "Medium (10 inch)", "price": 14.99, "cost_price": 3.90},
                    {"name": "Large (14 inch)", "price": 18.99, "cost_price": 5.20}
                ],
                "addons": [
                    {"name": "Stuffed Crust", "price": 3.00, "cost_price": 0.80}
                ]
            },
            {
                "category_id": starters_cat.id, "branch_id": None, "name": "Loaded Truffle Parmesan Fries",
                "description": "Crispy golden skin-on fries tossed in white truffle oil, grated parmesan, and chives.",
                "price": 6.99, "cost_price": 1.80, "preparation_time": 8, "featured": False,
                "variants": [],
                "addons": []
            },
            {
                "category_id": drinks_cat.id, "branch_id": None, "name": "Belgian Chocolate Milkshake",
                "description": "Rich Belgian chocolate gelato blended with fresh cream and topped with whipped cream.",
                "price": 5.49, "cost_price": 1.20, "preparation_time": 5, "featured": False,
                "variants": [],
                "addons": []
            }
        ]

        for p_data in products_data:
            variants = p_data.pop("variants")
            addons = p_data.pop("addons")
            prod = Product(**p_data)
            db.add(prod)
            await db.flush()

            for v in variants:
                db.add(ProductVariant(product_id=prod.id, **v))
            for a in addons:
                db.add(ProductAddon(product_id=prod.id, **a))

        await db.flush()
        print("Created Food products, variants, and addons.")

        # 5. Create Dine-in Tables with QR code tokens for each branch
        for b in branches:
            for num in range(1, 9):
                qr_tok = generate_qr_token(b.id, str(num))
                tbl = Table(
                    branch_id=b.id,
                    table_number=f"T-{num:02d}",
                    seats=4 if num % 2 == 0 else 2,
                    status="AVAILABLE",
                    qr_code_token=qr_tok
                )
                db.add(tbl)
        
        await db.flush()
        print("Created 48 Dine-in tables with cryptographically verified QR tokens.")

        # 6. Create Deals
        deals_data = [
            {
                "branch_id": None, "name": "Family Feast Combo",
                "description": "2 Double Cheeseburgers + 1 Large Margherita Pizza + 2 Truffle Fries + 2 Milkshakes",
                "discount_type": "COMBO", "discount_value": 20.0, "minimum_order": 30.0, "active": True
            },
            {
                "branch_id": None, "name": "10% Super Saver",
                "description": "Get 10% off on all orders above $25",
                "discount_type": "PERCENTAGE", "discount_value": 10.0, "minimum_order": 25.0, "active": True
            }
        ]
        for d in deals_data:
            db.add(Deal(**d))

        # 7. Create Inventory Items for Branch 1
        inv_items = [
            {"branch_id": main_branch.id, "ingredient": "Angus Beef Patties", "quantity": 150.0, "unit": "pcs", "minimum_stock": 30.0, "cost_per_unit": 2.10},
            {"branch_id": main_branch.id, "ingredient": "Burger Buns", "quantity": 200.0, "unit": "pcs", "minimum_stock": 40.0, "cost_per_unit": 0.40},
            {"branch_id": main_branch.id, "ingredient": "Cheddar Cheese Slices", "quantity": 300.0, "unit": "pcs", "minimum_stock": 50.0, "cost_per_unit": 0.25},
            {"branch_id": main_branch.id, "ingredient": "French Fries (Frozen)", "quantity": 80.0, "unit": "kg", "minimum_stock": 15.0, "cost_per_unit": 1.50},
        ]
        for inv in inv_items:
            db.add(InventoryItem(**inv))

        # 8. Create Expenses for Branch 1
        expenses = [
            Expense(branch_id=main_branch.id, category="Utilities", amount=450.0, description="Monthly Electricity & Gas", date=main_branch.created_at),
            Expense(branch_id=main_branch.id, category="Rent", amount=2500.0, description="Branch Storefront Rent", date=main_branch.created_at),
        ]
        for exp in expenses:
            db.add(exp)

        await db.commit()
        print("Successfully completed database seeding!")

if __name__ == "__main__":
    asyncio.run(seed_database())
