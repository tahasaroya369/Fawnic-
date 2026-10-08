import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth.js';
import {
  isNeonConfigured,
  loadSchemaFromNeon,
  syncSchemaToNeon,
  recordSyncEventInNeon,
  getSyncEventsFromNeon,
  getProductsFromNeon,
  getCategoriesFromNeon,
  getOrdersFromNeon,
  getNotificationsFromNeon,
  getCouponsFromNeon,
  getCustomerQueriesFromNeon,
  getInvoicesFromNeon,
} from './storage/neon.js';
import type {
  User,
  Category,
  Product,
  Order,
  Address,
  Review,
  Coupon,
  NotificationItem,
  NotificationRecord,
  NotificationReadState,
  AuditLog,
  FAQ,
  Policy,
  ContactMessage,
  HomepageCMS,
  StoreSettings,
  TeamMember,
  InventoryTransaction,
  InvoiceSettings,
  InvoiceRecord,
  MarketingPromotion,
  StaffPermissions,
  CustomerQuery,
} from '../src/types.js';

export interface SyncEvent {
  id: string;
  type: string;
  action?: string;
  timestamp: number;
  [key: string]: any;
}

interface UserWithAuth extends User {
  passwordHash: string;
  salt: string;
}

export interface DatabaseSchema {
  users: UserWithAuth[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  addresses: Address[];
  reviews: Review[];
  coupons: Coupon[];
  notifications: NotificationRecord[];
  notificationReads: NotificationReadState[];
  auditLogs: AuditLog[];
  faqs: FAQ[];
  policies: Policy[];
  contactMessages: ContactMessage[];
  queries: CustomerQuery[];
  newsletterSubscribers: string[];
  wishlists: Record<string, string[]>; // userId -> productIds[]
  homepageCms: HomepageCMS;
  settings: StoreSettings;
  inventoryTransactions: InventoryTransaction[];
  invoices: InvoiceRecord[];
  invoiceSettings: InvoiceSettings;
  teamMembers: TeamMember[];
  promotions: MarketingPromotion[];
  customerNotes: Record<string, string>;
  _syncEvents?: SyncEvent[];
  _version?: number;
  _updatedAt?: string;
}

let cachedDbFilePath: string | null = null;

function getDatabaseFilePath(): string {
  if (cachedDbFilePath) return cachedDbFilePath;

  const defaultDir = path.join(process.cwd(), 'data');
  const defaultFile = path.join(defaultDir, 'fawnic_db.json');

  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    // Quick write probe to verify write permission
    const testFile = path.join(defaultDir, '.write-test');
    fs.writeFileSync(testFile, '1');
    fs.unlinkSync(testFile);
    cachedDbFilePath = defaultFile;
    return defaultFile;
  } catch {
    // Read-only serverless environment (e.g. Vercel Serverless / AWS Lambda)
    const tmpDir = path.join('/tmp', 'data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    cachedDbFilePath = path.join(tmpDir, 'fawnic_db.json');
    return cachedDbFilePath;
  }
}

let db: DatabaseSchema;

export function getInitialDatabase(): DatabaseSchema {
  const adminAuth = hashPassword('@Alichishti340$');
  const customerAuth = hashPassword('password123');

  const users: UserWithAuth[] = [
    {
      id: 'usr_admin_1',
      email: 'alichishtia111@gmail.com',
      name: 'Ali Chishti',
      phone: '+92 300 1234567',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
      passwordHash: adminAuth.hash,
      salt: adminAuth.salt,
    },
    {
      id: 'usr_cust_1',
      email: 'ayesha@example.com',
      name: 'Ayesha Khan',
      phone: '+92 321 9876543',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      createdAt: '2026-02-01T00:00:00.000Z',
      passwordHash: customerAuth.hash,
      salt: customerAuth.salt,
    },
    {
      id: 'usr_cust_2',
      email: 'hamza.rehman@gmail.com',
      name: 'Hamza Rehman',
      phone: '+92 333 4567890',
      role: 'customer',
      createdAt: '2026-02-15T00:00:00.000Z',
      passwordHash: customerAuth.hash,
      salt: customerAuth.salt,
    }
  ];

  const categories: Category[] = [
    {
      id: 'cat_wallets',
      name: "Men's Wallets",
      slug: 'wallets',
      icon: 'Wallet',
      banner: '/assets/images/cat_mens_wallet_v2_1790449008902.jpg',
      description: 'Quality leather wallets designed for easy everyday carry.',
      featured: true,
      isActive: true,
      order: 1,
      subcategories: ['Bifold Wallets', 'Slim Front-Pocket', 'Long Continental', 'RFID Wallets', 'Zipper Wallets'],
    },
    {
      id: 'cat_belts',
      name: "Men's Belts",
      slug: 'belts',
      icon: 'Shield',
      banner: '/assets/images/cat_mens_belt_v2_1790449023189.jpg',
      description: 'Strong leather belts with solid hardware that lasts.',
      featured: true,
      isActive: true,
      order: 2,
      subcategories: ['Formal Dress Belts', 'Casual Harness Belts', 'Reversible Belts', 'Braided Belts'],
    },
    {
      id: 'cat_watches',
      name: 'Premium Watches',
      slug: 'watches',
      icon: 'Clock',
      banner: '/assets/images/cat_luxury_watch_v2_1790449038082.jpg',
      description: 'Classic timepieces with leather straps and precision movements.',
      featured: true,
      isActive: true,
      order: 3,
      subcategories: ['Automatic Chronographs', 'Field Timepieces', 'Dress Watches', 'Exhibition Calibers'],
    },
    {
      id: 'cat_cardholders',
      name: 'Card Holders',
      slug: 'card-holders',
      icon: 'CreditCard',
      banner: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1000&auto=format&fit=crop&q=85',
      description: 'Ultra-thin card sleeves and accordion cases for seamless everyday carry without pocket bulk.',
      featured: false,
      isActive: false,
      order: 4,
      subcategories: ['Minimalist Sleeves', 'Accordion Cases', 'Lanyard ID Holders'],
    },
    {
      id: 'cat_accessories',
      name: 'Leather Accessories',
      slug: 'accessories',
      icon: 'Package',
      banner: 'https://images.unsplash.com/photo-1563903530908-afdd155d057a?w=1000&auto=format&fit=crop&q=85',
      description: 'Key cloches, valet catchall trays, travel watch rolls, and heirloom gift box ensembles.',
      featured: false,
      isActive: false,
      order: 5,
      subcategories: ['Heirloom Gift Sets', 'Valet Trays', 'Key Accessories', 'Watch Rolls'],
    },
  ];

  const products: Product[] = [
    {
      id: 'fwn_wlt_01',
      name: 'The Sovereign Executive Bifold Wallet',
      slug: 'sovereign-executive-bifold-wallet',
      shortDescription: 'Handcrafted from full-grain vegetable-tanned Italian cowhide with hand-burnished edges, 8 card slots, and RFID defense.',
      description: 'A timeless cornerstone of the Fawnic collection. The Sovereign is cut from dense 1.2mm vegetable-tanned cowhide that begins with a rich satin sheen and deepens into a magnificent vintage patina with daily use. Features eight hand-creased card slots, two hidden multi-purpose pockets, and a divided full-length cash compartment lined with durable Japanese cotton twill. Integrated with military-grade copper-nickel RFID blocking mesh to protect your contactless debit cards and biometric IDs.',
      categoryId: 'cat_wallets',
      categoryName: "Men's Leather Wallets",
      subcategoryId: 'Bifold Wallets',
      subcategoryName: 'Bifold Wallets',
      brand: 'FAWNIC',
      leatherType: 'Full-Grain Italian Vegetable-Tanned Cowhide',
      sku: 'FWN-SOV-01',
      regularPrice: 5200,
      salePrice: 4450,
      costPrice: 2200,
      stock: 45,
      lowStockThreshold: 8,
      stockStatus: 'in_stock',
      mainImage: '/assets/images/hero_mens_wallet_1790447762128.jpg',
      images: [
        '/assets/images/hero_mens_wallet_1790447762128.jpg',
        '/assets/images/card_mens_wallet_1790447793950.jpg',
      ],
      tags: ['bifold', 'wallet', 'rfid', 'leather', 'luxury', 'cognac'],
      variants: [
        {
          id: 'var_sov_color',
          name: 'Leather Color',
          options: [
            { label: 'Vintage Cognac', stock: 20 },
            { label: 'Midnight Onyx Black', stock: 15 },
            { label: 'Mahogany Brown', stock: 10 },
          ],
        },
      ],
      features: [
        'Cut from 100% Full-Grain Vegetable-Tanned Cowhide',
        'Certified 13.56 MHz RFID signal blocking layer',
        '8 precision-beveled card slots + 2 hidden compartments',
        'Dual-section currency divider fits Pakistani Rupee banknotes cleanly',
        'Hand-waxed beeswax edge burnishing for lifelong durability',
      ],
      specifications: {
        'Leather Grade': 'Full-Grain Vegetable-Tanned Cowhide (Grade A)',
        'Dimensions': '11.5 cm x 9.2 cm x 1.4 cm',
        'Weight': '85 grams',
        'Hardware / Lining': 'German bonded nylon thread, Japanese cotton twill lining',
        'Origin': 'Handcrafted in Fawnic Atelier, Pakistan',
      },
      careInstructions: 'Apply organic leather balm once every 6 months. Avoid prolonged water exposure. If wet, let dry naturally away from direct heat.',
      rating: 4.9,
      reviewCount: 38,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      status: 'published',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'fwn_wlt_02',
      name: 'The Apex Slim Front-Pocket Wallet',
      slug: 'apex-slim-front-pocket-wallet',
      shortDescription: 'Ultra-thin silhouette designed for seamless front pocket carry with quick-pull card strap.',
      description: 'Engineered for the discerning minimalist who rejects pocket bulge. The Apex maintains a razor-thin 0.7cm footprint while effortlessly carrying up to 7 cards and folded bills. Equipped with a textured leather pull-strap that fans out your secondary cards in an instant, and a front quick-access slot for your everyday transit or payment card.',
      categoryId: 'cat_wallets',
      categoryName: "Men's Leather Wallets",
      subcategoryId: 'Slim Front-Pocket',
      subcategoryName: 'Slim Front-Pocket',
      brand: 'FAWNIC',
      leatherType: 'Top-Grain Nappa Leather',
      sku: 'FWN-APX-02',
      regularPrice: 4200,
      salePrice: 3450,
      costPrice: 1600,
      stock: 60,
      lowStockThreshold: 10,
      stockStatus: 'in_stock',
      mainImage: '/assets/images/card_mens_wallet_1790447793950.jpg',
      images: [
        '/assets/images/card_mens_wallet_1790447793950.jpg',
        '/assets/images/hero_mens_wallet_1790447762128.jpg',
      ],
      tags: ['slim', 'wallet', 'minimalist', 'front-pocket'],
      variants: [
        {
          id: 'var_apx_color',
          name: 'Leather Color',
          options: [
            { label: 'Saddle Tan', stock: 25 },
            { label: 'Obsidian Black', stock: 25 },
            { label: 'British Racing Green', stock: 10 },
          ],
        },
      ],
      features: [
        'Only 7mm thick when empty',
        'Quick-draw pull strap for rapid card access',
        'Integrated RFID shielding protects all internal slots',
        'Beveled edges with matching tonal saddle stitching',
      ],
      specifications: {
        'Leather Grade': 'Full-Grain Top-Grade Nappa',
        'Dimensions': '10.2 cm x 7.6 cm x 0.7 cm',
        'Weight': '42 grams',
        'Capacity': '5-8 cards plus folded cash',
      },
      careInstructions: 'Buff gently with a soft microfiber cloth. Store in dust bag when traveling.',
      rating: 4.8,
      reviewCount: 29,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      status: 'published',
      createdAt: '2026-01-15T12:00:00.000Z',
    },
    {
      id: 'fwn_wlt_03',
      name: 'The Royal Continental Long Wallet',
      slug: 'royal-continental-long-wallet',
      shortDescription: 'Prestigious breast-pocket wallet holding 16 cards, unfolded cash, and travel documents.',
      description: 'Crafted for distinguished business travel and formal occasions. Fits cleanly into suit jacket breast pockets without folding banknotes. Features 16 dedicated card slots, two full-length currency sleeves, a zippered receipt compartment, and dedicated passport slot.',
      categoryId: 'cat_wallets',
      categoryName: "Men's Leather Wallets",
      subcategoryId: 'Long Continental',
      subcategoryName: 'Long Continental',
      brand: 'FAWNIC',
      leatherType: 'Full-Grain Pull-Up Harness Leather',
      sku: 'FWN-RYL-03',
      regularPrice: 7800,
      salePrice: 6800,
      costPrice: 3400,
      stock: 25,
      lowStockThreshold: 5,
      stockStatus: 'in_stock',
      mainImage: '/assets/images/hero_mens_wallet_1790447762128.jpg',
      images: [
        '/assets/images/hero_mens_wallet_1790447762128.jpg',
        '/assets/images/card_mens_wallet_1790447793950.jpg',
      ],
      tags: ['long wallet', 'continental', 'executive', 'suit'],
      variants: [
        {
          id: 'var_ryl_color',
          name: 'Leather Color',
          options: [
            { label: 'Deep Havana Brown', stock: 15 },
            { label: 'Classic Black', stock: 10 },
          ],
        },
      ],
      features: [
        '16 individual card slots',
        'Full-length cash compartment (no folding needed)',
        'Antique brass YKK zipper compartment',
        'Fits standard passport and boarding passes',
      ],
      specifications: {
        'Leather Grade': 'Full-Grain Vegetable-Tanned Oiled Leather',
        'Dimensions': '19 cm x 9.5 cm x 1.8 cm',
        'Weight': '130 grams',
      },
      rating: 5.0,
      reviewCount: 16,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      status: 'published',
      createdAt: '2026-02-01T14:00:00.000Z',
    },
    {
      id: 'fwn_wlt_04',
      name: 'The Armour RFID Tactical Bifold Wallet',
      slug: 'armour-rfid-tactical-bifold-wallet',
      shortDescription: 'Reinforced ballistic leather construction with quick-action thumb ejection and card lock.',
      description: 'A blend of rugged durability and executive refinement. Features reinforced corners, matte gunmetal emblem, and internal ballistic nylon reinforcement for extreme durability.',
      categoryId: 'cat_wallets',
      categoryName: "Men's Leather Wallets",
      subcategoryId: 'RFID Wallets',
      subcategoryName: 'RFID Wallets',
      brand: 'FAWNIC',
      leatherType: 'Top-Grain Waxed Cowhide',
      sku: 'FWN-ARM-04',
      regularPrice: 6500,
      salePrice: 5200,
      costPrice: 2600,
      stock: 35,
      lowStockThreshold: 6,
      stockStatus: 'in_stock',
      mainImage: '/assets/images/card_mens_wallet_1790447793950.jpg',
      images: [
        '/assets/images/card_mens_wallet_1790447793950.jpg',
        '/assets/images/hero_mens_wallet_1790447762128.jpg',
      ],
      tags: ['tactical', 'rfid', 'wallet', 'durable'],
      variants: [],
      features: [
        'Full 360-degree electromagnetic RFID blocking',
        'Quick-slide thumb thumb window for national CNIC / driver license',
        'Triple-stitched stress points',
      ],
      specifications: {
        'Dimensions': '11 cm x 8.8 cm x 1.3 cm',
        'Weight': '78 grams',
        'Capacity': '10 cards + 15 banknotes',
      },
      rating: 4.7,
      reviewCount: 22,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      status: 'published',
      createdAt: '2026-02-10T10:00:00.000Z',
    },
    // Belts
    {
      id: 'fwn_blt_01',
      name: 'The Artisan Solid Brass Full-Grain Formal Belt',
      slug: 'artisan-solid-brass-full-grain-formal-belt',
      shortDescription: '35mm dress belt cut from continuous 9oz full-grain steerhide with solid forged brass hardware.',
      description: 'The definitive formal belt crafted without filler, cardboard, or synthetic bonded backing. Cut directly from dense 3.8mm thick vegetable-tanned steerhide. Each belt is hand-edged, burnished with natural carnauba wax, and anchored by a hand-polished solid brass buckle secured by Chicago screws for easy buckle swapping.',
      categoryId: 'cat_belts',
      categoryName: 'Leather Belts',
      subcategoryId: 'Formal Dress Belts',
      subcategoryName: 'Formal Dress Belts',
      brand: 'FAWNIC',
      leatherType: '9oz Full-Grain Steerhide',
      sku: 'FWN-BLT-01',
      regularPrice: 5500,
      salePrice: 4650,
      costPrice: 2200,
      stock: 55,
      lowStockThreshold: 10,
      stockStatus: 'in_stock',
      mainImage: '/assets/images/hero_mens_belt_1790447772143.jpg',
      images: [
        '/assets/images/hero_mens_belt_1790447772143.jpg',
        '/assets/images/card_mens_belt_1790447805889.jpg',
      ],
      tags: ['belt', 'formal', 'brass', 'leather', 'steerhide'],
      variants: [
        {
          id: 'var_blt1_size',
          name: 'Waist Size (Inches)',
          options: [
            { label: '30 inches', stock: 8 },
            { label: '32 inches', stock: 12 },
            { label: '34 inches', stock: 15 },
            { label: '36 inches', stock: 10 },
            { label: '38 inches', stock: 6 },
            { label: '40 inches', stock: 4 },
          ],
        },
        {
          id: 'var_blt1_color',
          name: 'Leather & Hardware',
          options: [
            { label: 'Jet Black (Brushed Nickel Buckle)', stock: 25 },
            { label: 'Cognac Amber (Antique Brass Buckle)', stock: 20 },
            { label: 'Cordovan Deep Red (Solid Brass Buckle)', stock: 10 },
          ],
        },
      ],
      features: [
        'Cut from single continuous slab of 9oz full-grain steerhide',
        'Solid forged brass hardware with micro-brushed finish',
        'Removable Chicago screw construction allows custom buckle swapping',
        '5 precision teardrop holes spaced 1 inch apart',
        'Beveled edge profile hand-burnished with natural carnauba wax',
      ],
      specifications: {
        'Width': '35 mm (1.38 inches) - Standard Formal Dress Width',
        'Thickness': '3.8 mm (9 oz weight)',
        'Buckle': '100% Solid Forged Brass (Lead-Free)',
        'Leather Type': 'Full-Grain English Bridle Steerhide',
      },
      careInstructions: 'Condition with neatsfoot or mink oil once yearly. Wipe buckle with dry cotton.',
      rating: 4.9,
      reviewCount: 44,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      status: 'published',
      createdAt: '2026-01-12T09:00:00.000Z',
    },
    {
      id: 'fwn_blt_02',
      name: 'The Dual-Tone Reversible Executive Belt',
      slug: 'dual-tone-reversible-executive-belt',
      shortDescription: 'Innovative rotating buckle design offering Jet Black on one side and Rich Chestnut on the other.',
      description: 'Two luxury belts in one. Precision spring-loaded rotation buckle allows instant transformation between midnight black formal dress and rich chestnut business casual.',
      categoryId: 'cat_belts',
      categoryName: 'Leather Belts',
      subcategoryId: 'Reversible Belts',
      subcategoryName: 'Reversible Belts',
      brand: 'FAWNIC',
      leatherType: 'Top-Grain Double-Sided Nappa Leather',
      sku: 'FWN-REV-02',
      regularPrice: 6200,
      salePrice: 5250,
      costPrice: 2500,
      stock: 40,
      lowStockThreshold: 8,
      stockStatus: 'in_stock',
      mainImage: '/assets/images/card_mens_belt_1790447805889.jpg',
      images: [
        '/assets/images/card_mens_belt_1790447805889.jpg',
        '/assets/images/hero_mens_belt_1790447772143.jpg',
      ],
      tags: ['reversible', 'belt', 'dual-tone', 'black', 'brown'],
      variants: [
        {
          id: 'var_blt2_size',
          name: 'Waist Size (Inches)',
          options: [
            { label: '32 inches', stock: 10 },
            { label: '34 inches', stock: 12 },
            { label: '36 inches', stock: 10 },
            { label: '38 inches', stock: 8 },
          ],
        },
      ],
      features: [
        'Dual-sided: Jet Black and Chestnut Brown',
        '360-degree swivel mechanical buckle',
        'Reinforced feather-edge perimeter stitching',
      ],
      specifications: {
        'Width': '33 mm',
        'Buckle': 'Satin Zinc-Alloy with Gunmetal PVD Coating',
      },
      rating: 4.8,
      reviewCount: 31,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      status: 'published',
      createdAt: '2026-01-25T11:00:00.000Z',
    },
    {
      id: 'fwn_blt_03',
      name: 'The Raw Edge Casual Harness Leather Belt',
      slug: 'raw-edge-casual-harness-leather-belt',
      shortDescription: '40mm wide heavy-duty denim belt made from unlined vintage pull-up leather.',
      description: 'Built for denim, chinos, and casual boots. Cut wider at 40mm from uncorrected rough-out pull-up leather that scuffs, heals, and shows character with every wear.',
      categoryId: 'cat_belts',
      categoryName: 'Leather Belts',
      subcategoryId: 'Casual Harness Belts',
      subcategoryName: 'Casual Harness Belts',
      brand: 'FAWNIC',
      leatherType: 'Heavy 10oz Vegetable Tanned Harness Hide',
      sku: 'FWN-CAS-03',
      regularPrice: 4950,
      salePrice: 4150,
      costPrice: 2000,
      stock: 30,
      lowStockThreshold: 6,
      stockStatus: 'in_stock',
      mainImage: '/assets/images/hero_mens_belt_1790447772143.jpg',
      images: [
        '/assets/images/hero_mens_belt_1790447772143.jpg',
        '/assets/images/card_mens_belt_1790447805889.jpg',
      ],
      tags: ['casual', 'denim', 'belt', 'vintage', 'harness'],
      variants: [
        {
          id: 'var_blt3_size',
          name: 'Waist Size (Inches)',
          options: [
            { label: '32 inches', stock: 8 },
            { label: '34 inches', stock: 10 },
            { label: '36 inches', stock: 8 },
            { label: '38 inches', stock: 4 },
          ],
        },
      ],
      features: [
        'Heavy 40mm width matches denim loops perfectly',
        'Raw edge hand-buffed with saddle soap',
        'Matte antique roller buckle prevents leather crease marks',
      ],
      specifications: {
        'Width': '40 mm (1.57 inches)',
        'Thickness': '4.2 mm (10 oz weight)',
        'Buckle': 'Antiqued Steel Roller Buckle',
      },
      rating: 4.9,
      reviewCount: 19,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      status: 'published',
      createdAt: '2026-02-05T15:00:00.000Z',
    },
    // Card Holders
    {
      id: 'fwn_crd_01',
      name: 'The Minimalist Hand-Stitched Card Sleeve',
      slug: 'minimalist-hand-stitched-card-sleeve',
      shortDescription: 'Hand-waxed linen saddle stitching across 3 precision card pockets and central cash fold.',
      description: 'An ode to traditional hand-craftsmanship. Every sleeve is cut by hand and saddle-stitched using two needles and braided beeswax linen thread. Holds 4 to 6 credit cards comfortably while practically disappearing inside any suit or trouser pocket.',
      categoryId: 'cat_cardholders',
      categoryName: 'Card Holders',
      subcategoryId: 'Minimalist Sleeves',
      subcategoryName: 'Minimalist Sleeves',
      brand: 'FAWNIC',
      leatherType: 'Full-Grain Italian Pueblo Leather',
      sku: 'FWN-CRD-01',
      regularPrice: 2800,
      salePrice: 2250,
      costPrice: 900,
      stock: 50,
      lowStockThreshold: 10,
      stockStatus: 'in_stock',
      mainImage: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=1000&auto=format&fit=crop&q=85',
      images: [
        'https://images.unsplash.com/photo-1559563458-527698bf5295?w=1000&auto=format&fit=crop&q=85',
      ],
      tags: ['card holder', 'minimalist', 'saddle stitch', 'sleeve'],
      variants: [
        {
          id: 'var_crd1_color',
          name: 'Color Tone',
          options: [
            { label: 'Saddle Tan', stock: 20 },
            { label: 'Dark Chocolate', stock: 15 },
            { label: 'Navy Indigo', stock: 15 },
          ],
        },
      ],
      features: [
        '100% Traditional hand-stitched with waxed linen thread',
        '3 Card slots + central cash folded pocket',
        'Smooth rounded corners prevent pocket wear',
      ],
      specifications: {
        'Dimensions': '10 cm x 7 cm x 0.4 cm',
        'Weight': '28 grams',
      },
      rating: 4.9,
      reviewCount: 25,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      status: 'published',
      createdAt: '2026-01-18T10:00:00.000Z',
    },
    {
      id: 'fwn_crd_02',
      name: 'The Accordion Expandable Leather Card Case',
      slug: 'accordion-expandable-leather-card-case',
      shortDescription: 'Gusseted accordion design with solid brass snap button holding up to 15 business or credit cards.',
      description: 'Ideal for executives and professionals. Opens like an accordion to reveal multiple organized compartments for business cards, credit cards, and folded currency notes.',
      categoryId: 'cat_cardholders',
      categoryName: 'Card Holders',
      subcategoryId: 'Accordion Cases',
      subcategoryName: 'Accordion Cases',
      brand: 'FAWNIC',
      leatherType: 'Top-Grain Waxed Leather',
      sku: 'FWN-ACC-CRD',
      regularPrice: 3600,
      salePrice: 2950,
      costPrice: 1300,
      stock: 35,
      lowStockThreshold: 6,
      stockStatus: 'in_stock',
      mainImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=85',
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=85',
      ],
      tags: ['accordion', 'business cards', 'case', 'leather'],
      variants: [],
      features: [
        'Expandable fan-out gussets hold up to 15 cards',
        'Reinforced magnetic snap closure',
        'Divided slots for business cards and credit cards',
      ],
      specifications: {
        'Dimensions': '10.5 cm x 7.5 cm x 1.8 cm',
        'Capacity': '15-20 standard cards',
      },
      rating: 4.8,
      reviewCount: 14,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      status: 'published',
      createdAt: '2026-02-08T09:00:00.000Z',
    },
    // Accessories & Gift Sets
    {
      id: 'fwn_acc_01',
      name: 'The Fawnic Heirloom Gift Ensemble (Wallet + Belt + Card Sleeve)',
      slug: 'fawnic-heirloom-gift-ensemble',
      shortDescription: 'The pinnacle luxury gift set presented in a gold-embossed matte wooden presentation box.',
      description: 'Curated for milestone celebrations, weddings, and executive appreciation. Includes our flagship Sovereign Bifold Wallet, the Artisan Solid Brass Formal Belt, and a matching Hand-Stitched Card Sleeve, all cut from color-matched full-grain Italian leather hides. Encased in a bespoke gold-stamped velvet-lined rigid presentation box with custom Fawnic authenticity certificate.',
      categoryId: 'cat_accessories',
      categoryName: 'Leather Accessories',
      subcategoryId: 'Heirloom Gift Sets',
      subcategoryName: 'Heirloom Gift Sets',
      brand: 'FAWNIC',
      leatherType: 'Matched Full-Grain Italian Hide',
      sku: 'FWN-GFT-01',
      regularPrice: 14500,
      salePrice: 11800,
      costPrice: 5500,
      stock: 20,
      lowStockThreshold: 4,
      stockStatus: 'in_stock',
      mainImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=85',
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=1000&auto=format&fit=crop&q=85',
      ],
      tags: ['gift set', 'heirloom', 'wallet and belt', 'luxury gift', 'wedding'],
      variants: [
        {
          id: 'var_gft_size',
          name: 'Belt Size in Set',
          options: [
            { label: '32 Waist Belt', stock: 6 },
            { label: '34 Waist Belt', stock: 8 },
            { label: '36 Waist Belt', stock: 6 },
          ],
        },
      ],
      features: [
        'Includes Sovereign Bifold Wallet + Artisan Belt + Minimalist Card Sleeve',
        'Color-matched from identical full-grain leather hides',
        'Presented in gold-foiled rigid wooden gift chest with velvet lining',
        'Includes handwritten calligraphy gift card on request',
      ],
      specifications: {
        'Box Dimensions': '32 cm x 24 cm x 8 cm',
        'Total Set Weight': '680 grams',
        'Guarantee': 'Fawnic Lifetime Craftsmanship Guarantee',
      },
      rating: 5.0,
      reviewCount: 18,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      status: 'published',
      createdAt: '2026-01-05T12:00:00.000Z',
    },
    {
      id: 'fwn_acc_02',
      name: 'The Handcrafted Leather Valet Catchall Tray',
      slug: 'handcrafted-leather-valet-catchall-tray',
      shortDescription: 'Solid brass corner snaps fold flat for travel or snap up into a nightstand EDC organizer.',
      description: 'A bedside and desk staple. Crafted from thick 8oz vegetable-tanned bridle leather with hand-burnished edges and solid brass corner snaps. Perfect for your watch, keys, coins, and everyday carry items.',
      categoryId: 'cat_accessories',
      categoryName: 'Leather Accessories',
      subcategoryId: 'Valet Trays',
      subcategoryName: 'Valet Trays',
      brand: 'FAWNIC',
      leatherType: '8oz English Bridle Cowhide',
      sku: 'FWN-VLT-02',
      regularPrice: 3400,
      salePrice: 2750,
      costPrice: 1100,
      stock: 40,
      lowStockThreshold: 8,
      stockStatus: 'in_stock',
      mainImage: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1000&auto=format&fit=crop&q=85',
      images: [
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1000&auto=format&fit=crop&q=85',
      ],
      tags: ['valet tray', 'organizer', 'edc', 'leather'],
      variants: [],
      features: [
        'Heavy 8oz thick hide maintains rigid shape',
        'Four solid brass snaps for instant assembly or flat travel packing',
        'Embossed Fawnic crest in center',
      ],
      specifications: {
        'Flat Dimensions': '22 cm x 22 cm',
        'Formed Tray Dimensions': '16 cm x 16 cm x 4 cm deep',
      },
      rating: 4.8,
      reviewCount: 12,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      status: 'published',
      createdAt: '2026-02-12T16:00:00.000Z',
    },
    {
      id: 'fwn_wtc_01',
      name: 'The Sovereign Automatic Chronograph 41mm',
      slug: 'sovereign-automatic-chronograph-41mm',
      shortDescription: 'High-beat 28,800 VPH mechanical movement, anti-reflective double-domed sapphire crystal, and vegetable-tanned leather strap.',
      description: 'Engineered for connoisseurs of fine mechanical horology. The Sovereign Automatic features an exhibition sapphire caseback revealing the decorated rotor and balance wheel. Hand-finished surgical 316L stainless steel case with dual-finish satin brushing and mirror-polished bevels. Fitted with a custom full-grain Italian calfskin strap crafted in our atelier.',
      categoryId: 'cat_watches',
      categoryName: 'Premium Watches',
      subcategoryId: 'Automatic Chronographs',
      subcategoryName: 'Automatic Chronographs',
      brand: 'FAWNIC Atelier',
      leatherType: 'Italian Full-Grain Calfskin Strap',
      sku: 'FWN-WTC-01',
      regularPrice: 28500,
      salePrice: 24500,
      costPrice: 12000,
      stock: 14,
      lowStockThreshold: 4,
      stockStatus: 'in_stock',
      mainImage: '/assets/images/hero_luxury_watch_1790447781834.jpg',
      images: [
        '/assets/images/hero_luxury_watch_1790447781834.jpg',
        '/assets/images/card_luxury_watch_1790447819632.jpg',
      ],
      tags: ['watch', 'automatic', 'horology', 'chronograph', 'sapphire', 'luxury'],
      variants: [],
      features: [
        '28,800 VPH High-Beat Caliber with 42-hour power reserve',
        'Scratch-resistant double-domed sapphire crystal with 5-layer anti-reflective coating',
        'Solid 316L surgical-grade stainless steel case with exhibition glass back',
        'Interchangeable quick-release FAWNIC handcrafted leather strap',
      ],
      specifications: {
        'Case Diameter': '41mm',
        'Case Thickness': '11.8mm',
        'Water Resistance': '100 Meters / 10 ATM',
        'Lug Width': '20mm',
      },
      rating: 4.9,
      reviewCount: 24,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      status: 'published',
      createdAt: '2026-01-12T10:00:00.000Z',
    },
    {
      id: 'fwn_wtc_02',
      name: 'The Heritage Field Mechanical 38mm',
      slug: 'heritage-field-mechanical-38mm',
      shortDescription: 'Military-inspired manual wind caliber with vintage radium-tone Super-LumiNova markers and saddle-stitched bridle strap.',
      description: 'A tribute to classical field instruments. Features a robust bead-blasted 316L case, high-contrast matte dial, and anti-magnetic inner shield. The hand-wound mechanical caliber delivers authentic tactile feedback during morning winding, complemented by an 8oz harness leather strap with solid buckle.',
      categoryId: 'cat_watches',
      categoryName: 'Premium Watches',
      subcategoryId: 'Field Timepieces',
      subcategoryName: 'Field Timepieces',
      brand: 'FAWNIC Atelier',
      leatherType: '8oz Harness Steerhide Strap',
      sku: 'FWN-WTC-02',
      regularPrice: 21500,
      salePrice: 18900,
      costPrice: 9500,
      stock: 18,
      lowStockThreshold: 5,
      stockStatus: 'in_stock',
      mainImage: '/assets/images/card_luxury_watch_1790447819632.jpg',
      images: [
        '/assets/images/card_luxury_watch_1790447819632.jpg',
        '/assets/images/hero_luxury_watch_1790447781834.jpg',
      ],
      tags: ['watch', 'mechanical', 'field', 'military', 'heritage'],
      variants: [],
      features: [
        'Manual-wind 21,600 VPH caliber with tactile winding action',
        'Vintage Old Radium Swiss Super-LumiNova on hands and numerals',
        'Box-section sapphire crystal with internal anti-glare treatment',
        'Solid screw-down caseback engraved with individual atelier serial number',
      ],
      specifications: {
        'Case Diameter': '38mm',
        'Case Thickness': '10.2mm',
        'Water Resistance': '100 Meters / 10 ATM',
        'Lug Width': '20mm',
      },
      rating: 4.8,
      reviewCount: 19,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      status: 'published',
      createdAt: '2026-02-01T10:00:00.000Z',
    },
    {
      id: 'fwn_wtc_03',
      name: 'The Royal Dress Automatic Ultra-Thin 39mm',
      slug: 'royal-dress-automatic-ultra-thin-39mm',
      shortDescription: 'Ultra-slim 8.9mm profile with sunburst guilloché dial, blued hands, and alligator-embossed full-grain strap.',
      description: 'The pinnacle of bespoke dress watch elegance. Measuring just 8.9mm in height, this timepiece slides effortlessly beneath tailored French cuffs. Features thermally blued feuille hands, an applied Breguet-style numeral layout, and an exhibition rotor engraved with the FAWNIC crest.',
      categoryId: 'cat_watches',
      categoryName: 'Premium Watches',
      subcategoryId: 'Dress Watches',
      subcategoryName: 'Dress Watches',
      brand: 'FAWNIC Atelier',
      leatherType: 'Embossed Italian Calfskin Strap',
      sku: 'FWN-WTC-03',
      regularPrice: 33000,
      salePrice: 29800,
      costPrice: 15000,
      stock: 9,
      lowStockThreshold: 3,
      stockStatus: 'low_stock',
      mainImage: '/assets/images/hero_luxury_watch_1790447781834.jpg',
      images: [
        '/assets/images/hero_luxury_watch_1790447781834.jpg',
        '/assets/images/card_luxury_watch_1790447819632.jpg',
      ],
      tags: ['watch', 'dress', 'ultra-thin', 'guilloche', 'automatic'],
      variants: [],
      features: [
        'Ultra-thin automatic caliber measuring only 3.9mm thick',
        'Radial sunburst dial with micro-guilloché center medallion',
        'Thermally heat-blued steel hands with diamond-cut faceted hour markers',
        'Hand-stitched leather strap with signed deployant butterfly clasp',
      ],
      specifications: {
        'Case Diameter': '39mm',
        'Case Thickness': '8.9mm',
        'Water Resistance': '50 Meters / 5 ATM',
        'Lug Width': '20mm',
      },
      rating: 5.0,
      reviewCount: 16,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      status: 'published',
      createdAt: '2026-02-15T10:00:00.000Z',
    },
  ];

  const addresses: Address[] = [
    {
      id: 'addr_1',
      userId: 'usr_cust_1',
      label: 'Home',
      recipientName: 'Ayesha Khan',
      phone: '+92 321 9876543',
      province: 'Sindh',
      city: 'Karachi',
      area: 'DHA Phase 6',
      streetAddress: 'Khayaban-e-Seher, Street 14',
      houseNumber: 'House 42-A',
      postalCode: '75500',
      landmark: 'Near Seher Commercial Masjid',
      isDefault: true,
    },
    {
      id: 'addr_2',
      userId: 'usr_cust_2',
      label: 'Office',
      recipientName: 'Hamza Rehman',
      phone: '+92 333 4567890',
      province: 'Punjab',
      city: 'Lahore',
      area: 'Gulberg III',
      streetAddress: 'Main Boulevard, Suite 502',
      houseNumber: 'Al-Hafeez Heights',
      postalCode: '54000',
      landmark: 'Opposite Pace Shopping Mall',
      isDefault: true,
    }
  ];

  const orders: Order[] = [
    {
      id: 'ord_1001',
      orderNumber: 'FWN-98421',
      customerId: 'usr_cust_1',
      customerName: 'Ayesha Khan',
      customerEmail: 'ayesha@example.com',
      customerPhone: '+92 321 9876543',
      shippingAddress: addresses[0],
      items: [
        {
          productId: 'fwn_wlt_01',
          productName: 'The Sovereign Executive Bifold Wallet',
          productImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1000&auto=format&fit=crop&q=85',
          sku: 'FWN-SOV-01',
          variantInfo: 'Leather Color: Vintage Cognac',
          quantity: 1,
          unitPrice: 4450,
          subtotal: 4450,
        },
      ],
      subtotal: 4450,
      shippingFee: 0,
      discount: 445,
      couponCode: 'FAWNIC10',
      total: 4005,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      status: 'delivered',
      trackingNumber: 'TCS-9281746201',
      courierName: 'TCS Express Pakistan',
      notes: 'Customer requested evening delivery after 5 PM.',
      createdAt: '2026-03-01T14:30:00.000Z',
    },
    {
      id: 'ord_1002',
      orderNumber: 'FWN-98422',
      customerId: 'usr_cust_2',
      customerName: 'Hamza Rehman',
      customerEmail: 'hamza.rehman@gmail.com',
      customerPhone: '+92 333 4567890',
      shippingAddress: addresses[1],
      items: [
        {
          productId: 'fwn_blt_01',
          productName: 'The Artisan Solid Brass Full-Grain Formal Belt',
          productImage: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=1000&auto=format&fit=crop&q=85',
          sku: 'FWN-BLT-01',
          variantInfo: 'Waist Size: 34 inches, Leather & Hardware: Jet Black (Brushed Nickel Buckle)',
          quantity: 1,
          unitPrice: 4650,
          subtotal: 4650,
        },
        {
          productId: 'fwn_crd_01',
          productName: 'The Minimalist Hand-Stitched Card Sleeve',
          productImage: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=1000&auto=format&fit=crop&q=85',
          sku: 'FWN-CRD-01',
          variantInfo: 'Color Tone: Saddle Tan',
          quantity: 1,
          unitPrice: 2250,
          subtotal: 2250,
        },
      ],
      subtotal: 6900,
      shippingFee: 0,
      discount: 0,
      total: 6900,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'shipped',
      trackingNumber: 'LEO-47382910',
      courierName: 'Leopards Courier Logistics',
      createdAt: '2026-03-09T11:15:00.000Z',
    },
    {
      id: 'ord_1003',
      orderNumber: 'FWN-98423',
      customerId: 'usr_cust_1',
      customerName: 'Ayesha Khan',
      customerEmail: 'ayesha@example.com',
      customerPhone: '+92 321 9876543',
      shippingAddress: addresses[0],
      items: [
        {
          productId: 'fwn_acc_01',
          productName: 'The Fawnic Heirloom Gift Ensemble (Wallet + Belt + Card Sleeve)',
          productImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=85',
          sku: 'FWN-GFT-01',
          variantInfo: 'Belt Size in Set: 34 Waist Belt',
          quantity: 1,
          unitPrice: 11800,
          subtotal: 11800,
        }
      ],
      subtotal: 11800,
      shippingFee: 0,
      discount: 2000,
      couponCode: 'LUXURY20',
      total: 9800,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
      paymentVerificationStatus: 'verified',
      paymentVerifiedAt: '2026-03-10T17:00:00.000Z',
      paymentVerifiedBy: 'Ali Chishti',
      bankTxRef: 'FT260689123',
      transactionId: 'FT260689123',
      transactionReference: 'FT260689123',
      paymentProof: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=85',
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=85',
      paymentProofSubmittedAt: '2026-03-10T16:50:00.000Z',
      status: 'processing',
      trackingNumber: 'TCS-9281749912',
      courierName: 'TCS Express Pakistan',
      notes: 'Paid via 1Link IBFT to Meezan Bank. Ref: FT260689123.',
      createdAt: '2026-03-10T16:45:00.000Z',
    },
    {
      id: 'ord_1004',
      orderNumber: 'FWN-98424',
      customerId: 'usr_cust_2',
      customerName: 'Zainab Tariq',
      customerEmail: 'zainab.tariq@gmail.com',
      customerPhone: '+92 300 8765432',
      shippingAddress: {
        id: 'addr_1004',
        fullName: 'Zainab Tariq',
        phone: '+92 300 8765432',
        addressLine1: 'House 42-B, Street 14, Sector F-7/2',
        area: 'F-7',
        city: 'Islamabad',
        province: 'Federal Capital',
        postalCode: '44000',
        landmark: 'Near Safa Gold Mall',
        isDefault: true,
      },
      items: [
        {
          productId: 'fwn_wlt_01',
          productName: 'The Sovereign Executive Bifold Wallet',
          productImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1000&auto=format&fit=crop&q=85',
          sku: 'FWN-SOV-01',
          variantInfo: 'Color: Vintage Cognac',
          quantity: 1,
          unitPrice: 4450,
          subtotal: 4450,
        },
        {
          productId: 'fwn_blt_01',
          productName: 'The Artisan Solid Brass Full-Grain Formal Belt',
          productImage: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=1000&auto=format&fit=crop&q=85',
          sku: 'FWN-BLT-01',
          variantInfo: 'Waist Size: 32 inches',
          quantity: 1,
          unitPrice: 4650,
          subtotal: 4650,
        },
      ],
      subtotal: 9100,
      shippingFee: 0,
      discount: 500,
      couponCode: 'WELCOME500',
      total: 8600,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'pending_verification',
      paymentVerificationStatus: 'pending_verification',
      bankTxRef: 'MEZN-IBFT-88391204',
      transactionId: 'MEZN-IBFT-88391204',
      transactionReference: 'MEZN-IBFT-88391204',
      paymentProof: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=1200&auto=format&fit=crop&q=85',
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=1200&auto=format&fit=crop&q=85',
      paymentProofSubmittedAt: '2026-03-11T10:20:00.000Z',
      status: 'pending',
      notes: 'Transfer sent from HBL App to Meezan Bank. Attached payment screenshot.',
      createdAt: '2026-03-11T10:15:00.000Z',
    }
  ];

  const reviews: Review[] = [
    {
      id: 'rev_1',
      productId: 'fwn_wlt_01',
      productName: 'The Sovereign Executive Bifold Wallet',
      customerId: 'usr_cust_1',
      customerName: 'Ayesha Khan',
      customerCity: 'Karachi',
      rating: 5,
      title: 'Remarkable leather quality and smell',
      comment: 'Ordered this as an anniversary gift for my husband. The full-grain leather texture and the rich smell right out of the box are unmatched. Delivered within 24 hours in Karachi by TCS.',
      verifiedPurchase: true,
      isApproved: true,
      createdAt: '2026-03-03T18:00:00.000Z',
      adminReply: 'Thank you for your generous review, Ayesha. Wishing your husband years of handsome patina with The Sovereign.',
    },
    {
      id: 'rev_2',
      productId: 'fwn_blt_01',
      productName: 'The Artisan Solid Brass Full-Grain Formal Belt',
      customerId: 'usr_cust_2',
      customerName: 'Hamza Rehman',
      customerCity: 'Lahore',
      rating: 5,
      title: 'Finally a real steerhide belt without cardboard filler!',
      comment: 'Most department store belts split apart after 6 months. This Fawnic belt is thick, solid steerhide with solid brass hardware. Worth every rupee.',
      verifiedPurchase: true,
      isApproved: true,
      createdAt: '2026-03-05T09:30:00.000Z',
    },
    {
      id: 'rev_3',
      productId: 'fwn_wlt_02',
      productName: 'The Apex Slim Front-Pocket Wallet',
      customerName: 'Bilal Farooq',
      customerCity: 'Islamabad',
      rating: 5,
      title: 'Best front pocket wallet in Pakistan',
      comment: 'Super sleek, doesn’t ruin suit pants silhouette. Pull tab works effortlessly. 10/10.',
      verifiedPurchase: true,
      isApproved: true,
      createdAt: '2026-02-20T12:00:00.000Z',
    },
  ];

  const coupons: Coupon[] = [
    {
      id: 'cpn_1',
      code: 'FAWNIC10',
      type: 'percent',
      value: 10,
      minOrderAmount: 3500,
      maxDiscount: 1500,
      usageLimit: 500,
      usedCount: 42,
      perUserLimit: 1,
      expiresAt: '2026-12-31T23:59:59.000Z',
      isActive: true,
    },
    {
      id: 'cpn_2',
      code: 'FIRSTORDER',
      type: 'fixed',
      value: 500,
      minOrderAmount: 4000,
      usageLimit: 1000,
      usedCount: 78,
      perUserLimit: 1,
      expiresAt: '2026-12-31T23:59:59.000Z',
      isActive: true,
    },
    {
      id: 'cpn_3',
      code: 'LUXURY20',
      type: 'percent',
      value: 20,
      minOrderAmount: 8000,
      maxDiscount: 3000,
      usageLimit: 100,
      usedCount: 15,
      perUserLimit: 1,
      expiresAt: '2026-12-31T23:59:59.000Z',
      isActive: true,
    }
  ];

  const notifications: NotificationRecord[] = [];
  const notificationReads: NotificationReadState[] = [];

  const faqs: FAQ[] = [
    {
      id: 'faq_1',
      category: 'Orders',
      question: 'How do I place an order with Cash on Delivery (COD)?',
      answer: 'Simply add your desired leather products to the cart and proceed to checkout. Enter your delivery address anywhere in Pakistan, select Cash on Delivery, and complete the order. You inspect the parcel and pay the courier rider upon delivery at your doorstep.',
      order: 1,
    },
    {
      id: 'faq_2',
      category: 'Shipping',
      question: 'What are the delivery timelines and shipping charges across Pakistan?',
      answer: 'Orders totaling Rs. 5,000 or more qualify for 100% FREE nationwide shipping. For orders below Rs. 5,000, standard delivery is Rs. 250. Orders of Rs. 5,000 or more paid online receive 7% cashback credited within 24 hours. Deliveries within Karachi are completed in 24 hours. Deliveries to Lahore, Islamabad, and Rawalpindi take 24–48 hours. Other cities nationwide take 2–3 business days via TCS or Leopards Courier.',
      order: 2,
    },
    {
      id: 'faq_3',
      category: 'Leather Care',
      question: 'What type of leather does Fawnic use in its wallets and belts?',
      answer: 'We exclusively use premium full-grain and top-grain cowhide and steerhide leathers. Unlike bonded or faux leather that peels over time, our full-grain leather naturally absorbs oils, resists tears, and develops a lustrous, distinguished patina that looks richer with every passing year.',
      order: 3,
    },
    {
      id: 'faq_4',
      category: 'Returns & Warranty',
      question: 'What is Fawnic’s 7-Day Hassle-Free Exchange and Return policy?',
      answer: 'If you are not thoroughly satisfied with the fit, color, or feel of your Fawnic product, you may request an exchange or return within 7 days of delivery. Our logistics team coordinates a doorstep courier pickup from your residence. All items must be unused with original presentation tags.',
      order: 4,
    },
    {
      id: 'faq_5',
      category: 'Payments',
      question: 'Can I pay via Direct Bank Transfer (1Link IBFT)?',
      answer: 'Yes. In addition to Cash on Delivery, we support direct bank transfers via 1Link IBFT into our Meezan Bank corporate account. Simply provide the transaction reference upon checkout for immediate processing.',
      order: 5,
    },
  ];

  const policies: Policy[] = [
    {
      id: 'pol_shipping',
      slug: 'shipping-policy',
      title: 'Nationwide Shipping & Logistics Policy',
      content: `### 1. Dedicated Courier Partnerships
All Fawnic orders are dispatched via tracked courier consignments handled by TCS Express, Leopards Courier, and Trax Logistics.

### 2. Free Delivery Threshold
- **Orders Rs. 5,000 and above:** Enjoy 100% complimentary express delivery across all 150+ cities in Pakistan. Plus, get 7% cashback on online orders of Rs. 5,000 or more (credited within 24 hours).
- **Orders under Rs. 5,000:** Standard delivery fee of Rs. 250 is applied at checkout.

### 3. Estimated Delivery Times
- **Karachi:** 12 to 24 hours (Same-day dispatch for orders placed before 2:00 PM).
- **Lahore, Islamabad, Rawalpindi:** 24 to 48 hours.
- **Peshawar, Faisalabad, Multan, Sialkot, Quetta & Nationwide:** 2 to 3 business days.

### 4. Cash on Delivery (COD) Protocol
Couriers accept Cash on Delivery payments in Pakistani Rupees (PKR). Riders provide an official SMS dispatch receipt upon delivery.`,
      lastUpdated: '2026-03-01',
    },
    {
      id: 'pol_returns',
      slug: 'return-and-refund-policy',
      title: '7-Day Return, Exchange & Warranty Policy',
      content: `### 1. 7-Day Doorstep Exchange
You have 7 calendar days from the date of parcel receipt to request an exchange for size, color, or model. Fawnic coordinates a courier rider to collect the return parcel directly from your doorstep.

### 2. Condition of Returned Items
Items must be in pristine, unworn condition with original presentation boxes, dust bags, and authentication tags attached.

### 3. Refunds
Approved refunds for Cash on Delivery purchases are disbursed via JazzCash, EasyPaisa, or direct 1Link Bank Transfer within 48 hours of item inspection.

### 4. Craftsmanship Warranty
Every Fawnic wallet and belt carries a 1-Year Craftsmanship Guarantee covering stitching integrity, hardware functionality, and leather grain durability.`,
      lastUpdated: '2026-03-01',
    },
    {
      id: 'pol_privacy',
      slug: 'privacy-policy',
      title: 'Customer Privacy & Data Protection',
      content: `### 1. Data Integrity
Fawnic respects your privacy. We collect customer telephone numbers, shipping addresses, and emails strictly for order fulfillment, dispatch SMS notifications, and delivery coordination.

### 2. No Third-Party Reselling
We never sell, rent, or monetize your contact or purchase information with external advertisers or telemarketers.

### 3. Pakistani Legal Compliance
Please note that these policies represent standard commercial terms and should be reviewed for formal compliance with applicable Pakistani consumer protection and e-commerce laws.`,
      lastUpdated: '2026-03-01',
    },
    {
      id: 'pol_terms',
      slug: 'terms-and-conditions',
      title: 'Terms of Service & Atelier Standards',
      content: `### 1. General Agreement
By placing an order on Fawnic, you agree to these terms of service, payment arrangements, and courier delivery procedures.

### 2. Natural Leather Variations
Full-grain leather is an authentic organic material. Natural grain variations, subtle pull-up shading, and gentle character marks are natural signatures of genuine high-grade animal hide and are not considered manufacturing defects.`,
      lastUpdated: '2026-03-01',
    },
  ];

  const homepageCms: HomepageCMS = {
    heroHeading: 'Crafted for the Way You Carry.',
    heroSubheading: 'Master-crafted full-grain leather wallets, solid brass belts, and everyday essentials engineered for effortless distinction.',
    heroImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1600&auto=format&fit=crop&q=90',
    heroCtaText: 'Shop Collection',
    heroCtaLink: '#shop',
    announcementText: 'Complimentary Express Nationwide Delivery on Orders Over Rs. 5,000',
    isAnnouncementEnabled: true,
    featuredCategoriesEnabled: true,
    bestSellersEnabled: true,
    brandStoryEnabled: true,
    craftsmanshipEnabled: true,
    featuredWalletEnabled: true,
    beltShowcaseEnabled: true,
    whyFawnicEnabled: true,
    reviewsEnabled: true,
    brandGalleryEnabled: true,
    newsletterEnabled: true,
  };

  const settings: StoreSettings = {
    storeName: 'FAWNIC Luxury Leather Goods',
    logoUrl: 'https://i.postimg.cc/d391qxwY/Whats-App-Image-2026-09-11-at-11-39-40-AM.jpg',
    faviconUrl: 'https://i.postimg.cc/d391qxwY/Whats-App-Image-2026-09-11-at-11-39-40-AM.jpg',
    currency: 'PKR',
    supportEmail: 'fawnic01@gmail.com',
    supportPhone: '03711661611',
    supportWhatsApp: '03711661611',
    officeAddress: 'DHA Phase 5, Lahore, Pakistan',
    standardShippingFee: 250,
    freeShippingThreshold: 5000,
    estimatedDeliveryKarachi: '2 - 3 Business Days',
    estimatedDeliveryMajorCities: '24 - 48 Hours',
    estimatedDeliveryNationwide: '2 - 3 Business Days',
    codEnabled: true,
    bankTransferEnabled: true,
    bankAccountTitle: 'ALI AHAB MUKARRAM',
    bankAccountNumber: '28020115438839',
    bankName: 'Meezan Bank',
    bankIban: 'PK20MEZN0028020115438839',
    bankBranch: 'DHA Phase 5, Lahore',
    bankPaymentInstructions: 'Transfer the exact order amount via online banking, mobile app, or ATM to the Meezan Bank account above. After payment, upload your payment receipt or transfer screenshot to submit your order for verification.',
    bankPaymentProofRequired: true,
  };

  const auditLogs: AuditLog[] = [
    {
      id: 'log_init',
      adminEmail: 'alichishtia111@gmail.com',
      action: 'SYSTEM_INITIALIZED',
      entityType: 'Store',
      entityId: 'fawnic_core',
      details: 'Fawnic Premium Leather Store initialized with full-grain catalog and secure administration.',
      timestamp: new Date().toISOString(),
    }
  ];

  const invoiceSettings: InvoiceSettings = {
    businessName: 'FAWNIC ATELIER',
    logoUrl: '/fawnic-logo.jpg',
    address: 'DHA Phase 5, Lahore, Pakistan',
    email: 'fawnic01@gmail.com',
    phone: '03711661611',
    website: 'https://fawnic.pk',
    ntn: 'NTN: 8294719-4',
    invoicePrefix: 'INV-',
    footerText: 'Thank you for choosing FAWNIC ATELIER. Handcrafted in Pakistan from certified full-grain hides.',
    termsAndConditions: 'All bespoke and heirloom leather creations carry a 1-year atelier warranty and 7-day doorstep inspection policy.',
  };

  const invoices: InvoiceRecord[] = [
    {
      id: 'inv_1001',
      invoiceNumber: 'INV-000101',
      orderId: 'ord_1001',
      orderNumber: 'FWN-98421',
      customerName: 'Ayesha Khan',
      customerEmail: 'ayesha@example.com',
      customerPhone: '+92 321 9876543',
      customerAddress: 'Al-Hafeez Heights, Main Boulevard, Suite 502, Gulberg III, Lahore',
      items: orders[0].items,
      subtotal: 4450,
      shippingFee: 0,
      discount: 445,
      total: 4005,
      paymentMethod: 'Cash on Delivery (COD)',
      paymentStatus: 'paid',
      orderDate: '2026-03-01T14:30:00.000Z',
      createdAt: '2026-03-01T15:00:00.000Z',
      status: 'paid',
    },
    {
      id: 'inv_1002',
      invoiceNumber: 'INV-000102',
      orderId: 'ord_1003',
      orderNumber: 'FWN-98423',
      customerName: 'Ayesha Khan',
      customerEmail: 'ayesha@example.com',
      customerPhone: '+92 321 9876543',
      customerAddress: 'Al-Hafeez Heights, Main Boulevard, Suite 502, Gulberg III, Lahore',
      items: orders[2].items,
      subtotal: 11800,
      shippingFee: 0,
      discount: 2000,
      total: 9800,
      paymentMethod: '1Link Bank Transfer (Meezan Bank)',
      paymentStatus: 'paid',
      orderDate: '2026-03-10T16:45:00.000Z',
      createdAt: '2026-03-10T17:00:00.000Z',
      status: 'paid',
    }
  ];

  const inventoryTransactions: InventoryTransaction[] = [
    {
      id: 'txn_init_01',
      productId: 'fwn_wlt_01',
      productName: 'The Sovereign Executive Bifold Wallet',
      sku: 'FWN-SOV-01',
      change: 50,
      previousStock: 0,
      newStock: 50,
      reason: 'Production',
      adminEmail: 'alichishtia111@gmail.com',
      timestamp: '2026-01-10T10:00:00.000Z',
      notes: 'Initial atelier workshop batch completed in Vintage Cognac.',
    },
    {
      id: 'txn_init_02',
      productId: 'fwn_wlt_01',
      productName: 'The Sovereign Executive Bifold Wallet',
      sku: 'FWN-SOV-01',
      change: -1,
      previousStock: 46,
      newStock: 45,
      reason: 'Order Placed',
      referenceId: 'FWN-98421',
      adminEmail: 'system@fawnic.pk',
      timestamp: '2026-03-01T14:30:00.000Z',
      notes: 'Automated order inventory deduction.',
    }
  ];

  const teamMembers: TeamMember[] = [
    {
      id: 'usr_admin_1',
      name: 'Ali Chishti',
      email: 'alichishtia111@gmail.com',
      phone: '+92 300 1234567',
      role: 'super_admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString(),
      permissions: {
        pages: ['dashboard', 'orders', 'products', 'inventory', 'customers', 'invoices', 'coupons', 'marketing', 'analytics', 'team', 'settings'],
        actions: {
          products: { create: true, edit: true, delete: true, change_price: true },
          orders: { change_status: true, cancel: true, refund: true },
          inventory: { adjust: true },
          invoices: { create_manual: true, delete: true },
          customers: { edit: true, delete: true },
          coupons: { create: true, edit: true, delete: true },
          staff: { create: true, edit: true, delete: true, change_password: true, manage_permissions: true },
          settings: { edit: true },
        },
      },
    },
    {
      id: 'tm_2',
      name: 'Sara Bilal',
      email: 'sara.atelier@fawnic.pk',
      phone: '+92 321 4455667',
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2026-01-15T00:00:00.000Z',
      lastLogin: '2026-03-10T09:12:00.000Z',
      permissions: {
        pages: ['dashboard', 'orders', 'products', 'inventory', 'customers', 'invoices', 'coupons', 'marketing'],
        actions: {
          products: { create: true, edit: true, delete: false, change_price: true },
          orders: { change_status: true, cancel: true, refund: false },
          inventory: { adjust: true },
          invoices: { create_manual: true, delete: false },
          customers: { edit: true, delete: false },
          coupons: { create: true, edit: true, delete: false },
          staff: { create: false, edit: false, delete: false, change_password: false, manage_permissions: false },
          settings: { edit: false },
        },
      },
    },
    {
      id: 'tm_3',
      name: 'Usman Farooq',
      email: 'usman.logistics@fawnic.pk',
      phone: '+92 333 7788990',
      role: 'order_manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2026-02-01T00:00:00.000Z',
      lastLogin: '2026-03-11T08:30:00.000Z',
      permissions: {
        pages: ['dashboard', 'orders', 'inventory', 'invoices'],
        actions: {
          products: { create: false, edit: false, delete: false, change_price: false },
          orders: { change_status: true, cancel: false, refund: false },
          inventory: { adjust: true },
          invoices: { create_manual: true, delete: false },
          customers: { edit: false, delete: false },
          coupons: { create: false, edit: false, delete: false },
          staff: { create: false, edit: false, delete: false, change_password: false, manage_permissions: false },
          settings: { edit: false },
        },
      },
    },
    {
      id: 'tm_4',
      name: 'Zainab Qasim',
      email: 'zainab.finance@fawnic.pk',
      phone: '+92 345 1122334',
      role: 'accountant',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2026-02-10T00:00:00.000Z',
      lastLogin: '2026-03-09T14:20:00.000Z',
      permissions: {
        pages: ['dashboard', 'orders', 'invoices', 'analytics'],
        actions: {
          products: { create: false, edit: false, delete: false, change_price: false },
          orders: { change_status: false, cancel: false, refund: false },
          inventory: { adjust: false },
          invoices: { create_manual: true, delete: true },
          customers: { edit: false, delete: false },
          coupons: { create: false, edit: false, delete: false },
          staff: { create: false, edit: false, delete: false, change_password: false, manage_permissions: false },
          settings: { edit: false },
        },
      },
    }
  ];

  const customerNotes: Record<string, string> = {
    'usr_cust_1': 'VIP patron. Prefers discreet luxury gift packaging with embossed initials.',
    'usr_cust_2': 'Frequent leather enthusiast. Interested in custom 38-inch belt batches.',
  };

  return {
    users,
    categories,
    products,
    orders,
    addresses,
    reviews,
    coupons,
    notifications,
    notificationReads,
    auditLogs,
    faqs,
    policies,
    contactMessages: [],
    queries: [],
    newsletterSubscribers: ['ayesha@example.com'],
    wishlists: {
      usr_cust_1: ['fwn_wlt_01', 'fwn_blt_01'],
    },
    homepageCms,
    settings,
    inventoryTransactions,
    invoices,
    invoiceSettings,
    teamMembers,
    promotions: [],
    customerNotes,
  };
}

function loadDatabase(): DatabaseSchema {
  const activeFile = getDatabaseFilePath();
  const seedFile = path.join(process.cwd(), 'data', 'fawnic_db.json');

  let fileToRead = '';
  if (fs.existsSync(activeFile)) {
    fileToRead = activeFile;
  } else if (fs.existsSync(seedFile)) {
    fileToRead = seedFile;
  }

  if (fileToRead) {
    try {
      const data = fs.readFileSync(fileToRead, 'utf-8');
      const parsed = JSON.parse(data);
      // Ensure all root arrays and objects are present
      if (parsed.users && parsed.products && parsed.homepageCms) {
        // Ensure the authorized administrator credentials match @Alichishti340$
        const admin = parsed.users.find((u: any) => u.email && u.email.toLowerCase() === 'alichishtia111@gmail.com');
        if (admin) {
          admin.passwordHash = 'cbb3d466de30abaa2a9eea4b4503394626e8f98b65255c1bf6d0f27f1dda9237c92bdc71826328ec229be293012fea5c86f4c982f56066148a5dc11601529048';
          admin.salt = 'e57fbb13aefd72c43f4792a061c43a37';
          admin.role = 'admin';
        }
        // Remove any old demo admin account
        parsed.users = parsed.users.filter((u: any) => u.email !== 'admin@fawnic.pk');

        if (!parsed.inventoryTransactions) parsed.inventoryTransactions = [];
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.notificationReads) parsed.notificationReads = [];
        if (!parsed.invoices) parsed.invoices = [];
        if (!parsed.queries) parsed.queries = [];
        if (!parsed.teamMembers) parsed.teamMembers = [];
        if (!parsed.promotions) parsed.promotions = [];
        if (!parsed.customerNotes) parsed.customerNotes = {};
        if (!parsed.auditLogs) parsed.auditLogs = [];
        if (!parsed.invoiceSettings) {
          parsed.invoiceSettings = {
            businessName: 'FAWNIC Leather Atelier',
            logoUrl: '/fawnic-logo.jpg',
            address: 'Lahore, Punjab, Pakistan',
            email: 'fawnic1@gmail.com',
            phone: '03711661611',
            website: 'https://fawnic.pk',
            ntn: '',
            invoicePrefix: 'FW-INV-',
            footerText: 'Created By FAWNIC Team',
            termsAndConditions: 'All bespoke and heirloom leather creations carry a 1-year atelier warranty.',
          };
        } else {
          // Always ensure permanent contact details and logo
          parsed.invoiceSettings.businessName = 'FAWNIC ATELIER';
          parsed.invoiceSettings.logoUrl = '/fawnic-logo.jpg';
          parsed.invoiceSettings.address = 'DHA Phase 5, Lahore, Pakistan';
          parsed.invoiceSettings.email = 'fawnic01@gmail.com';
          parsed.invoiceSettings.phone = '03711661611';
          parsed.invoiceSettings.invoicePrefix = 'FW-INV-';
          parsed.invoiceSettings.footerText = 'Created By FAWNIC Team';
        }
        if (!parsed.settings) {
          parsed.settings = getInitialDatabase().settings;
        } else {
          parsed.settings.bankName = 'Meezan Bank';
          parsed.settings.bankAccountTitle = 'ALI AHAB MUKARRAM';
          parsed.settings.bankAccountNumber = '28020115438839';
          parsed.settings.bankIban = 'PK20MEZN0028020115438839';
          parsed.settings.bankBranch = 'DHA Phase 5, Lahore';
          parsed.settings.supportEmail = 'fawnic01@gmail.com';
          parsed.settings.supportPhone = '03711661611';
          parsed.settings.supportWhatsApp = '03711661611';
          parsed.settings.officeAddress = 'DHA Phase 5, Lahore, Pakistan';
          if (parsed.settings.bankPaymentProofRequired === undefined) {
            parsed.settings.bankPaymentProofRequired = true;
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error reading db file, regenerating fresh database:', e);
    }
  }

  const initial = getInitialDatabase();
  // In serverless / read-only cold starts, save locally only and never overwrite remote storage with empty initial data
  saveDatabase(initial, true);
  return initial;
}

export function getNextInvoiceNumber(): string {
  const currentDb = getDb();
  const prefix = 'FW-INV-';
  let maxSeq = 0;
  if (currentDb.invoices && currentDb.invoices.length > 0) {
    for (const inv of currentDb.invoices) {
      if (inv.invoiceNumber) {
        const match = inv.invoiceNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }
  }
  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export function getNextQueryNumber(): string {
  const currentDb = getDb();
  const prefix = 'FW-QRY-';
  let maxSeq = 0;
  if (currentDb.queries && currentDb.queries.length > 0) {
    for (const q of currentDb.queries) {
      if (q.queryNumber) {
        const match = q.queryNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }
  }
  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export function saveDatabase(dataToSave?: DatabaseSchema, skipRemoteSync = false): void {
  try {
    const current = dataToSave || db;
    if (!current) return;

    current._version = (current._version || 0) + 1;
    current._updatedAt = new Date().toISOString();

    const targetFile = getDatabaseFilePath();
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    const tempFile = `${targetFile}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(current, null, 2), 'utf-8');
    try {
      fs.renameSync(tempFile, targetFile);
    } catch {
      fs.writeFileSync(targetFile, JSON.stringify(current, null, 2), 'utf-8');
    }

    // Trigger asynchronous remote persistence for production / serverless environments unless explicitly skipped
    if (!skipRemoteSync) {
      saveToRemoteStorage(current).catch((err) => {
        console.warn('[Storage] Remote persistence error:', err?.message || err);
      });
    }
  } catch (e) {
    console.error('Error saving database:', e);
  }
}

export async function saveDatabaseAsync(dataToSave?: DatabaseSchema): Promise<void> {
  saveDatabase(dataToSave);
  const current = dataToSave || db;
  if (current) {
    try {
      await saveToRemoteStorage(current);
    } catch (err: any) {
      console.warn('[Storage] Remote persistence async error:', err?.message || err);
    }
  }
}

// In-memory sync events buffer
const syncEventsBuffer: SyncEvent[] = [];
const MAX_SYNC_EVENTS = 200;

export function recordSyncEvent(event: { type: string; action?: string; [key: string]: any }): SyncEvent {
  const currentDb = getDb();
  const evt: SyncEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  syncEventsBuffer.unshift(evt);
  if (syncEventsBuffer.length > MAX_SYNC_EVENTS) {
    syncEventsBuffer.pop();
  }

  if (!currentDb._syncEvents) currentDb._syncEvents = [];
  currentDb._syncEvents.unshift(evt);
  if (currentDb._syncEvents.length > MAX_SYNC_EVENTS) {
    currentDb._syncEvents.pop();
  }

  currentDb._version = (currentDb._version || 0) + 1;
  currentDb._updatedAt = new Date().toISOString();

  // Save changes to persist events
  saveDatabase(currentDb);

  if (isNeonConfigured()) {
    recordSyncEventInNeon(evt).catch((err: any) => {
      console.warn('[Neon Sync] Error recording sync event:', err.message);
    });
  }

  return evt;
}

export function getSyncEvents(since = 0, limit = 50): SyncEvent[] {
  const currentDb = getDb();
  const events = (currentDb._syncEvents && currentDb._syncEvents.length > 0)
    ? currentDb._syncEvents
    : syncEventsBuffer;

  if (!since || isNaN(since)) {
    return events.slice(0, limit);
  }

  return events.filter((e) => e.timestamp > since).slice(0, limit);
}

export function getDbVersion(): number {
  const currentDb = getDb();
  return currentDb._version || 1;
}

// -------------------------------------------------------------
// Remote Storage Adapters for Production / Vercel Serverless
// Supports: Vercel KV / Upstash Redis, JSONBin.io, Supabase, Custom REST
// -------------------------------------------------------------

async function loadFromVercelKV(): Promise<DatabaseSchema | null> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/get/fawnic_database_prod`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    if (json && json.result) {
      const data = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
      if (data && data.users && data.products) return data;
    }
  } catch (err) {
    console.error('[Storage] Error loading from Vercel KV / Upstash:', err);
  }
  return null;
}

async function saveToVercelKV(data: DatabaseSchema): Promise<boolean> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  try {
    const res = await fetch(`${url}/set/fawnic_database_prod`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(data)),
    });
    return res.ok;
  } catch (err) {
    console.error('[Storage] Error saving to Vercel KV / Upstash:', err);
    return false;
  }
}

async function loadFromJSONBin(): Promise<DatabaseSchema | null> {
  const binId = process.env.JSONBIN_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY || process.env.JSONBIN_MASTER_KEY || process.env.JSONBIN_ACCESS_KEY;
  if (!binId || !apiKey) return null;

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': apiKey },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    if (json && json.record && json.record.users && json.record.products) {
      return json.record;
    }
  } catch (err) {
    console.error('[Storage] Error loading from JSONBin:', err);
  }
  return null;
}

async function saveToJSONBin(data: DatabaseSchema): Promise<boolean> {
  const binId = process.env.JSONBIN_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY || process.env.JSONBIN_MASTER_KEY || process.env.JSONBIN_ACCESS_KEY;
  if (!binId || !apiKey) return false;

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
      },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.error('[Storage] Error saving to JSONBin:', err);
    return false;
  }
}

async function loadFromSupabase(): Promise<DatabaseSchema | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/fawnic_store?id=eq.main&select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as any;
    if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
      const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
      if (data && data.users && data.products) return data;
    }
  } catch (err) {
    console.error('[Storage] Error loading from Supabase:', err);
  }
  return null;
}

async function saveToSupabase(data: DatabaseSchema): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return false;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/fawnic_store`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ id: 'main', data, updated_at: new Date().toISOString() }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Storage] Error saving to Supabase:', err);
    return false;
  }
}

async function loadFromCustomStorage(): Promise<DatabaseSchema | null> {
  const url = process.env.STORAGE_API_URL || process.env.REMOTE_DB_URL;
  if (!url) return null;
  const key = process.env.STORAGE_API_KEY || process.env.REMOTE_DB_KEY;

  try {
    const headers: Record<string, string> = {};
    if (key) headers['Authorization'] = `Bearer ${key}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const data = json.data || json;
    if (data && data.users && data.products) return data;
  } catch (err) {
    console.error('[Storage] Error loading from Custom Storage:', err);
  }
  return null;
}

async function saveToCustomStorage(data: DatabaseSchema): Promise<boolean> {
  const url = process.env.STORAGE_API_URL || process.env.REMOTE_DB_URL;
  if (!url) return false;
  const key = process.env.STORAGE_API_KEY || process.env.REMOTE_DB_KEY;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers['Authorization'] = `Bearer ${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.error('[Storage] Error saving to Custom Storage:', err);
    return false;
  }
}

async function loadFromRemoteStorage(): Promise<DatabaseSchema | null> {
  if (isNeonConfigured()) {
    try {
      const neonData = await loadSchemaFromNeon();
      if (neonData && neonData.users && neonData.products) {
        return neonData;
      }
    } catch (err: any) {
      console.warn('[Neon Storage] Could not load schema from Neon, checking other fallbacks:', err.message);
    }
  }

  return (
    (await loadFromVercelKV()) ||
    (await loadFromJSONBin()) ||
    (await loadFromSupabase()) ||
    (await loadFromCustomStorage())
  );
}

async function saveToRemoteStorage(data: DatabaseSchema): Promise<void> {
  const isNeon = isNeonConfigured();
  const isVercelKV = Boolean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
  const isJSONBin = Boolean(process.env.JSONBIN_BIN_ID);
  const isSupabase = Boolean(process.env.SUPABASE_URL);
  const isCustom = Boolean(process.env.STORAGE_API_URL || process.env.REMOTE_DB_URL);

  if (isNeon) await syncSchemaToNeon(data);
  if (isVercelKV) await saveToVercelKV(data);
  if (isJSONBin) await saveToJSONBin(data);
  if (isSupabase) await saveToSupabase(data);
  if (isCustom) await saveToCustomStorage(data);
}

let lastRemoteSyncTimestamp = 0;
const REMOTE_SYNC_COOLDOWN_MS = 2000;

export async function syncDatabaseFromRemote(): Promise<void> {
  const isRemoteConfigured = Boolean(
    isNeonConfigured() ||
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.JSONBIN_BIN_ID ||
    process.env.SUPABASE_URL ||
    process.env.STORAGE_API_URL ||
    process.env.REMOTE_DB_URL
  );

  if (!isRemoteConfigured) return;

  const now = Date.now();
  if (now - lastRemoteSyncTimestamp < REMOTE_SYNC_COOLDOWN_MS) {
    return;
  }
  lastRemoteSyncTimestamp = now;

  try {
    let neonProducts: Product[] | null = null;
    let neonCategories: Category[] | null = null;
    let neonOrders: Order[] | null = null;
    let neonNotifications: NotificationRecord[] | null = null;
    let neonCoupons: Coupon[] | null = null;
    let neonQueries: CustomerQuery[] | null = null;
    let neonInvoices: InvoiceRecord[] | null = null;

    // If Neon is configured, sync directly from authoritative relational tables
    if (isNeonConfigured()) {
      try {
        neonProducts = await getProductsFromNeon();
        neonCategories = await getCategoriesFromNeon();
        neonOrders = await getOrdersFromNeon();
        neonNotifications = await getNotificationsFromNeon();
        neonCoupons = await getCouponsFromNeon();
        neonQueries = await getCustomerQueriesFromNeon();
        neonInvoices = await getInvoicesFromNeon();

        if (!db) db = loadDatabase();
        if (Array.isArray(neonProducts)) db.products = neonProducts;
        if (Array.isArray(neonCategories)) db.categories = neonCategories;
        if (Array.isArray(neonOrders)) db.orders = neonOrders;
        if (Array.isArray(neonNotifications)) db.notifications = neonNotifications;
        if (Array.isArray(neonCoupons)) db.coupons = neonCoupons;
        if (Array.isArray(neonQueries)) db.queries = neonQueries;
        if (Array.isArray(neonInvoices)) db.invoices = neonInvoices;
      } catch (err: any) {
        console.warn('[Neon Sync] Direct table fetch note:', err.message);
      }
    }

    const remote = await loadFromRemoteStorage();
    if (remote && remote.users) {
      // Preserve admin credentials
      const admin = remote.users.find(
        (u: any) => u.email && u.email.toLowerCase() === 'alichishtia111@gmail.com'
      );
      if (admin) {
        admin.passwordHash = 'cbb3d466de30abaa2a9eea4b4503394626e8f98b65255c1bf6d0f27f1dda9237c92bdc71826328ec229be293012fea5c86f4c982f56066148a5dc11601529048';
        admin.salt = 'e57fbb13aefd72c43f4792a061c43a37';
        admin.role = 'admin';
      }

      // If Neon is configured, relational tables are the absolute source of truth
      if (isNeonConfigured()) {
        if (Array.isArray(neonProducts)) remote.products = neonProducts;
        if (Array.isArray(neonCategories)) remote.categories = neonCategories;
        if (Array.isArray(neonOrders)) remote.orders = neonOrders;
        if (Array.isArray(neonNotifications)) remote.notifications = neonNotifications;
        if (Array.isArray(neonCoupons)) remote.coupons = neonCoupons;
        if (Array.isArray(neonQueries)) remote.queries = neonQueries;
        if (Array.isArray(neonInvoices)) remote.invoices = neonInvoices;
      } else if ((!remote.products || remote.products.length === 0) && (db?.products && db.products.length > 0)) {
        remote.products = db.products;
      }

      const currentVer = db?._version || 0;
      const remoteVer = remote._version || 0;

      if (!db || remoteVer >= currentVer) {
        db = remote;
        // Never allow a stale bundle to overwrite Neon relational tables
        if (isNeonConfigured()) {
          if (Array.isArray(neonProducts)) db.products = neonProducts;
          if (Array.isArray(neonCategories)) db.categories = neonCategories;
          if (Array.isArray(neonOrders)) db.orders = neonOrders;
          if (Array.isArray(neonNotifications)) db.notifications = neonNotifications;
          if (Array.isArray(neonCoupons)) db.coupons = neonCoupons;
          if (Array.isArray(neonQueries)) db.queries = neonQueries;
          if (Array.isArray(neonInvoices)) db.invoices = neonInvoices;
        }
        const targetFile = getDatabaseFilePath();
        try {
          fs.writeFileSync(targetFile, JSON.stringify(db, null, 2), 'utf-8');
        } catch {}
      }
    }
  } catch (err) {
    // Non-fatal remote sync fallback
  }
}

export function getDb(): DatabaseSchema {
  if (!db) {
    db = loadDatabase();
  }
  return db;
}
