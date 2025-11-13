-- Azimut 55S Case Study Demo Data Import Script
-- Prisma-compatible SQL statements for yacht documentation management system
-- Created: 2025-11-13
-- Purpose: Load realistic demo data for Azimut 55S Mediterranean yacht sale case study
-- Import time: <5 seconds

-- ============================================================================
-- BOAT PROFILE
-- ============================================================================

INSERT INTO boats (
  id,
  vesselName,
  model,
  type,
  length,
  year,
  originalPurchasePrice,
  originalPurchaseCurrency,
  currentMarketValue,
  currentMarketCurrency,
  ownershipDuration,
  homePort,
  condition,
  engineType,
  horsePower,
  cruisingSpeed,
  maxSpeed,
  fuelCapacity,
  freshWaterCapacity,
  createdAt,
  updatedAt
) VALUES (
  'boat-azimut-55s-001',
  'Azimut 55S - Méditerranée',
  'Azimut 55S',
  'Luxury Motor Yacht',
  '55 feet',
  2008,
  800000,
  'EUR',
  480000,
  'EUR',
  '10 years (2015-2025)',
  'Côte d''Azur, France',
  'Meticulously maintained',
  'Twin MTU Diesel',
  1550,
  '20 knots',
  '25 knots',
  6500,
  1500,
  NOW(),
  NOW()
);

-- ============================================================================
-- EQUIPMENT INVENTORY (10 items)
-- ============================================================================

INSERT INTO equipment (
  id,
  boatId,
  category,
  item,
  manufacturer,
  model,
  serialNumber,
  installationDate,
  purchasePrice,
  purchaseCurrency,
  warrantyValue,
  warrantyStartDate,
  warrantyExpiryDate,
  warrantyStatus,
  warrantyTransferable,
  condition,
  notes,
  createdAt,
  updatedAt
) VALUES
-- Williams Jet Tender
('equip-001', 'boat-azimut-55s-001', 'Tender & Launch System', 'Williams 345 Jet Tender', 'Williams', '345 Turbojet', 'WJ-345-2022-0847', '2022-06-15', 45000, 'EUR', 15000, '2022-06-15', '2026-06-15', 'Active', true, 'Excellent', 'Complete overhaul 2024, all maintenance current', NOW(), NOW()),
-- Garmin Chartplotter
('equip-002', 'boat-azimut-55s-001', 'Navigation Electronics', 'Garmin GPSMAP 8616xsv Chartplotter', 'Garmin', 'GPSMAP 8616xsv', 'GM-8616-2021-3344', '2021-03-20', 8500, 'EUR', 8000, '2021-03-20', '2026-03-20', 'Active', true, 'Like New', 'Extended warranty includes software updates and parts replacement', NOW(), NOW()),
-- Garmin Autopilot
('equip-003', 'boat-azimut-55s-001', 'Navigation Electronics', 'Garmin Autopilot System GHC 20', 'Garmin', 'GHC 20', 'AP-GHC-2021-5567', '2021-03-20', 12000, 'EUR', 3000, '2021-03-20', '2026-03-20', 'Active', true, 'Excellent', 'Integrated with Garmin chartplotter', NOW(), NOW()),
-- Blind Motor System
('equip-004', 'boat-azimut-55s-001', 'Soft Goods & Interior', 'Motor Roller Blinds System with Smart Controls', 'StoHeliotouch', 'E2000 Smart Control', 'BL-STO-2023-7799', '2023-04-10', 8500, 'EUR', 3000, '2023-04-10', '2028-04-10', 'Active', true, 'Perfect', '5-year manufacturing warranty, smart home integration', NOW(), NOW()),
-- Engine Cooling System
('equip-005', 'boat-azimut-55s-001', 'Engine Service & Parts', 'Engine Cooling System Upgrade (Complete)', 'Seawater Engineering', 'High-Capacity Titanium Cooler', 'CC-2020-4421', '2020-08-01', 18000, 'EUR', 7000, '2020-08-01', '2025-08-01', 'Active (Expires Soon)', true, 'Excellent', 'Service warranty covers labor and parts. Full overhaul 2024.', NOW(), NOW()),
-- Life Raft
('equip-006', 'boat-azimut-55s-001', 'Safety Equipment', 'Life Raft System', 'Switlik', '6-Person Commercial', 'LR-SW-2020-8833', '2020-06-01', 6500, 'EUR', 0, '2020-06-01', '2025-06-01', 'Expired', false, 'Good (Certified)', 'Annual certification current as of May 2025', NOW(), NOW()),
-- HVAC System
('equip-007', 'boat-azimut-55s-001', 'HVAC & Climate Control', 'Marine Air Conditioning System', 'Marine Air', 'MA3000', 'AC-MA-2015-2210', '2015-10-15', 22000, 'EUR', 0, '2015-10-15', '2018-10-15', 'Expired', false, 'Good', 'Serviced annually, last maintenance June 2025', NOW(), NOW()),
-- Lithium Battery System
('equip-008', 'boat-azimut-55s-001', 'Electrical System', 'Battery Bank Upgrade (Lithium LiFePO4)', 'Battle Born Batteries', '12V 200Ah LiFePO4', 'LB-BBB-2023-4455', '2023-09-20', 9500, 'EUR', 2500, '2023-09-20', '2028-09-20', 'Active', true, 'Like New', '10-year warranty, smart BMS with monitoring', NOW(), NOW()),
-- Satellite TV System
('equip-009', 'boat-azimut-55s-001', 'Entertainment System', 'Hybrid Satellite/Terrestrial TV System', 'Intellian', 'i5 VSAT', 'TV-INT-2021-6677', '2021-01-15', 12000, 'EUR', 1500, '2021-01-15', '2025-01-15', 'Expired', false, 'Excellent', 'Last annual service: April 2025', NOW(), NOW()),
-- VHF Radio
('equip-010', 'boat-azimut-55s-001', 'Navigation Electronics', 'VHF Radio with DSC', 'Icom', 'IC-M506', 'VHF-IC-2019-8899', '2019-03-01', 2500, 'EUR', 0, '2019-03-01', '2021-03-01', 'Expired', false, 'Good', 'Functional and certified', NOW(), NOW());

-- ============================================================================
-- MAINTENANCE HISTORY (10 records)
-- ============================================================================

INSERT INTO maintenance (
  id,
  boatId,
  date,
  system,
  description,
  cost,
  costCurrency,
  serviceProvider,
  invoiceNumber,
  workOrder,
  hoursWorked,
  status,
  nextServiceDate,
  createdAt,
  updatedAt
) VALUES
-- June 2025 Engine Maintenance
('maint-001', 'boat-azimut-55s-001', '2025-06-15', 'Engine', 'Annual engine maintenance, fluid change, filter replacement', 2500, 'EUR', 'Mediterranean Marine Services', 'MMS-2025-06-001', 'WO-2025-0847', 16, 'Completed', '2026-06-15', NOW(), NOW()),
-- May 2025 Electrical
('maint-002', 'boat-azimut-55s-001', '2025-05-20', 'Electrical', 'Battery system inspection and smart BMS diagnostics', 450, 'EUR', 'NaviElec Solutions', 'NES-2025-05-024', 'WO-2025-0833', 3, 'Completed', '2026-05-20', NOW(), NOW()),
-- April 2025 Entertainment
('maint-003', 'boat-azimut-55s-001', '2025-04-10', 'Entertainment', 'Satellite TV system annual certification and software update', 350, 'EUR', 'Mediterranean Marine Services', 'MMS-2025-04-003', 'WO-2025-0805', 2, 'Completed', '2026-04-10', NOW(), NOW()),
-- March 2025 Hull
('maint-004', 'boat-azimut-55s-001', '2025-03-01', 'Hull & Exterior', 'Spring commissioning: haul-out inspection, hull cleaning, paint touch-up', 5200, 'EUR', 'Antibes Yacht Yards', 'AYY-2025-03-117', 'WO-2025-0721', 32, 'Completed', '2025-09-01', NOW(), NOW()),
-- December 2024 Engine Overhaul
('maint-005', 'boat-azimut-55s-001', '2024-12-15', 'Engine', 'Complete engine overhaul: inspections, compression test, fuel injection service', 8500, 'EUR', 'MTU Authorized Service Center', 'MTU-2024-12-556', 'WO-2024-0645', 48, 'Completed', '2025-12-15', NOW(), NOW()),
-- October 2024 Tender Overhaul
('maint-006', 'boat-azimut-55s-001', '2024-10-20', 'Tender', 'Tender complete overhaul: engine service, hull inspection, certification', 3200, 'EUR', 'Williams Authorized Dealer', 'WIL-2024-10-338', 'WO-2024-0511', 24, 'Completed', '2025-10-20', NOW(), NOW()),
-- August 2024 HVAC
('maint-007', 'boat-azimut-55s-001', '2024-08-05', 'HVAC', 'Air conditioning system seasonal maintenance and freon recharge', 650, 'EUR', 'Mediterranean Marine Services', 'MMS-2024-08-011', 'WO-2024-0447', 4, 'Completed', '2025-08-05', NOW(), NOW()),
-- June 2024 Electronics
('maint-008', 'boat-azimut-55s-001', '2024-06-12', 'Navigation Electronics', 'Garmin chartplotter and autopilot system diagnostics and software update', 280, 'EUR', 'NaviElec Solutions', 'NES-2024-06-015', 'WO-2024-0365', 2, 'Completed', '2025-06-12', NOW(), NOW()),
-- April 2024 Interior
('maint-009', 'boat-azimut-55s-001', '2024-04-18', 'Interior', 'Blind motor system inspection and smart control synchronization test', 320, 'EUR', 'StoHeliotouch Service Partner', 'STO-2024-04-209', 'WO-2024-0264', 2.5, 'Completed', '2025-04-18', NOW(), NOW()),
-- February 2024 Safety
('maint-010', 'boat-azimut-55s-001', '2024-02-28', 'Safety', 'Life raft annual certification and inspection', 400, 'EUR', 'Switlik Certified Inspector', 'SWL-2024-02-478', 'WO-2024-0147', 3, 'Completed', '2025-06-01', NOW(), NOW());

-- ============================================================================
-- DOCUMENTS (15 records)
-- ============================================================================

INSERT INTO documents (
  id,
  boatId,
  documentType,
  filename,
  dateAdded,
  uploadedBy,
  status,
  notes,
  createdAt,
  updatedAt
) VALUES
-- Original Purchase Documentation
('doc-001', 'boat-azimut-55s-001', 'Original Purchase Documentation', 'Azimut_55S_Bill_of_Sale_2015.pdf', '2025-11-01', 'Owner', 'Indexed', 'Original purchase documentation from 2015', NOW(), NOW()),
-- Warranties and Certificates
('doc-002', 'boat-azimut-55s-001', 'Warranty Certificate', 'Williams_345_Tender_Warranty_2022.pdf', '2025-11-01', 'Owner', 'Indexed', 'Complete warranty documentation for Williams tender', NOW(), NOW()),
('doc-003', 'boat-azimut-55s-001', 'Equipment Manual', 'Garmin_GPSMAP_8616xsv_User_Manual.pdf', '2025-11-01', 'Service Provider', 'Indexed', 'Complete user manual and technical specifications', NOW(), NOW()),
('doc-004', 'boat-azimut-55s-001', 'Service Invoice', 'Engine_Overhaul_Invoice_Dec2024.pdf', '2025-11-01', 'Service Provider', 'Indexed', 'MTU authorized service center engine overhaul invoice', NOW(), NOW()),
('doc-005', 'boat-azimut-55s-001', 'Maintenance Record', 'Annual_Engine_Maintenance_2025.pdf', '2025-11-01', 'Service Provider', 'Indexed', 'June 2025 annual engine maintenance certification', NOW(), NOW()),
('doc-006', 'boat-azimut-55s-001', 'Warranty Certificate', 'Garmin_Electronics_Extended_Warranty_2021.pdf', '2025-11-01', 'Service Provider', 'Indexed', 'Extended warranty for chartplotter and autopilot', NOW(), NOW()),
('doc-007', 'boat-azimut-55s-001', 'Installation Certificate', 'Blind_Motor_System_Installation_2023.pdf', '2025-11-01', 'Contractor', 'Indexed', 'StoHeliotouch smart blind system installation certification', NOW(), NOW()),
('doc-008', 'boat-azimut-55s-001', 'Service Invoice', 'Tender_Overhaul_Oct2024.pdf', '2025-11-01', 'Service Provider', 'Indexed', 'Williams tender complete overhaul October 2024', NOW(), NOW()),
('doc-009', 'boat-azimut-55s-001', 'Equipment Manual', 'MTU_Engine_Service_Manual.pdf', '2025-11-01', 'Service Provider', 'Indexed', 'Complete MTU diesel engine technical documentation', NOW(), NOW()),
('doc-010', 'boat-azimut-55s-001', 'Maintenance Record', 'Hull_Inspection_Spring_2025.pdf', '2025-11-01', 'Yacht Yard', 'Indexed', 'Antibes Yacht Yards spring commissioning haul-out inspection', NOW(), NOW()),
('doc-011', 'boat-azimut-55s-001', 'Certification', 'Life_Raft_Inspection_Certificate_2025.pdf', '2025-11-01', 'Certified Inspector', 'Indexed', 'Current life raft certification valid through June 2025', NOW(), NOW()),
('doc-012', 'boat-azimut-55s-001', 'Equipment Manual', 'Marine_Air_AC_System_Manual.pdf', '2025-11-01', 'Service Provider', 'Indexed', 'Complete HVAC system documentation', NOW(), NOW()),
('doc-013', 'boat-azimut-55s-001', 'Warranty Certificate', 'Lithium_Battery_Warranty_2023.pdf', '2025-11-01', 'Manufacturer', 'Indexed', 'Battle Born Batteries 10-year extended warranty', NOW(), NOW()),
('doc-014', 'boat-azimut-55s-001', 'Service Invoice', 'Battery_BMS_Software_Update_May2025.pdf', '2025-11-01', 'Service Provider', 'Indexed', 'Latest battery management system software update', NOW(), NOW()),
('doc-015', 'boat-azimut-55s-001', 'Equipment Manual', 'Intellian_VSAT_TV_System_Manual.pdf', '2025-11-01', 'Service Provider', 'Indexed', 'Complete satellite TV system documentation', NOW(), NOW());

-- ============================================================================
-- CASE STUDY METADATA
-- ============================================================================

INSERT INTO casestudies (
  id,
  boatId,
  brokerName,
  brokerLocation,
  scenario,
  listedPrice,
  listedCurrency,
  timelineToSale,
  documentationCompleteness,
  warrantyValueRecovered,
  laborTimeBefore,
  laborTimeAfter,
  createdAt,
  updatedAt
) VALUES (
  'case-azimut-55s-001',
  'boat-azimut-55s-001',
  'Riviera Plaisance',
  'Côte d''Azur, France',
  'Mediterranean Yacht Sale - Pre-Listing Documentation & Warranty Recovery',
  480000,
  'EUR',
  '3 weeks (vs. 6-8 weeks typical)',
  98,
  33000,
  '6+ hours manual assembly',
  '45 minutes automated',
  NOW(),
  NOW()
);

-- ============================================================================
-- DEMO IMPORT STATISTICS
-- ============================================================================

-- Total records created:
-- Boat profiles: 1
-- Equipment items: 10
-- Maintenance records: 10
-- Documents: 15
-- Case studies: 1
-- TOTAL: 37 records

-- Import time: <5 seconds
-- Status: Ready for demonstration

-- ============================================================================
-- END OF IMPORT SCRIPT
-- ============================================================================

-- Verification queries (run after import):
-- SELECT COUNT(*) as boat_count FROM boats WHERE id = 'boat-azimut-55s-001';
-- SELECT COUNT(*) as equipment_count FROM equipment WHERE boatId = 'boat-azimut-55s-001';
-- SELECT COUNT(*) as maintenance_count FROM maintenance WHERE boatId = 'boat-azimut-55s-001';
-- SELECT COUNT(*) as document_count FROM documents WHERE boatId = 'boat-azimut-55s-001';
