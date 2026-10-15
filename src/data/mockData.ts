import { Product, Category, Review } from '../types';

export const LOGO_URL = "/zenmart-logo.svg";

export const SPOTLIGHT_PRODUCT: Product = {
  id: "spotlight-lamp",
  name: "Minimalist Magnetic Desk Lamp",
  category: "Desk Setups",
  subCategory: "Ambient Lights",
  brandTag: "Workspace Pro",
  price: 2450,
  originalPrice: 3200,
  rating: 4.9,
  reviewsCount: 240,
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC96IcUllXRJ_etoe45xIxiZuWT2LAOQPlkgFbtmrusMbUlNyEU88E87mC6t6w-YdhvPbhmZgD9AijePARrNoUA-27CbZDAvlAESQZslAjf5zGHsXexUj73oOjRi5iHTb7o1Mp2ckWuNZ4GbMVjggmbonetSdP7vF1zvzfDImqzylNzFpeFxsQm_enTZBixa_uEhwXRSSBWBJYHwrXqnll6nzM-2U5c63i107mQAXYtb1VEqPNKATq6",
  badge: {
    text: "TODAY'S EXCLUSIVE DROP",
    type: "bestseller",
  },
  discountPercent: 23,
  inStock: true,
  stockCount: 18,
  description: "Asymmetric Optical Design with zero screen glare, magnetic 360° pivot mount, touch stepless dimming, and warm-to-cool CCT control. Built for long night work sessions in Bangladesh.",
  features: [
    "Asymmetric optical projection - zero reflection on monitor",
    "Magnetic ball joint - smoothly rotate to angle light anywhere",
    "Stepless touch brightness & 3 color temperatures (3000K-6000K)",
    "Type-C USB powered with 2400mAh backup battery",
    "Official 1-Year Replacement Warranty in Bangladesh"
  ],
  specs: {
    "Color": "Matte Space Gray",
    "Battery": "2400mAh Li-ion (Up to 8h runtime)",
    "Power Input": "Type-C 5V / 2A",
    "Color Temp": "3000K - 6000K Stepless",
    "Mounting": "Strong 3M Magnetic Base"
  }
};

export const CATEGORIES: Category[] = [
  {
    id: "electronics",
    name: "Electronics",
    countText: "24+ Verified Items",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBy5F9dzBRUvCPPsodcaxnm7ub6azL6LYtJwHFXqNXghtZY_8B-OpJULuuPGyG6Z_DqfdStQQVnVMsvop_aB8BREVvePn_B4TtlUTJBQY6kLAg14hQytuXDhZ50euV682ui9l47vfpHgvuwLUAQj38zgavi9G3Jd225gW70_PGxIS1pdi3RSj7RTaSnjgTd_l5y2fKtZTcVHCHXilcbF6rQ5A6Q-aBPpV_sXUfHmXllgPllgHq9dVuz",
    filterKey: "electronics"
  },
  {
    id: "smart-gadgets",
    name: "Smart Gadgets",
    countText: "38+ Smart Devices",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBThQrvI3MVRqkIiz4oq2cAh9fw2cOuOwGuhzd4bf0MzEHmnQ-EUqjmLGTpagBJedzSJVhSuHyBfYSUwNM0xRDKPhncKSbAbXjRnAAHjbf2tLIbMNUDX9yWwl9-E2adXijm2QASZUgCWcJ31QToZ0SjadsALgx9pr7Ry7HKMudXfJ3cAQjMTCRzxl8dVgdNX9f8HDvA9HLIzO8DUxuUzDTqVqbYnwNNK0503JhvbUM6NCtMaR6cTNaJ",
    filterKey: "smart-gadgets"
  },
  {
    id: "home-decor",
    name: "Home & Decor",
    countText: "19+ Nordic Items",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdCI6-5JbiuE86_6TjwsqFlIfcBHmxlHXHO_4-mw8eotOo5bBeon30-vRpqtFGeHdZVpdl7F7a0oaG1mmmndBDx8Hw1Mh5YdqNj4SikCL07shCIRQ3CO6_aGqi6lw5NER93vaIDB-TaIQPjs31Wik02SP5GjZ8JhfNZePNsUgk9PjO8owa_zdWGpSytWwXcxWezU5cFSmAj5cANdN4Vr8DkgWsVKJDgnzDxOp6FLQA8xP7V71W107O",
    filterKey: "home-decor"
  },
  {
    id: "mobile-accessories",
    name: "Mobile Accessories",
    countText: "42+ Premium Essentials",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQ55lnlWPB6gI-17HYtHtnTIvGyUln_heYaUuGhWCsO7pMDVzjyre1Ndgpl5sS6uB72vHIGq5e9lDYLHOaYc-EkJUXlMh4lxFJ2Pj6lxuKJKuSOrzzvWCKkdb7dkTL-Vwg3FwfWkkAdgaruAG9gSDyzixOy19wshQc_4CIUZ1uMq9x4e8D-YWZ5AHKz5F64MKUYgxe98vXEa-pKKKmRrnapwO3Qj3_Aq6ACHHahdtDGR15eJkW6AST",
    filterKey: "mobile-accessories"
  },
  {
    id: "audio-sound",
    name: "Audio & Sound",
    countText: "15+ Hi-Fi Models",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAo3gsTIeOFu5K7-k_p4Vxdxchv0I0ur1lVhZcSxWznF_O7v0usa48zIh1H328aioZaXajrn-7JBfbRUc8ISXonSr8kLSo_RK_fGiM8hlFPNYwN2R4qOvEQJi5vUpiW6MmAxF_OIIlVX1fObez3SS0TplDEeqRehVAx89fDg0aGcTD_awT6n84MORM-BGonuBn8nWdS1ApGYqBzHpbLbm3fVLlVQ1O22WOGxzHH26-Iks1bo_beVQDo",
    filterKey: "audio-sound"
  },
  {
    id: "kitchen-essentials",
    name: "Kitchen Essentials",
    countText: "12+ Smart Appliances",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvra6uRGvlveFB99MnW_u0XvJ5ZPux-v5Ux5D3TG2skqE5UNBYLwNIB2LPFtFjKWUjeBzTQFvtIKURbFcmHvjSUD9rxVUIDN9KYKwa1Ti1069_Pk5WlY4vBWDBGxJ0DFlgQTThvseJ1OYah8eiRKDQ2Av3aNJA8c-CIQUFTShLf7MmLHNzkZeLkHmebXn-2tbil8fIam8AWdLpudApC1mc8MVhBSOiHFKpyzaNermHDJIU0WIQKOkQ",
    filterKey: "kitchen-essentials"
  },
  {
    id: "office-lifestyle",
    name: "Office & Lifestyle",
    countText: "27+ Ergonomic Items",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIcXzPloAOkoPgkoPx98SLXDV4jiTM8aeix4Nax7XSHpbe7Vw6ALAtAA_6sazzE_mbpC2JdCsClcZ6juXtmpNjq5isdbZQl3f_HlIeOtzxBQqzYqq5THj2zOfGEMur2asSym3Uy5BvmVotAXxASXQIVkYg4WK_3mDISVuzj11MnwDeyPqHaxpqK3RJqzTCdW2rylJbqcoIMPpxkREgcpo5ntomN26l1Kgu9KsiScpUk0PRQP_u9Lfd",
    filterKey: "desk-setups"
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    countText: "Just Landed in BD",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgWm0g5LqsfyFBmtp2ZevQlUYvVZPhjo7CIsElwCpN7ehVbLINvltO7MGWV-4tkb5C2dBwwfIX1qircLpdC5mz7rCkSD5CkwMQO4eviBON1k9SE96Wu_3x-1WOnsLrHSNY6S0IOWvAVDGV0hQRkB43Mu5WBjkxk8yaDR4m-nVX-6ca53ZhNo200gASLqbMBoERFmUgLKp6uy0Z2EC-g4Iyvm-sbRoN35pxFA1_90a1Rztk5Z1T80R_",
    isNew: true,
    filterKey: "ambient-lights"
  }
];

export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "TWS Earbuds Pro Edition",
    category: "audio-sound",
    subCategory: "smart-gadgets",
    brandTag: "Audio Pro",
    price: 1590,
    originalPrice: 1990,
    rating: 4.8,
    reviewsCount: 120,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQ4lyElh-WbhtPVci4VIGZAo9rWLdkH6T_jNfjSR1Gbp8jDMPR-pqnotCeAF2MrChslV_fNd-2DdoUyaluy1KlcnsKGr9kazSuAON57n9PXQerrSrNZDpr1eVyzqHYg-Sq2tBR34J9TyCpynMbPvR6JqiSqqAbRJxsTlbOyhkMYF53SniDSvHYackVqWJLFFVAvnKkgmdpNq-Ahuu5kcGVl9HXikir85dNd24OuOY7D-dsUSmlR_6n",
    badge: {
      text: "BEST SELLER",
      type: "bestseller"
    },
    discountPercent: 20,
    inStock: true,
    stockCount: 42,
    description: "Active Noise Cancellation, deep bass resonance, 32-hour playback battery life with pocket charging case, and dual ENC microphone for crystal-clear calls in busy traffic.",
    features: [
      "Hybrid Active Noise Cancellation up to 35dB",
      "Low latency gaming mode (45ms)",
      "Touch gesture controls & Voice Assistant support",
      "IPX5 sweat and splash resistance for monsoon weather",
      "6 Months Replacement Warranty"
    ],
    specs: {
      "Driver": "10mm Titanium Diaphragm",
      "Battery Life": "8h (earbuds) + 24h (case)",
      "Bluetooth": "Version 5.3",
      "Charging": "Type-C Fast Charge (10m = 2h)"
    }
  },
  {
    id: "prod-2",
    name: "Smart Watch Series 8",
    category: "smart-gadgets",
    subCategory: "electronics",
    brandTag: "Smart Wear",
    price: 2990,
    originalPrice: 3500,
    rating: 4.7,
    reviewsCount: 85,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyAkSX0IAXdxrslX3eEf-6uhMFH5lRvoPr2HNU5kPNDCU8OG8sQFChHQn8Jf5Zr3AVUvy9iwc7HgMlB2D9_ttLKe-yRW0hVpKTywqZghR9WAvDK7pkoPsLi3D_qFk-mufye1vZgSAngktDCDISOlmHMeQoQ95YBtFgSqlGNDrFZA0gNdfNdINRNRDEljUzCMEuQtmCbo7xoDXcRpoXPOQTZxDM_fDCxXqmUmwdPec74OrtgZEdh6N9",
    badge: {
      text: "POPULAR",
      type: "popular"
    },
    discountPercent: 15,
    inStock: true,
    stockCount: 15,
    description: "Vivid 1.95-inch AMOLED color touch screen, real-time heart rate and SpO2 health tracking, Bluetooth calling with loud built-in speaker, and 100+ customizable watch faces.",
    features: [
      "Crisp Always-On AMOLED Display with 600 nits brightness",
      "Bluetooth Calling: dial, answer, and sync phone contacts",
      "Health Sensors: Heart rate, blood oxygen, sleep stage monitor",
      "Full Bangla language push notifications support",
      "Magnetic pin fast charger included"
    ],
    specs: {
      "Display": "1.95\" HD Curved Glass",
      "Battery": "300mAh (Up to 7 days normal use)",
      "Strap": "Interchangeable 22mm Liquid Silicone",
      "Compatibility": "Android 5.0+ and iOS 10.0+"
    }
  },
  {
    id: "prod-3",
    name: "LED Desk Lamp Touch Control",
    category: "desk-setups",
    subCategory: "ambient-lights",
    brandTag: "Desk Setup",
    price: 1190,
    rating: 4.8,
    reviewsCount: 64,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRy62XtB8py22IVpEJ4s_QTMAF3rV4QwSsTRG-kFwYFAElAZiMD7nUkudjdhMNDdnyHFAPDu91VO3eWBiKGXJRDORDUYO_WYWt_04m3fD7z6rxR3T2q4MTKeIt4wAvcbEUBev3aKv0xf-PjmsnqHPBpoET2mRYinGccQCFbW_qbnJwZE5W66IwIN4X9HPEnw413CWTtO1VIx4Pna2XflqWDYVoeKZXbGp-dSDfhoIkDUGN62Y5wO6k",
    badge: {
      text: "ESSENTIAL",
      type: "essential"
    },
    inStock: true,
    stockCount: 29,
    description: "Minimalist foldable LED desk lamp with smooth white aluminum arm, warm-to-cool touch dimming, and eye-friendly flicker-free emission. Ideal for study and remote work setups.",
    features: [
      "Multi-angle flexible folding design saves workspace",
      "Touch sensitive control slider with 5 brightness levels",
      "Flicker-free blue-light filter to prevent eye fatigue",
      "Built-in phone stand holder on base",
      "USB powered with low heat dissipation"
    ],
    specs: {
      "Power": "9W High Efficiency LED",
      "Material": "ABS + Aluminum Alloy",
      "Color Temperature": "3000K - 5500K",
      "Weight": "480g"
    }
  },
  {
    id: "prod-4",
    name: "Portable BT Speaker HD",
    category: "audio-sound",
    subCategory: "electronics",
    brandTag: "Audio & Sound",
    price: 1490,
    originalPrice: 1990,
    rating: 4.7,
    reviewsCount: 96,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHyTsQ5YSkboL03djGWw1584J8PRjbiqWXEi2aoffW53mr7TdAEgi9l1cD7ZEhHIwFm99oCi3N0hVPZ2TWGnd7bwttg0avjYSpWZKR3Ooe04oHxcy2gnflVc8qYZr4acI_9-G4cseJQQwSc_rqpb2MAB0L0U69vaJY7igjYRlMEntxqOuVdhsWf7n8TsZKtyvqTGxm2hokHJXV0JTzAo-j-ZjCYVPPqRMp5XZLq6GuLYkcWvUlj3ha",
    badge: {
      text: "FLASH DEAL",
      type: "flash"
    },
    discountPercent: 25,
    inStock: true,
    stockCount: 22,
    description: "Cylindrical outdoor portable waterproof bluetooth speaker in forest green finish with rugged tactile lanyard clip and punchy passive bass radiators.",
    features: [
      "True 360-degree omnidirectional audio projection",
      "IPX7 certified waterproof - can survive accidental spills",
      "TWS pairing: connect two speakers for real stereo sound",
      "Built-in microphone for hands-free calls",
      "Up to 14 hours of continuous playback"
    ],
    specs: {
      "Output": "12W Peak RMS",
      "Battery": "2000mAh Lithium Cell",
      "Weight": "360g",
      "Inputs": "Bluetooth 5.1, TF Card, AUX 3.5mm"
    }
  },
  {
    id: "prod-5",
    name: "Floating Plant Pot Bonsai",
    category: "home-decor",
    subCategory: "ambient-lights",
    brandTag: "Home Decor",
    price: 3250,
    originalPrice: 3950,
    rating: 4.6,
    reviewsCount: 42,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgSET7H7anXXx72YXTWgdaXPQkWrwg1aIrlO2v2iXLqMwsKiJPvhFG2zgTXUeXqBcbpljPc_FGD0u8obzA-tfqLog7VE2xeAitIpLiFnHJ6NCGaaDdqfDwMSc2YOzqyr0eivEO4ouENq5iIv8eBqzKo4-DwWYiCYx_V6SGIpcf0Xzvau3ISuoSfC2hk3KCIddvW_TZ58HCV5Zs-2UtC261U83ypiYEtYsTyUhx-wOru5aTGm2T_PDc",
    badge: {
      text: "AESTHETIC",
      type: "aesthetic"
    },
    discountPercent: 18,
    inStock: true,
    stockCount: 8,
    description: "Magnetic levitating geometric plant pot floating in midair with a slow serene rotation above a dark walnut finish base. A mesmerizing centerpiece for living rooms or executive desks.",
    features: [
      "Magnetic suspension technology keeps pot floating effortlessly",
      "360-degree automatic slow rotation to absorb sunlight evenly",
      "Holds miniature succulents, moss, bonsai, or air plants",
      "Whisper-quiet magnetic induction levitation mechanism",
      "Premium gift packaging with power adapter"
    ],
    specs: {
      "Levitation Distance": "12-15mm",
      "Base Material": "Walnut Grain Finished Resin",
      "Power Adapter": "12V 1A Included",
      "Max Plant Weight": "250 grams"
    }
  },
  {
    id: "prod-6",
    name: "WiFi Security Camera 360°",
    category: "smart-gadgets",
    subCategory: "electronics",
    brandTag: "Security & Smart",
    price: 2190,
    rating: 4.7,
    reviewsCount: 58,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGrR0qHGrce5EfkvUXD9AV1D28eIMI0o1zX4jfhHzu1QWwUv0eFfu3YmX5XRtobB0k9DLUaVwvZyOZardNeMSzgLk-emBRhTIkoA8gjFZ4MmrCi1t374aMnmwr3jzRbhpAQwuutH4LXZ0VrzAIfFrNixGJC8RPFWmDITGE3_h9aSw8lDJZRkbxca5a4-7vfMxSAsJdmXFEVcu94ufzDhGfL6X483m9SslZpkbkwU-ugRcepGnuDvIz",
    badge: {
      text: "SMART HOME",
      type: "smart"
    },
    inStock: true,
    stockCount: 31,
    description: "Modern indoor 360 pan-tilt smart WiFi security camera with full 2K resolution, infrared night vision, two-way intercom audio, and instant AI motion alert to your smartphone.",
    features: [
      "2K Super HD clarity with panoramic 360° horizontal coverage",
      "Color Night Vision with infrared LEDs for pitch dark rooms",
      "Two-way high quality audio talk back from mobile app",
      "AI human detection reduces false alarms from pets",
      "MicroSD card support up to 128GB + Cloud backup option"
    ],
    specs: {
      "Resolution": "2304 x 1296 (3MP 2K)",
      "App": "Tuya / Smart Life compatible (iOS & Android)",
      "Storage": "TF Card Slot + Encrypted Cloud",
      "Connectivity": "2.4GHz Wi-Fi"
    }
  },
  // Additional products to populate categories and search
  {
    id: "prod-7",
    name: "MagSafe 3-in-1 Fast Wireless Station",
    category: "mobile-accessories",
    subCategory: "desk-setups",
    brandTag: "PowerTech",
    price: 2650,
    originalPrice: 3200,
    rating: 4.9,
    reviewsCount: 77,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQ55lnlWPB6gI-17HYtHtnTIvGyUln_heYaUuGhWCsO7pMDVzjyre1Ndgpl5sS6uB72vHIGq5e9lDYLHOaYc-EkJUXlMh4lxFJ2Pj6lxuKJKuSOrzzvWCKkdb7dkTL-Vwg3FwfWkkAdgaruAG9gSDyzixOy19wshQc_4CIUZ1uMq9x4e8D-YWZ5AHKz5F64MKUYgxe98vXEa-pKKKmRrnapwO3Qj3_Aq6ACHHahdtDGR15eJkW6AST",
    badge: {
      text: "BEST SELLER",
      type: "bestseller"
    },
    discountPercent: 17,
    inStock: true,
    stockCount: 19,
    description: "Charge your iPhone, Apple Watch, and AirPods simultaneously on a single streamlined anodized aluminum dock with weighted non-slip silicone base.",
    features: [
      "15W MagSafe fast magnetic alignment",
      "Strong neodymium magnets hold phone in vertical or horizontal orientation",
      "Over-temperature and surge protection certified",
      "Includes 20W PD power adapter and braided cable"
    ],
    specs: {
      "Input": "9V/3A, 12V/2.5A",
      "Output": "Phone 15W, Watch 3W, Buds 5W",
      "Material": "Aviation Aluminum + Silicone"
    }
  },
  {
    id: "prod-8",
    name: "Levitating Moon Lamp 3D Touch",
    category: "ambient-lights",
    subCategory: "home-decor",
    brandTag: "ZenHome",
    price: 3600,
    originalPrice: 4500,
    rating: 4.8,
    reviewsCount: 38,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgWm0g5LqsfyFBmtp2ZevQlUYvVZPhjo7CIsElwCpN7ehVbLINvltO7MGWV-4tkb5C2dBwwfIX1qircLpdC5mz7rCkSD5CkwMQO4eviBON1k9SE96Wu_3x-1WOnsLrHSNY6S0IOWvAVDGV0hQRkB43Mu5WBjkxk8yaDR4m-nVX-6ca53ZhNo200gASLqbMBoERFmUgLKp6uy0Z2EC-g4Iyvm-sbRoN35pxFA1_90a1Rztk5Z1T80R_",
    badge: {
      text: "NEW",
      type: "aesthetic"
    },
    discountPercent: 20,
    inStock: true,
    stockCount: 12,
    isNew: true,
    description: "Suspended magnetic levitation moon lamp 3D printed with NASA satellite topography. Rotates gently in dark rooms with warm amber and cool white touch illumination.",
    features: [
      "Ultra-realistic crater details created from lunar satellite scans",
      "Wireless power transmission - no cables touching the sphere",
      "3 lighting modes: warm golden, neutral daylight, cold white",
      "Dark walnut textured pedestal with hidden induction coil"
    ],
    specs: {
      "Diameter": "14cm Sphere",
      "Base Dimension": "13 x 13 x 3 cm",
      "Power": "12V 1.5A adapter"
    }
  }
];

export const INITIAL_CART_ITEMS = [
  {
    product: PRODUCTS[0], // TWS Earbuds ৳1,590
    quantity: 1
  },
  {
    product: PRODUCTS[2], // LED Desk Lamp ৳1,190
    quantity: 1
  }
];

export const REVIEWS: Review[] = [
  {
    id: "rev-1",
    author: "Tanvir Rahman",
    location: "Dhaka",
    verified: true,
    rating: 5,
    comment: "“Product quality is exceptional and delivery was lightning fast. Got the magnetic desk lamp within 24 hours in Dhanmondi. Tested and works like an absolute dream!”",
    avatarInitials: "TR",
    productName: "Minimalist Magnetic Desk Lamp"
  },
  {
    id: "rev-2",
    author: "Nusrat Jahan",
    location: "Chittagong",
    verified: true,
    rating: 5,
    comment: "“Amazing service! The packaging had multiple layers of air bubble protection and the Nordic donut ceramic vase was flawless. Exactly as shown on the website.”",
    avatarInitials: "NJ",
    productName: "Nordic Hollow Ceramic Vase"
  },
  {
    id: "rev-3",
    author: "Rafiul Islam",
    location: "Sylhet",
    verified: true,
    rating: 5,
    comment: "“Most reliable tech store in Bangladesh. I had questions regarding the smartwatch Bluetooth pairing, and their WhatsApp support replied in minutes to guide me.”",
    avatarInitials: "RI",
    productName: "Smart Watch Series 8"
  },
  {
    id: "rev-4",
    author: "Mahmud Hasan",
    location: "Rajshahi",
    verified: true,
    rating: 5,
    comment: "“Cash on delivery service was super smooth through Pathao courier. Opened and checked before paying cash. ZenMart BD is definitely my go-to gadget hub now.”",
    avatarInitials: "MH",
    productName: "WiFi Security Camera 360°"
  }
];

export const BANGLADESH_DISTRICTS = [
  "Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur",
  "Mymensingh", "Gazipur", "Narayanganj", "Comilla", "Bogra", "Cox's Bazar",
  "Jessore", "Dinajpur", "Tangail", "Faridpur", "Feni", "Kushtia", "Pabna"
];
