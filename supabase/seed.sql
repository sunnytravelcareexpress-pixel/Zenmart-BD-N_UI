-- ==============================================================================
-- ZENMART BD: COMPLETE SEED DATA FOR BANGLADESH E-COMMERCE
-- Includes: Categories, 20 Realistic Gadgets & Nordic Home Decor, Coupons, Reviews
-- All prices in BDT (৳)
-- ==============================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order)
VALUES
('c0000000-0000-0000-0000-000000000001', 'Electronics', 'electronics', 'Fast multiport chargers, noise cancelling gear, adapters', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy5F9dzBRUvCPPsodcaxnm7ub6azL6LYtJwHFXqNXghtZY_8B-OpJULuuPGyG6Z_DqfdStQQVnVMsvop_aB8BREVvePn_B4TtlUTJBQY6kLAg14hQytuXDhZ50euV682ui9l47vfpHgvuwLUAQj38zgavi9G3Jd225gW70_PGxIS1pdi3RSj7RTaSnjgTd_l5y2fKtZTcVHCHXilcbF6rQ5A6Q-aBPpV_sXUfHmXllgPllgHq9dVuz', 1),
('c0000000-0000-0000-0000-000000000002', 'Smart Gadgets', 'smart-gadgets', 'Smart wearables, health tracking rings, smart home hub', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBThQrvI3MVRqkIiz4oq2cAh9fw2cOuOwGuhzd4bf0MzEHmnQ-EUqjmLGTpagBJedzSJVhSuHyBfYSUwNM0xRDKPhncKSbAbXjRnAAHjbf2tLIbMNUDX9yWwl9-E2adXijm2QASZUgCWcJ31QToZ0SjadsALgx9pr7Ry7HKMudXfJ3cAQjMTCRzxl8dVgdNX9f8HDvA9HLIzO8DUxuUzDTqVqbYnwNNK0503JhvbUM6NCtMaR6cTNaJ', 2),
('c0000000-0000-0000-0000-000000000003', 'Home & Decor', 'home-decor', 'Nordic ceramic hollow vases, minimalist sculptures', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdCI6-5JbiuE86_6TjwsqFlIfcBHmxlHXHO_4-mw8eotOo5bBeon30-vRpqtFGeHdZVpdl7F7a0oaG1mmmndBDx8Hw1Mh5YdqNj4SikCL07shCIRQ3CO6_aGqi6lw5NER93vaIDB-TaIQPjs31Wik02SP5GjZ8JhfNZePNsUgk9PjO8owa_zdWGpSytWwXcxWezU5cFSmAj5cANdN4Vr8DkgWsVKJDgnzDxOp6FLQA8xP7V71W107O', 3),
('c0000000-0000-0000-0000-000000000004', 'Mobile Accessories', 'mobile-accessories', '3-in-1 MagSafe fast stands, Kevlar braided cables', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ55lnlWPB6gI-17HYtHtnTIvGyUln_heYaUuGhWCsO7pMDVzjyre1Ndgpl5sS6uB72vHIGq5e9lDYLHOaYc-EkJUXlMh4lxFJ2Pj6lxuKJKuSOrzzvWCKkdb7dkTL-Vwg3FwfWkkAdgaruAG9gSDyzixOy19wshQc_4CIUZ1uMq9x4e8D-YWZ5AHKz5F64MKUYgxe98vXEa-pKKKmRrnapwO3Qj3_Aq6ACHHahdtDGR15eJkW6AST', 4),
('c0000000-0000-0000-0000-000000000005', 'Audio & Sound', 'audio-sound', 'Hi-Fi waterproof portable speakers, studio monitors', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo3gsTIeOFu5K7-k_p4Vxdxchv0I0ur1lVhZcSxWznF_O7v0usa48zIh1H328aioZaXajrn-7JBfbRUc8ISXonSr8kLSo_RK_fGiM8hlFPNYwN2R4qOvEQJi5vUpiW6MmAxF_OIIlVX1fObez3SS0TplDEeqRehVAx89fDg0aGcTD_awT6n84MORM-BGonuBn8nWdS1ApGYqBzHpbLbm3fVLlVQ1O22WOGxzHH26-Iks1bo_beVQDo', 5),
('c0000000-0000-0000-0000-000000000006', 'Kitchen Essentials', 'kitchen-essentials', 'Smart digital temperature kettles, coffee grinders', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvra6uRGvlveFB99MnW_u0XvJ5ZPux-v5Ux5D3TG2skqE5UNBYLwNIB2LPFtFjKWUjeBzTQFvtIKURbFcmHvjSUD9rxVUIDN9KYKwa1Ti1069_Pk5WlY4vBWDBGxJ0DFlgQTThvseJ1OYah8eiRKDQ2Av3aNJA8c-CIQUFTShLf7MmLHNzkZeLkHmebXn-2tbil8fIam8AWdLpudApC1mc8MVhBSOiHFKpyzaNermHDJIU0WIQKOkQ', 6),
('c0000000-0000-0000-0000-000000000007', 'Office & Lifestyle', 'office-lifestyle', 'Aluminum laptop risers, vegan leather desk pads', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIcXzPloAOkoPgkoPx98SLXDV4jiTM8aeix4Nax7XSHpbe7Vw6ALAtAA_6sazzE_mbpC2JdCsClcZ6juXtmpNjq5isdbZQl3f_HlIeOtzxBQqzYqq5THj2zOfGEMur2asSym3Uy5BvmVotAXxASXQIVkYg4WK_3mDISVuzj11MnwDeyPqHaxpqK3RJqzTCdW2rylJbqcoIMPpxkREgcpo5ntomN26l1Kgu9KsiScpUk0PRQP_u9Lfd', 7),
('c0000000-0000-0000-0000-000000000008', 'New Arrivals', 'new-arrivals', 'Suspended magnetic levitation gadgets, kinetic art', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgWm0g5LqsfyFBmtp2ZevQlUYvVZPhjo7CIsElwCpN7ehVbLINvltO7MGWV-4tkb5C2dBwwfIX1qircLpdC5mz7rCkSD5CkwMQO4eviBON1k9SE96Wu_3x-1WOnsLrHSNY6S0IOWvAVDGV0hQRkB43Mu5WBjkxk8yaDR4m-nVX-6ca53ZhNo200gASLqbMBoERFmUgLKp6uy0Z2EC-g4Iyvm-sbRoN35pxFA1_90a1Rztk5Z1T80R_', 8)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    image_url = EXCLUDED.image_url;

-- 2. SEED 20 PRODUCTS (BDT ৳)
INSERT INTO public.products
(id, category_id, name, slug, brand, sku, price, compare_price, discount_percentage, stock_quantity, low_stock_threshold, rating, review_count, is_featured, is_best_seller, is_new, is_active, description, short_description)
VALUES
-- 1. Spotlight Product
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'Minimalist Magnetic Desk Lamp', 'minimalist-magnetic-desk-lamp', 'Workspace Pro', 'ZMB-LMP-01', 2450, 3200, 23, 18, 5, 4.9, 240, true, true, false, true,
 'Asymmetric Optical Design with zero screen glare, magnetic 360° pivot mount, touch stepless dimming, and warm-to-cool CCT control. Built for long night work sessions in Bangladesh with 2400mAh backup battery.',
 'Asymmetric Optical Design • Zero Screen Glare'),

-- 2. TWS Earbuds
('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'TWS Earbuds Pro Edition', 'tws-earbuds-pro-edition', 'Audio Pro', 'ZMB-AUD-02', 1590, 1990, 20, 42, 5, 4.8, 120, true, true, false, true,
 'Active Noise Cancellation, deep bass resonance, 32-hour playback battery life with pocket charging case, and dual ENC microphone for crystal-clear calls in busy traffic.',
 'ANC Active Noise Cancelling • 32h Battery Life'),

-- 3. Smart Watch Series 8
('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Smart Watch Series 8', 'smart-watch-series-8', 'Smart Wear', 'ZMB-WCH-03', 2990, 3500, 15, 15, 5, 4.7, 85, true, true, false, true,
 'Vivid 1.95-inch AMOLED color touch screen, real-time heart rate and SpO2 health tracking, Bluetooth calling with loud built-in speaker, and 100+ customizable watch faces with Bangla font support.',
 'AMOLED Curved Display • Bluetooth Calling BD'),

-- 4. LED Desk Lamp Touch Control
('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007', 'LED Desk Lamp Touch Control', 'led-desk-lamp-touch-control', 'Desk Setup', 'ZMB-LMP-04', 1190, 1490, 20, 29, 5, 4.8, 64, true, false, false, true,
 'Minimalist foldable LED desk lamp with smooth white aluminum arm, warm-to-cool touch dimming, and eye-friendly flicker-free emission. Ideal for study and remote work setups.',
 'Foldable Arm • 5 Brightness Levels'),

-- 5. Portable BT Speaker HD
('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'Portable BT Speaker HD', 'portable-bt-speaker-hd', 'Audio & Sound', 'ZMB-SPK-05', 1490, 1990, 25, 22, 5, 4.7, 96, true, true, false, true,
 'Cylindrical outdoor portable waterproof bluetooth speaker in forest green finish with rugged tactile lanyard clip and punchy passive bass radiators.',
 'IPX7 Waterproof • Deep Bass Sound'),

-- 6. Floating Plant Pot Bonsai
('a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'Floating Plant Pot Bonsai', 'floating-plant-pot-bonsai', 'Home Decor', 'ZMB-DEC-06', 3250, 3950, 18, 8, 3, 4.6, 42, true, true, false, true,
 'Magnetic levitating geometric plant pot floating in midair with a slow serene rotation above a dark walnut finish base. A mesmerizing centerpiece for living rooms or executive desks.',
 'Magnetic Levitation • 360° Slow Rotation'),

-- 7. WiFi Security Camera 360°
('a0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'WiFi Security Camera 360°', 'wifi-security-camera-360', 'Security & Smart', 'ZMB-CAM-07', 2190, 2690, 18, 31, 5, 4.7, 58, true, true, false, true,
 'Modern indoor 360 pan-tilt smart WiFi security camera with full 2K resolution, infrared night vision, two-way intercom audio, and instant AI motion alert to your smartphone.',
 '2K Resolution • AI Motion Tracking'),

-- 8. MagSafe 3-in-1 Fast Wireless Station
('a0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', 'MagSafe 3-in-1 Fast Wireless Station', 'magsafe-3-in-1-fast-wireless-station', 'PowerTech', 'ZMB-CHG-08', 2650, 3200, 17, 19, 5, 4.9, 77, true, true, false, true,
 'Charge your iPhone, Apple Watch, and AirPods simultaneously on a single streamlined anodized aluminum dock with weighted non-slip silicone base.',
 '15W MagSafe Fast Alignment • Multi-Device'),

-- 9. Levitating Moon Lamp 3D Touch
('a0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000008', 'Levitating Moon Lamp 3D Touch', 'levitating-moon-lamp-3d-touch', 'ZenHome', 'ZMB-LMP-09', 3600, 4500, 20, 12, 3, 4.8, 38, true, false, true, true,
 'Suspended magnetic levitation moon lamp 3D printed with NASA satellite topography. Rotates gently in dark rooms with warm amber and cool white touch illumination.',
 '3D Printed Moon Surface • Magnetic Suspension'),

-- 10. Nordic Hollow Ceramic Donut Vase
('a0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000003', 'Nordic Hollow Ceramic Donut Vase', 'nordic-hollow-ceramic-donut-vase', 'ScandiLiving', 'ZMB-VAS-10', 1450, 1850, 21, 24, 5, 4.9, 52, false, true, false, true,
 'Matte sandstone ceramic donut centerpiece for dry pampas grass, minimalist dining tables, and bookshelf styling.',
 'Handcrafted Sandstone Matte Ceramic'),

-- 11. Anodized Aluminum Laptop Riser
('a0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000007', 'Anodized Aluminum Laptop Riser', 'anodized-aluminum-laptop-riser', 'Workspace Pro', 'ZMB-STN-11', 1850, 2300, 19, 35, 5, 4.8, 63, false, false, false, true,
 'Heavy-duty ergonomic laptop elevation stand crafted from 4mm aerospace-grade aluminum. Dissipates heat naturally and adjusts up to eye level.',
 'Ergonomic Neck Relief • Dual Axis Adjust'),

-- 12. Smart Constant Temp Electric Kettle
('a0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000006', 'Smart Constant Temp Electric Kettle', 'smart-constant-temp-electric-kettle', 'BrewCraft', 'ZMB-KTL-12', 2850, 3400, 16, 14, 4, 4.7, 33, false, false, false, true,
 'Digital gooseneck pouring kettle with 1-degree precision digital thermostat, OLED temperature display, and 60-minute warm keep function for pour-over coffee.',
 'Precision Gooseneck Spout • OLED Display'),

-- 13. 65W GaN Multiport Fast Charger
('a0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', '65W GaN Multiport Fast Charger', '65w-gan-multiport-fast-charger', 'PowerTech', 'ZMB-CHG-13', 1750, 2200, 20, 50, 8, 4.9, 114, false, true, false, true,
 'Compact Gallium Nitride (GaN 5) pocket wall charger with dual Type-C PD 65W + USB-A ports. Powers MacBook, iPad, and Galaxy / iPhone at maximum speed.',
 'Compact GaN Technology • 3 Simultaneous Ports'),

-- 14. Retro Mechanical Calculator & Numpad
('a0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000007', 'Retro Mechanical Calculator & Numpad', 'retro-mechanical-calculator-numpad', 'TypeCraft', 'ZMB-CAL-14', 1650, 2100, 21, 16, 4, 4.8, 29, false, false, true, true,
 'Dot-matrix typewriter tactile blue switches with mechanical clicking feedback and large LCD 12-digit display.',
 'Tactile Clicky Keys • Retro Aesthetic'),

-- 15. Smart Body Composition Scale
('a0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000002', 'Smart Body Composition Scale', 'smart-body-composition-scale', 'Smart Wear', 'ZMB-SCL-15', 1890, 2400, 21, 20, 5, 4.7, 48, false, false, false, true,
 'BIA high precision bio-impedance sensors calculating 14 essential body metrics including BMI, Body Fat %, Muscle Mass, and hydration syncing to Apple Health and Google Fit.',
 '14 Body Metrics • Bluetooth Health Sync'),

-- 16. Handheld Garment Steamer Pro
('a0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000006', 'Handheld Garment Steamer Pro', 'handheld-garment-steamer-pro', 'Home Comfort', 'ZMB-STM-16', 2250, 2800, 19, 17, 5, 4.6, 31, false, false, false, true,
 '1200W high-pressure continuous steam flow eliminates wrinkles from Panjabis, shirts, and curtains in seconds. 15-second instant heating.',
 '15s Rapid Heat • 99% Bacteria Sanitization'),

-- 17. Waterproof Leather Desk Mat (80x40cm)
('a0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000007', 'Waterproof Leather Desk Mat', 'waterproof-leather-desk-mat', 'ZenWorkspace', 'ZMB-MAT-17', 790, 1100, 28, 60, 10, 4.9, 142, false, true, false, true,
 'Dual-sided waterproof vegan PU leather pad protecting desks from scratches, coffee spills, and heat while providing smooth mouse glide.',
 '80x40cm Extended Size • Spill-proof Surface'),

-- 18. RGB Flowing Ambient Lightbar
('a0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'RGB Flowing Ambient Lightbar', 'rgb-flowing-ambient-lightbar', 'ZenGlow', 'ZMB-LGT-18', 1990, 2600, 23, 11, 4, 4.8, 67, true, false, true, true,
 'Music beat audio synchronizing 32-bit ARM microprocessor lightbar with 16 million colors and fluid lighting effects for gaming and streaming setups.',
 'Sound Reactive • 32 Built-in Color Modes'),

-- 19. USB-C 10-in-1 Aluminum Hub
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'USB-C 10-in-1 Aluminum Hub', 'usb-c-10-in-1-aluminum-hub', 'PowerTech', 'ZMB-HUB-19', 3150, 3900, 19, 15, 4, 4.8, 44, false, false, false, true,
 'Dual 4K HDMI ports, Gigabit Ethernet RJ45, 100W PD passthrough, SD/TF card reader, and high-speed USB 3.0 ports in heat-resistant space gray casing.',
 'Dual 4K HDMI • 100W Power Delivery'),

-- 20. Smart Wi-Fi Aroma Diffuser
('a0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000003', 'Smart Wi-Fi Aroma Diffuser', 'smart-wifi-aroma-diffuser', 'ScandiLiving', 'ZMB-DIF-20', 2150, 2700, 20, 23, 5, 4.7, 36, false, false, false, true,
 'Ultrasonic cool mist essential oil humidifier with ambient LED mood rings. Compatible with Alexa, Google Home, and Tuya Smart app timers.',
 'Ultrasonic Quiet Mist • App Scheduled')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    price = EXCLUDED.price,
    compare_price = EXCLUDED.compare_price,
    stock_quantity = EXCLUDED.stock_quantity;

-- 3. SEED PRODUCT IMAGES
INSERT INTO public.product_images (product_id, image_url, sort_order)
VALUES
('a0000000-0000-0000-0000-000000000001', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC96IcUllXRJ_etoe45xIxiZuWT2LAOQPlkgFbtmrusMbUlNyEU88E87mC6t6w-YdhvPbhmZgD9AijePARrNoUA-27CbZDAvlAESQZslAjf5zGHsXexUj73oOjRi5iHTb7o1Mp2ckWuNZ4GbMVjggmbonetSdP7vF1zvzfDImqzylNzFpeFxsQm_enTZBixa_uEhwXRSSBWBJYHwrXqnll6nzM-2U5c63i107mQAXYtb1VEqPNKATq6', 1),
('a0000000-0000-0000-0000-000000000002', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ4lyElh-WbhtPVci4VIGZAo9rWLdkH6T_jNfjSR1Gbp8jDMPR-pqnotCeAF2MrChslV_fNd-2DdoUyaluy1KlcnsKGr9kazSuAON57n9PXQerrSrNZDpr1eVyzqHYg-Sq2tBR34J9TyCpynMbPvR6JqiSqqAbRJxsTlbOyhkMYF53SniDSvHYackVqWJLFFVAvnKkgmdpNq-Ahuu5kcGVl9HXikir85dNd24OuOY7D-dsUSmlR_6n', 1),
('a0000000-0000-0000-0000-000000000003', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyAkSX0IAXdxrslX3eEf-6uhMFH5lRvoPr2HNU5kPNDCU8OG8sQFChHQn8Jf5Zr3AVUvy9iwc7HgMlB2D9_ttLKe-yRW0hVpKTywqZghR9WAvDK7pkoPsLi3D_qFk-mufye1vZgSAngktDCDISOlmHMeQoQ95YBtFgSqlGNDrFZA0gNdfNdINRNRDEljUzCMEuQtmCbo7xoDXcRpoXPOQTZxDM_fDCxXqmUmwdPec74OrtgZEdh6N9', 1),
('a0000000-0000-0000-0000-000000000004', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRy62XtB8py22IVpEJ4s_QTMAF3rV4QwSsTRG-kFwYFAElAZiMD7nUkudjdhMNDdnyHFAPDu91VO3eWBiKGXJRDORDUYO_WYWt_04m3fD7z6rxR3T2q4MTKeIt4wAvcbEUBev3aKv0xf-PjmsnqHPBpoET2mRYinGccQCFbW_qbnJwZE5W66IwIN4X9HPEnw413CWTtO1VIx4Pna2XflqWDYVoeKZXbGp-dSDfhoIkDUGN62Y5wO6k', 1),
('a0000000-0000-0000-0000-000000000005', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHyTsQ5YSkboL03djGWw1584J8PRjbiqWXEi2aoffW53mr7TdAEgi9l1cD7ZEhHIwFm99oCi3N0hVPZ2TWGnd7bwttg0avjYSpWZKR3Ooe04oHxcy2gnflVc8qYZr4acI_9-G4cseJQQwSc_rqpb2MAB0L0U69vaJY7igjYRlMEntxqOuVdhsWf7n8TsZKtyvqTGxm2hokHJXV0JTzAo-j-ZjCYVPPqRMp5XZLq6GuLYkcWvUlj3ha', 1),
('a0000000-0000-0000-0000-000000000006', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgSET7H7anXXx72YXTWgdaXPQkWrwg1aIrlO2v2iXLqMwsKiJPvhFG2zgTXUeXqBcbpljPc_FGD0u8obzA-tfqLog7VE2xeAitIpLiFnHJ6NCGaaDdqfDwMSc2YOzqyr0eivEO4ouENq5iIv8eBqzKo4-DwWYiCYx_V6SGIpcf0Xzvau3ISuoSfC2hk3KCIddvW_TZ58HCV5Zs-2UtC261U83ypiYEtYsTyUhx-wOru5aTGm2T_PDc', 1),
('a0000000-0000-0000-0000-000000000007', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGrR0qHGrce5EfkvUXD9AV1D28eIMI0o1zX4jfhHzu1QWwUv0eFfu3YmX5XRtobB0k9DLUaVwvZyOZardNeMSzgLk-emBRhTIkoA8gjFZ4MmrCi1t374aMnmwr3jzRbhpAQwuutH4LXZ0VrzAIfFrNixGJC8RPFWmDITGE3_h9aSw8lDJZRkbxca5a4-7vfMxSAsJdmXFEVcu94ufzDhGfL6X483m9SslZpkbkwU-ugRcepGnuDvIz', 1),
('a0000000-0000-0000-0000-000000000008', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ55lnlWPB6gI-17HYtHtnTIvGyUln_heYaUuGhWCsO7pMDVzjyre1Ndgpl5sS6uB72vHIGq5e9lDYLHOaYc-EkJUXlMh4lxFJ2Pj6lxuKJKuSOrzzvWCKkdb7dkTL-Vwg3FwfWkkAdgaruAG9gSDyzixOy19wshQc_4CIUZ1uMq9x4e8D-YWZ5AHKz5F64MKUYgxe98vXEa-pKKKmRrnapwO3Qj3_Aq6ACHHahdtDGR15eJkW6AST', 1),
('a0000000-0000-0000-0000-000000000009', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgWm0g5LqsfyFBmtp2ZevQlUYvVZPhjo7CIsElwCpN7ehVbLINvltO7MGWV-4tkb5C2dBwwfIX1qircLpdC5mz7rCkSD5CkwMQO4eviBON1k9SE96Wu_3x-1WOnsLrHSNY6S0IOWvAVDGV0hQRkB43Mu5WBjkxk8yaDR4m-nVX-6ca53ZhNo200gASLqbMBoERFmUgLKp6uy0Z2EC-g4Iyvm-sbRoN35pxFA1_90a1Rztk5Z1T80R_', 1),
('a0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000015', 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000016', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000017', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000018', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000019', 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000020', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80', 1)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED COUPONS
INSERT INTO public.coupons (code, discount_type, discount_value, minimum_order, is_active)
VALUES
('ZENMART10', 'percentage', 10.00, 1000.00, true),
('ZEN10', 'percentage', 10.00, 500.00, true),
('EIDVIBES', 'fixed', 250.00, 2000.00, true),
('FREESHIP', 'fixed', 60.00, 800.00, true)
ON CONFLICT (code) DO NOTHING;

-- 5. SEED REVIEWS
INSERT INTO public.reviews (product_id, author_name, rating, comment, is_verified_purchase, is_approved)
VALUES
('a0000000-0000-0000-0000-000000000001', 'Tahmid Hossain (Dhanmondi, Dhaka)', 5, 'The magnetic desk lamp is phenomenal! Zero glare on my monitor during late night coding sessions. Pathao delivered in 24 hours.', true, true),
('a0000000-0000-0000-0000-000000000002', 'Farhana Yasmin (Uttara, Dhaka)', 5, 'TWS Earbuds Pro bass is super punchy. Battery easily lasts 3 days for my commutes. Best gadget buy this year.', true, true),
('a0000000-0000-0000-0000-000000000003', 'Zubair Al Mamun (Chittagong)', 5, 'Original packaging with 1-year warranty card included. Delivery person allowed me to check the product before paying.', true, true)
ON CONFLICT (id) DO NOTHING;
