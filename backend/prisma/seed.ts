import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.cashReconciliation.deleteMany();
  await prisma.passPayment.deleteMany();
  await prisma.monthlyPass.deleteMany();
  await prisma.corporateAccount.deleteMany();
  await prisma.customerVehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.blacklist.deleteMany();
  await prisma.vehicleLog.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.advance.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.parkingLot.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  // Create owner user
  const passwordHash = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      password_hash: passwordHash,
      name: 'Rajesh Sharma',
      role: 'OWNER',
      phone: '+919876543210',
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@example.com',
      password_hash: passwordHash,
      name: 'Amit Kumar',
      role: 'SUPERVISOR',
      phone: '+919876543211',
    },
  });

  console.log('Created users');

  // Create parking lot
  const parkingLot = await prisma.parkingLot.create({
    data: {
      name: 'Andheri West Parking',
      address: 'Plot 12, SV Road, Andheri West, Mumbai 400058',
      total_slots: 120,
      upi_id: 'andheriwest@okbank',
      payee_name: 'Andheri West Parking',
      gstin: '27ABCDE1234F1Z5',
    },
  });

  // Create zones
  const coveredZone = await prisma.zone.create({
    data: {
      parking_lot_id: parkingLot.id,
      name: 'Covered Ground',
      type: 'COVERED',
    },
  });

  const openZone = await prisma.zone.create({
    data: {
      parking_lot_id: parkingLot.id,
      name: 'Open Air',
      type: 'OPEN_AIR',
    },
  });

  const basementZone = await prisma.zone.create({
    data: {
      parking_lot_id: parkingLot.id,
      name: 'Basement B1',
      type: 'BASEMENT',
    },
  });

  const rooftopZone = await prisma.zone.create({
    data: {
      parking_lot_id: parkingLot.id,
      name: 'Rooftop',
      type: 'ROOFTOP',
    },
  });

  console.log('Created zones');

  // Create slots: 80 four-wheeler, 30 two-wheeler, 8 EV, 2 handicapped
  const slots: any[] = [];

  // 50 four-wheeler slots in covered zone (A1-A50)
  for (let i = 1; i <= 50; i++) {
    slots.push({
      zone_id: coveredZone.id,
      slot_number: `A${i}`,
      category: 'FOUR_WHEELER',
    });
  }

  // 30 two-wheeler slots in open zone (B1-B30)
  for (let i = 1; i <= 30; i++) {
    slots.push({
      zone_id: openZone.id,
      slot_number: `B${i}`,
      category: 'TWO_WHEELER',
    });
  }

  // 20 four-wheeler slots in basement (C1-C20)
  for (let i = 1; i <= 20; i++) {
    slots.push({
      zone_id: basementZone.id,
      slot_number: `C${i}`,
      category: 'FOUR_WHEELER',
    });
  }

  // 10 four-wheeler slots on rooftop (D1-D10)
  for (let i = 1; i <= 10; i++) {
    slots.push({
      zone_id: rooftopZone.id,
      slot_number: `D${i}`,
      category: 'FOUR_WHEELER',
    });
  }

  // 8 EV slots in covered zone (E1-E8)
  for (let i = 1; i <= 8; i++) {
    slots.push({
      zone_id: coveredZone.id,
      slot_number: `E${i}`,
      category: 'EV',
      has_charger: true,
    });
  }

  // 2 handicapped slots in covered zone (H1-H2)
  for (let i = 1; i <= 2; i++) {
    slots.push({
      zone_id: coveredZone.id,
      slot_number: `H${i}`,
      category: 'HANDICAPPED',
    });
  }

  await prisma.slot.createMany({ data: slots });
  console.log(`Created ${slots.length} slots`);

  // Create pricing rules
  await prisma.pricingRule.createMany({
    data: [
      {
        category: 'FOUR_WHEELER',
        hourly_rate: 4000,
        daily_rate: 20000,
        monthly_rate: 300000,
        event_rate: 6000,
        overnight_rate: 8000,
        corporate_rate: 250000,
      },
      {
        category: 'TWO_WHEELER',
        hourly_rate: 2000,
        daily_rate: 8000,
        monthly_rate: 120000,
        event_rate: 3000,
        overnight_rate: 4000,
        corporate_rate: 100000,
      },
      {
        category: 'EV',
        hourly_rate: 5000,
        daily_rate: 25000,
        monthly_rate: 400000,
        event_rate: 7000,
        overnight_rate: 9000,
        corporate_rate: 350000,
      },
      {
        category: 'HANDICAPPED',
        hourly_rate: 3000,
        daily_rate: 15000,
        monthly_rate: 200000,
        event_rate: 5000,
        overnight_rate: 6000,
        corporate_rate: 180000,
      },
      {
        category: 'PREMIUM',
        hourly_rate: 6000,
        daily_rate: 30000,
        monthly_rate: 500000,
        event_rate: 8000,
        overnight_rate: 10000,
        corporate_rate: 450000,
      },
    ],
  });

  console.log('Created pricing rules');

  // Create vendors
  const electricVendor = await prisma.vendor.create({
    data: {
      business_name: 'Mumbai Electrical Works',
      contact_person: 'Suresh Patel',
      phone: '+919876543220',
      gstin: '27ABCDE1234F1Z5',
      category: 'electrical',
    },
  });

  const securityVendor = await prisma.vendor.create({
    data: {
      business_name: 'SecureGuard Services',
      contact_person: 'Ramesh Naik',
      phone: '+919876543221',
      gstin: '27ABCDF5678G1Z2',
      category: 'security agency',
    },
  });

  const cleaningVendor = await prisma.vendor.create({
    data: {
      business_name: 'CleanCity Solutions',
      contact_person: 'Sunita Devi',
      phone: '+919876543222',
      gstin: '27ABCDG9012H1Z3',
      category: 'cleaning service',
    },
  });

  console.log('Created vendors');

  // Create staff
  const staffMembers = [
    { name: 'Rajesh Kumar', role: 'SECURITY', shift: 'MORNING', wage_rate: 52000, is_monthly: true },
    { name: 'Anita Deshmukh', role: 'ATTENDANT', shift: 'MORNING', wage_rate: 40000, is_monthly: true },
    { name: 'Vikram Singh', role: 'SUPERVISOR', shift: 'AFTERNOON', wage_rate: 60000, is_monthly: true },
    { name: 'Priya Sharma', role: 'CASHIER', shift: 'MORNING', wage_rate: 45000, is_monthly: true },
    { name: 'Mohan Patil', role: 'SECURITY', shift: 'NIGHT', wage_rate: 52000, is_monthly: true },
    { name: 'Sita Verma', role: 'CLEANER', shift: 'MORNING', wage_rate: 30000, is_monthly: true },
  ];

  for (const staff of staffMembers) {
    await prisma.staff.create({
      data: {
        ...staff,
        phone: `+9198765432${Math.floor(Math.random() * 90) + 10}`,
        employment_type: 'FULL_TIME',
        joining_date: new Date('2024-01-15'),
      },
    });
  }

  console.log('Created staff');

  // Create customers
  const customers = [
    { name: 'Manoj Gupta', phone: '+919812345670', vehicle: 'MH01AB1234' },
    { name: 'Kavita Rao', phone: '+919812345671', vehicle: 'MH02CD5678' },
    { name: 'Arjun Nair', phone: '+919812345672', vehicle: 'MH03EF9012' },
    { name: 'Pooja Iyer', phone: '+919812345673', vehicle: 'MH04GH3456' },
    { name: 'Sanjay Kulkarni', phone: '+919812345674', vehicle: 'MH05JK7890' },
  ];

  const customerIds: string[] = [];
  for (const c of customers) {
    const customer = await prisma.customer.create({
      data: {
        name: c.name,
        phone: c.phone,
        vehicles: {
          create: [{ vehicle_number: c.vehicle }],
        },
      },
    });
    customerIds.push(customer.id);
  }

  console.log('Created customers');

  // Create monthly passes for some customers
  const today = new Date();
  const passSlots = ['A5', 'A6', 'A7', 'A8', 'A9'];

  for (let i = 0; i < Math.min(passSlots.length, customerIds.length); i++) {
    const slot = await prisma.slot.findFirst({
      where: { slot_number: passSlots[i] },
    });
    if (!slot) continue;

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (i < 2 ? 5 : 25)); // 2 expiring soon

    await prisma.monthlyPass.create({
      data: {
        customer_id: customerIds[i],
        slot_id: slot.id,
        pass_type: 'INDIVIDUAL',
        vehicle_number: customers[i].vehicle,
        start_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end_date: endDate,
        amount: 300000,
        gst_amount: 54000,
        total: 354000,
        payments: {
          create: {
            amount: 354000,
            payment_mode: 'UPI',
          },
        },
      },
    });

    await prisma.slot.update({
      where: { id: slot.id },
      data: { is_reserved: true },
    });
  }

  console.log('Created monthly passes');

  // Create expenses
  const expenseData = [
    { category: 'STAFF_WAGES', sub_category: 'Monthly salary', amount: 5200000, vendor: null, description: 'Monthly staff salaries', payment_mode: 'BANK_TRANSFER' },
    { category: 'UTILITIES', sub_category: 'Electricity', amount: 2840000, vendor: null, description: 'MSEB electricity bill', payment_mode: 'UPI' },
    { category: 'MAINTENANCE', sub_category: 'Gate motor', amount: 2180000, vendor: electricVendor.id, description: 'Gate motor repair + annual maintenance', payment_mode: 'BANK_TRANSFER' },
    { category: 'SECURITY', sub_category: 'Security agency', amount: 1800000, vendor: securityVendor.id, description: 'Security agency monthly fee', payment_mode: 'BANK_TRANSFER' },
    { category: 'RENT_LEASE', sub_category: 'Monthly rent', amount: 1500000, vendor: null, description: 'Land rent for parking lot', payment_mode: 'BANK_TRANSFER' },
    { category: 'EQUIPMENT', sub_category: 'Signage', amount: 560000, vendor: null, description: 'New direction signage boards', payment_mode: 'CASH' },
    { category: 'VENDOR', sub_category: 'Cleaning', amount: 420000, vendor: cleaningVendor.id, description: 'Monthly cleaning service', payment_mode: 'UPI' },
    { category: 'UTILITIES', sub_category: 'Internet', amount: 180000, vendor: null, description: 'Broadband + CCTV cloud storage', payment_mode: 'UPI' },
    { category: 'MAINTENANCE', sub_category: 'Lighting', amount: 960000, vendor: electricVendor.id, description: 'LED floodlight replacement', payment_mode: 'CASH' },
    { category: 'TAX_LICENSE', sub_category: 'Property tax', amount: 1250000, vendor: null, description: 'Quarterly property tax', payment_mode: 'BANK_TRANSFER' },
  ];

  for (const exp of expenseData) {
    const expenseDate = new Date(today);
    expenseDate.setDate(expenseDate.getDate() - Math.floor(Math.random() * 30));

    await prisma.expense.create({
      data: {
        date: expenseDate,
        category: exp.category as any,
        sub_category: exp.sub_category,
        vendor_id: exp.vendor,
        amount: exp.amount,
        payment_mode: exp.payment_mode as any,
        description: exp.description,
        status: 'APPROVED',
        approved_by: owner.id,
        approved_at: new Date(),
        created_by: owner.id,
      },
    });
  }

  console.log('Created expenses');

  // Create budgets
  const budgets = [
    { category: 'STAFF_WAGES', amount: 6000000 },
    { category: 'UTILITIES', amount: 3500000 },
    { category: 'MAINTENANCE', amount: 3000000 },
    { category: 'SECURITY', amount: 2000000 },
    { category: 'RENT_LEASE', amount: 1800000 },
    { category: 'VENDOR', amount: 1000000 },
    { category: 'EQUIPMENT', amount: 1500000 },
    { category: 'TAX_LICENSE', amount: 1500000 },
  ];

  for (const b of budgets) {
    await prisma.budget.create({
      data: {
        category: b.category as any,
        monthly_limit: b.amount,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
      },
    });
  }

  console.log('Created budgets');

  // Create assets
  const assets = [
    { name: 'Boom Barrier 1', category: 'Boom Barrier', purchase_cost: 8500000 },
    { name: 'Boom Barrier 2', category: 'Boom Barrier', purchase_cost: 8500000 },
    { name: 'CCTV Camera Set', category: 'CCTV', purchase_cost: 12500000 },
    { name: 'EV Charger Unit', category: 'EV Charger', purchase_cost: 24000000 },
    { name: 'Ticket Printer', category: 'Printer', purchase_cost: 3200000 },
    { name: 'Diesel Generator', category: 'Generator', purchase_cost: 18500000 },
    { name: 'Flood Light Array', category: 'Lighting', purchase_cost: 4600000 },
  ];

  for (const asset of assets) {
    await prisma.asset.create({
      data: {
        name: asset.name,
        category: asset.category,
        purchase_date: new Date('2024-03-15'),
        purchase_cost: asset.purchase_cost,
        warranty_expiry: new Date('2026-03-15'),
        next_service_due: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Created assets');

  // Create some active vehicle entries
  const activeSlots = ['A10', 'A11', 'A12', 'B5', 'B6', 'E1'];
  for (const slotNum of activeSlots) {
    const slot = await prisma.slot.findFirst({ where: { slot_number: slotNum } });
    if (!slot) continue;

    const entryTime = new Date();
    entryTime.setMinutes(entryTime.getMinutes() - Math.floor(Math.random() * 120));

    await prisma.vehicleLog.create({
      data: {
        slot_id: slot.id,
        vehicle_number: `MH1${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}${Math.floor(Math.random() * 90) + 10}${Math.floor(Math.random() * 9000) + 1000}`,
        category: slot.category === 'EV' ? 'EV' : slot.category === 'TWO_WHEELER' ? 'TWO_WHEELER' : 'FOUR_WHEELER' as any,
        entry_time: entryTime,
        rate_applied: slot.category === 'TWO_WHEELER' ? 2000 : slot.category === 'EV' ? 5000 : 4000,
        total_amount: 0,
        gst_amount: 0,
      },
    });

    await prisma.slot.update({
      where: { id: slot.id },
      data: { status: 'OCCUPIED' },
    });
  }

  console.log('Created active vehicles');

  // Create documents
  await prisma.document.createMany({
    data: [
      { type: 'PARKING_LICENSE', document_number: 'PL/MUM/2024/4581', issue_date: new Date('2024-04-01'), expiry_date: new Date('2025-03-31') },
      { type: 'TRADE_LICENSE', document_number: 'TL/AND/2024/112', issue_date: new Date('2024-05-15'), expiry_date: new Date('2025-05-14') },
      { type: 'FIRE_NOC', document_number: 'FIRE/2024/883', issue_date: new Date('2024-06-10'), expiry_date: new Date('2025-06-09') },
    ],
  });

  console.log('Created documents');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });