import { Router, type Request, type Response } from "express";
import cors from "cors";

const router = Router();

// Open CORS for this mock endpoint — practice/interview use only
router.use(cors({ origin: "*" }));

const INVENTORY = [
  {
    id: 1,
    name: "Beverages",
    items: [
      { id: 101, name: "Cola", stock: 50, price: 299 },
      { id: 102, name: "Water", stock: 3, price: 150 },
      { id: 103, name: "Orange Juice", stock: 18, price: 349 },
      { id: 104, name: "Lemonade", stock: 0, price: 279 },
    ],
    subcategories: [
      {
        id: 11,
        name: "Hot Drinks",
        items: [
          { id: 111, name: "Coffee", stock: 0, price: 399 },
          { id: 112, name: "Tea", stock: 8, price: 249 },
          { id: 113, name: "Hot Chocolate", stock: 2, price: 429 },
        ],
        subcategories: [
          {
            id: 111,
            name: "Specialty Coffee",
            items: [
              { id: 1111, name: "Flat White", stock: 15, price: 449 },
              { id: 1112, name: "Cappuccino", stock: 1, price: 429 },
              { id: 1113, name: "Americano", stock: 22, price: 349 },
            ],
            subcategories: [],
          },
        ],
      },
      {
        id: 12,
        name: "Alcoholic",
        items: [
          { id: 121, name: "House Wine", stock: 6, price: 899 },
          { id: 122, name: "Draft Beer", stock: 0, price: 699 },
          { id: 123, name: "Prosecco", stock: 4, price: 1199 },
        ],
        subcategories: [],
      },
    ],
  },
  {
    id: 2,
    name: "Food",
    items: [
      { id: 201, name: "Burger", stock: 12, price: 1299 },
      { id: 202, name: "Fries", stock: 4, price: 499 },
      { id: 203, name: "Caesar Salad", stock: 7, price: 999 },
      { id: 204, name: "Club Sandwich", stock: 0, price: 1149 },
    ],
    subcategories: [
      {
        id: 21,
        name: "Mains",
        items: [
          { id: 211, name: "Grilled Salmon", stock: 5, price: 1899 },
          { id: 212, name: "Chicken Tikka", stock: 9, price: 1599 },
          { id: 213, name: "Mushroom Risotto", stock: 3, price: 1399 },
          { id: 214, name: "Beef Steak", stock: 0, price: 2499 },
        ],
        subcategories: [],
      },
      {
        id: 22,
        name: "Desserts",
        items: [
          { id: 221, name: "Chocolate Cake", stock: 2, price: 699 },
          { id: 222, name: "Ice Cream", stock: 0, price: 499 },
          { id: 223, name: "Tiramisu", stock: 6, price: 749 },
          { id: 224, name: "Cheesecake", stock: 1, price: 729 },
        ],
        subcategories: [],
      },
    ],
  },
  {
    id: 3,
    name: "Snacks",
    items: [
      { id: 301, name: "Garlic Bread", stock: 20, price: 449 },
      { id: 302, name: "Chicken Wings", stock: 0, price: 899 },
      { id: 303, name: "Nachos", stock: 11, price: 799 },
      { id: 304, name: "Soup of the Day", stock: 4, price: 649 },
    ],
    subcategories: [],
  },
];

router.get("/inventory", (_req: Request, res: Response) => {
  res.json(INVENTORY);
});

export { router as mockRouter };
