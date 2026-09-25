/* eslint-disable max-lines */
export const STORAGE_KEY = "tsw-registered-members";

export const SEED_MEMBERS = [
  // --- BATCH 1 (MWF 06:00 AM - 07:00 AM) ---
  {
    id: "MEM-2001",
    firstName: "Arun",
    lastName: "Varma",
    email: "arun.varma@example.com",
    mobile: "+91 98401 23456",
    gender: "Male",
    dob: "1994-06-14",
    height: "178",
    weight: "76",
    bloodGroup: "O+",
    batchId: "BATCH-01",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "178 cm",
      weight: "76 kg",
      bmi: "24.0",
      bloodGroup: "O+",
    },
    emergencyName: "Pooja Varma",
    emergencyPhone: "+91 98401 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Pooja Varma",
      phone: "+91 98401 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-15",
      notes: "No cardiac or spine history. Fit for heavy barbell training.",
    },
    address: "Apt 4B, Emerald Heights, Indiranagar, Bengaluru",
    registeredAt: "2026-01-10T06:30:00.000Z",
    updatedAt: "2026-01-10T06:30:00.000Z",
  },
  {
    id: "MEM-2002",
    firstName: "Priya",
    lastName: "Nair",
    email: "priya.nair@example.com",
    mobile: "+91 98402 34567",
    gender: "Female",
    dob: "1997-03-22",
    height: "165",
    weight: "58",
    bloodGroup: "B+",
    batchId: "BATCH-01",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Half-Yearly Functional Pass",
    planId: "PLAN-HALF-YEARLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "165 cm",
      weight: "58 kg",
      bmi: "21.3",
      bloodGroup: "B+",
    },
    emergencyName: "Suresh Nair",
    emergencyPhone: "+91 98402 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "Suresh Nair",
      phone: "+91 98402 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-12",
      notes: "Cleared for high-intensity athletic conditioning.",
    },
    address: "Villa 12, Palm Meadows, Whitefield, Bengaluru",
    registeredAt: "2026-01-12T07:00:00.000Z",
    updatedAt: "2026-01-12T07:00:00.000Z",
  },
  {
    id: "MEM-2003",
    firstName: "Karthik",
    lastName: "Rajan",
    email: "karthik.rajan@example.com",
    mobile: "+91 98403 45678",
    gender: "Male",
    dob: "1992-11-05",
    height: "182",
    weight: "84",
    bloodGroup: "A+",
    batchId: "BATCH-01",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "182 cm",
      weight: "84 kg",
      bmi: "25.4",
      bloodGroup: "A+",
    },
    emergencyName: "Meera Rajan",
    emergencyPhone: "+91 98403 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Meera Rajan",
      phone: "+91 98403 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-08",
      notes: "Previous mild meniscus tear (2023), fully rehabbed.",
    },
    address: "702, Skyline Towers, Koramangala, Bengaluru",
    registeredAt: "2026-01-08T06:00:00.000Z",
    updatedAt: "2026-01-08T06:00:00.000Z",
  },
  {
    id: "MEM-2004",
    firstName: "Sneha",
    lastName: "Iyer",
    email: "sneha.iyer@example.com",
    mobile: "+91 98404 56789",
    gender: "Female",
    dob: "1998-09-18",
    height: "162",
    weight: "54",
    bloodGroup: "AB+",
    batchId: "BATCH-01",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Quarterly Transformation",
    planId: "PLAN-QUARTERLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "162 cm",
      weight: "54 kg",
      bmi: "20.6",
      bloodGroup: "AB+",
    },
    emergencyName: "Raman Iyer",
    emergencyPhone: "+91 98404 98765",
    emergencyRelation: "Brother",
    emergencyContact: {
      name: "Raman Iyer",
      phone: "+91 98404 98765",
      relation: "Brother",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-02-01",
      notes: "General fitness clearance provided.",
    },
    address: "Flat 304, Green Glen Layout, Bellandur, Bengaluru",
    registeredAt: "2026-02-01T06:30:00.000Z",
    updatedAt: "2026-02-01T06:30:00.000Z",
  },
  {
    id: "MEM-2005",
    firstName: "Vikram",
    lastName: "Patel",
    email: "vikram.patel@example.com",
    mobile: "+91 98405 67890",
    gender: "Male",
    dob: "1989-12-03",
    height: "175",
    weight: "80",
    bloodGroup: "O-",
    batchId: "BATCH-01",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "175 cm",
      weight: "80 kg",
      bmi: "26.1",
      bloodGroup: "O-",
    },
    emergencyName: "Geeta Patel",
    emergencyPhone: "+91 98405 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Geeta Patel",
      phone: "+91 98405 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-20",
      notes: "Full cardiovascular stress test passed.",
    },
    address: "B-201, Shanti Niketan, Whitefield, Bengaluru",
    registeredAt: "2026-01-20T06:15:00.000Z",
    updatedAt: "2026-01-20T06:15:00.000Z",
  },
  {
    id: "MEM-2006",
    firstName: "Divya",
    lastName: "Menon",
    email: "divya.menon@example.com",
    mobile: "+91 98406 78901",
    gender: "Female",
    dob: "1995-07-28",
    height: "168",
    weight: "62",
    bloodGroup: "B+",
    batchId: "BATCH-01",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Half-Yearly Functional Pass",
    planId: "PLAN-HALF-YEARLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "168 cm",
      weight: "62 kg",
      bmi: "22.0",
      bloodGroup: "B+",
    },
    emergencyName: "Ashok Menon",
    emergencyPhone: "+91 98406 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "Ashok Menon",
      phone: "+91 98406 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-25",
      notes: "Fit for powerlifting and high-volume training.",
    },
    address: "Block C, Prestige Ozone, Whitefield, Bengaluru",
    registeredAt: "2026-01-25T06:45:00.000Z",
    updatedAt: "2026-01-25T06:45:00.000Z",
  },

  // --- BATCH 2 (MWF 08:00 AM - 09:00 AM) ---
  {
    id: "MEM-2007",
    firstName: "Rohan",
    lastName: "Deshmukh",
    email: "rohan.deshmukh@example.com",
    mobile: "+91 98407 89012",
    gender: "Male",
    dob: "1996-04-11",
    height: "177",
    weight: "74",
    bloodGroup: "A+",
    batchId: "BATCH-02",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "177 cm",
      weight: "74 kg",
      bmi: "23.6",
      bloodGroup: "A+",
    },
    emergencyName: "Sunita Deshmukh",
    emergencyPhone: "+91 98407 98765",
    emergencyRelation: "Mother",
    emergencyContact: {
      name: "Sunita Deshmukh",
      phone: "+91 98407 98765",
      relation: "Mother",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-14",
      notes: "No medical contraindications.",
    },
    address: "Flat 102, Rohan Vistas, HSR Layout, Bengaluru",
    registeredAt: "2026-01-14T08:00:00.000Z",
    updatedAt: "2026-01-14T08:00:00.000Z",
  },
  {
    id: "MEM-2008",
    firstName: "Ananya",
    lastName: "Sharma",
    email: "ananya.sharma@example.com",
    mobile: "+91 98408 90123",
    gender: "Female",
    dob: "1999-01-15",
    height: "160",
    weight: "52",
    bloodGroup: "O+",
    batchId: "BATCH-02",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Quarterly Transformation",
    planId: "PLAN-QUARTERLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "160 cm",
      weight: "52 kg",
      bmi: "20.3",
      bloodGroup: "O+",
    },
    emergencyName: "Rajesh Sharma",
    emergencyPhone: "+91 98408 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "Rajesh Sharma",
      phone: "+91 98408 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-02-10",
      notes: "Cleared for functional endurance program.",
    },
    address: "Villa 45, Adarsh Palm Retreat, Outer Ring Road, Bengaluru",
    registeredAt: "2026-02-10T08:15:00.000Z",
    updatedAt: "2026-02-10T08:15:00.000Z",
  },
  {
    id: "MEM-2009",
    firstName: "Gautam",
    lastName: "Hegde",
    email: "gautam.hegde@example.com",
    mobile: "+91 98409 01234",
    gender: "Male",
    dob: "1990-08-19",
    height: "180",
    weight: "82",
    bloodGroup: "B+",
    batchId: "BATCH-02",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Half-Yearly Functional Pass",
    planId: "PLAN-HALF-YEARLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "180 cm",
      weight: "82 kg",
      bmi: "25.3",
      bloodGroup: "B+",
    },
    emergencyName: "Radhika Hegde",
    emergencyPhone: "+91 98409 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Radhika Hegde",
      phone: "+91 98409 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-18",
      notes: "Clean medical bill. Excellent joint mobility.",
    },
    address: "501, Sobha Iris, Marathahalli, Bengaluru",
    registeredAt: "2026-01-18T08:30:00.000Z",
    updatedAt: "2026-01-18T08:30:00.000Z",
  },
  {
    id: "MEM-2010",
    firstName: "Meera",
    lastName: "Krishnan",
    email: "meera.k@example.com",
    mobile: "+91 98410 12345",
    gender: "Female",
    dob: "1995-10-30",
    height: "164",
    weight: "56",
    bloodGroup: "A-",
    batchId: "BATCH-02",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "164 cm",
      weight: "56 kg",
      bmi: "20.8",
      bloodGroup: "A-",
    },
    emergencyName: "Anand Krishnan",
    emergencyPhone: "+91 98410 98765",
    emergencyRelation: "Brother",
    emergencyContact: {
      name: "Anand Krishnan",
      phone: "+91 98410 98765",
      relation: "Brother",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-22",
      notes: "Passed baseline orthopedic screening.",
    },
    address: "House 88, 14th Main, Indiranagar, Bengaluru",
    registeredAt: "2026-01-22T08:00:00.000Z",
    updatedAt: "2026-01-22T08:00:00.000Z",
  },
  {
    id: "MEM-2011",
    firstName: "Sameer",
    lastName: "Joshi",
    email: "sameer.joshi@example.com",
    mobile: "+91 98411 23456",
    gender: "Male",
    dob: "1993-05-02",
    height: "173",
    weight: "71",
    bloodGroup: "O+",
    batchId: "BATCH-02",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Quarterly Transformation",
    planId: "PLAN-QUARTERLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "173 cm",
      weight: "71 kg",
      bmi: "23.7",
      bloodGroup: "O+",
    },
    emergencyName: "Ritu Joshi",
    emergencyPhone: "+91 98411 98765",
    emergencyRelation: "Sister",
    emergencyContact: {
      name: "Ritu Joshi",
      phone: "+91 98411 98765",
      relation: "Sister",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-02-05",
      notes: "Fitness clearance verified.",
    },
    address: "204, Brigade Paramount, Old Airport Road, Bengaluru",
    registeredAt: "2026-02-05T08:00:00.000Z",
    updatedAt: "2026-02-05T08:00:00.000Z",
  },

  // --- BATCH 3 (MWF 06:30 PM - 07:30 PM) ---
  {
    id: "MEM-2012",
    firstName: "Abhishek",
    lastName: "Roy",
    email: "abhishek.roy@example.com",
    mobile: "+91 98412 34567",
    gender: "Male",
    dob: "1997-02-14",
    height: "185",
    weight: "88",
    bloodGroup: "B+",
    batchId: "BATCH-03",
    batchTiming: "06:30 PM - 07:30 PM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "185 cm",
      weight: "88 kg",
      bmi: "25.7",
      bloodGroup: "B+",
    },
    emergencyName: "Debashish Roy",
    emergencyPhone: "+91 98412 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "Debashish Roy",
      phone: "+91 98412 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-16",
      notes: "Advanced athlete. Cleared for maximal lifts.",
    },
    address: "Flat 12A, Salarpuria Sattva Greenage, Hosur Road, Bengaluru",
    registeredAt: "2026-01-16T18:30:00.000Z",
    updatedAt: "2026-01-16T18:30:00.000Z",
  },
  {
    id: "MEM-2013",
    firstName: "Kavita",
    lastName: "Reddy",
    email: "kavita.reddy@example.com",
    mobile: "+91 98413 45678",
    gender: "Female",
    dob: "1993-09-08",
    height: "167",
    weight: "60",
    bloodGroup: "O+",
    batchId: "BATCH-03",
    batchTiming: "06:30 PM - 07:30 PM",
    membershipPlan: "Half-Yearly Functional Pass",
    planId: "PLAN-HALF-YEARLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "167 cm",
      weight: "60 kg",
      bmi: "21.5",
      bloodGroup: "O+",
    },
    emergencyName: "Venkat Reddy",
    emergencyPhone: "+91 98413 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Venkat Reddy",
      phone: "+91 98413 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-19",
      notes: "Fit for evening high-intensity training.",
    },
    address: "Plot 42, HSR Sector 2, Bengaluru",
    registeredAt: "2026-01-19T18:30:00.000Z",
    updatedAt: "2026-01-19T18:30:00.000Z",
  },
  {
    id: "MEM-2014",
    firstName: "Naveen",
    lastName: "Prasad",
    email: "naveen.prasad@example.com",
    mobile: "+91 98414 56789",
    gender: "Male",
    dob: "1991-12-25",
    height: "176",
    weight: "78",
    bloodGroup: "A+",
    batchId: "BATCH-03",
    batchTiming: "06:30 PM - 07:30 PM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "176 cm",
      weight: "78 kg",
      bmi: "25.2",
      bloodGroup: "A+",
    },
    emergencyName: "Deepa Prasad",
    emergencyPhone: "+91 98414 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Deepa Prasad",
      phone: "+91 98414 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-11",
      notes: "No known orthopedic conditions.",
    },
    address: "Tower 3, Apt 1104, Purva Riviera, Marathahalli, Bengaluru",
    registeredAt: "2026-01-11T18:30:00.000Z",
    updatedAt: "2026-01-11T18:30:00.000Z",
  },
  {
    id: "MEM-2015",
    firstName: "Shalini",
    lastName: "Saxena",
    email: "shalini.s@example.com",
    mobile: "+91 98415 67890",
    gender: "Female",
    dob: "1996-08-04",
    height: "163",
    weight: "55",
    bloodGroup: "AB+",
    batchId: "BATCH-03",
    batchTiming: "06:30 PM - 07:30 PM",
    membershipPlan: "Quarterly Transformation",
    planId: "PLAN-QUARTERLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "163 cm",
      weight: "55 kg",
      bmi: "20.7",
      bloodGroup: "AB+",
    },
    emergencyName: "Amit Saxena",
    emergencyPhone: "+91 98415 98765",
    emergencyRelation: "Brother",
    emergencyContact: {
      name: "Amit Saxena",
      phone: "+91 98415 98765",
      relation: "Brother",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-02-14",
      notes: "Approved for full resistance workout roster.",
    },
    address: "B-603, Vaswani Brentwood, Brookefield, Bengaluru",
    registeredAt: "2026-02-14T18:30:00.000Z",
    updatedAt: "2026-02-14T18:30:00.000Z",
  },
  {
    id: "MEM-2016",
    firstName: "Deepak",
    lastName: "Chawla",
    email: "deepak.chawla@example.com",
    mobile: "+91 98416 78901",
    gender: "Male",
    dob: "1988-03-17",
    height: "179",
    weight: "83",
    bloodGroup: "O+",
    batchId: "BATCH-03",
    batchTiming: "06:30 PM - 07:30 PM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "179 cm",
      weight: "83 kg",
      bmi: "25.9",
      bloodGroup: "O+",
    },
    emergencyName: "Rani Chawla",
    emergencyPhone: "+91 98416 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Rani Chawla",
      phone: "+91 98416 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-28",
      notes: "Cardio stress test normal.",
    },
    address: "Villa 8, Epsilon Residential Villas, Yemlur, Bengaluru",
    registeredAt: "2026-01-28T18:30:00.000Z",
    updatedAt: "2026-01-28T18:30:00.000Z",
  },

  // --- BATCH 4 (TTS 06:00 AM - 07:00 AM) ---
  {
    id: "MEM-2017",
    firstName: "Harish",
    lastName: "Sundaram",
    email: "harish.s@example.com",
    mobile: "+91 98417 89012",
    gender: "Male",
    dob: "1994-01-29",
    height: "181",
    weight: "79",
    bloodGroup: "O+",
    batchId: "BATCH-04",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "181 cm",
      weight: "79 kg",
      bmi: "24.1",
      bloodGroup: "O+",
    },
    emergencyName: "Gayathri Sundaram",
    emergencyPhone: "+91 98417 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Gayathri Sundaram",
      phone: "+91 98417 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-15",
      notes: "No medical restrictions.",
    },
    address: "301, Brigade Gardenia, JP Nagar 7th Phase, Bengaluru",
    registeredAt: "2026-01-15T06:00:00.000Z",
    updatedAt: "2026-01-15T06:00:00.000Z",
  },
  {
    id: "MEM-2018",
    firstName: "Ritu",
    lastName: "Kapoor",
    email: "ritu.kapoor@example.com",
    mobile: "+91 98418 90123",
    gender: "Female",
    dob: "1998-05-12",
    height: "166",
    weight: "57",
    bloodGroup: "B+",
    batchId: "BATCH-04",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Half-Yearly Functional Pass",
    planId: "PLAN-HALF-YEARLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "166 cm",
      weight: "57 kg",
      bmi: "20.7",
      bloodGroup: "B+",
    },
    emergencyName: "Sanjay Kapoor",
    emergencyPhone: "+91 98418 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "Sanjay Kapoor",
      phone: "+91 98418 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-02-02",
      notes: "Cleared for Tuesday/Thursday/Saturday conditioning cycle.",
    },
    address: "House 24, 5th Cross, Dollars Colony, Bengaluru",
    registeredAt: "2026-02-02T06:00:00.000Z",
    updatedAt: "2026-02-02T06:00:00.000Z",
  },
  {
    id: "MEM-2019",
    firstName: "Manoj",
    lastName: "Sen",
    email: "manoj.sen@example.com",
    mobile: "+91 98419 01234",
    gender: "Male",
    dob: "1989-10-21",
    height: "174",
    weight: "77",
    bloodGroup: "A+",
    batchId: "BATCH-04",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "174 cm",
      weight: "77 kg",
      bmi: "25.4",
      bloodGroup: "A+",
    },
    emergencyName: "Swati Sen",
    emergencyPhone: "+91 98419 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Swati Sen",
      phone: "+91 98419 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-20",
      notes: "Full clearance provided.",
    },
    address: "Apt 205, Sterling Terraces, Banashankari, Bengaluru",
    registeredAt: "2026-01-20T06:00:00.000Z",
    updatedAt: "2026-01-20T06:00:00.000Z",
  },
  {
    id: "MEM-2020",
    firstName: "Bhavna",
    lastName: "Dave",
    email: "bhavna.dave@example.com",
    mobile: "+91 98420 12345",
    gender: "Female",
    dob: "1991-07-07",
    height: "161",
    weight: "53",
    bloodGroup: "O-",
    batchId: "BATCH-04",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Quarterly Transformation",
    planId: "PLAN-QUARTERLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "161 cm",
      weight: "53 kg",
      bmi: "20.4",
      bloodGroup: "O-",
    },
    emergencyName: "Nilesh Dave",
    emergencyPhone: "+91 98420 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Nilesh Dave",
      phone: "+91 98420 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-02-18",
      notes: "Fit for active training.",
    },
    address: "Flat 101, Mantri Tranquil, Kanakapura Road, Bengaluru",
    registeredAt: "2026-02-18T06:00:00.000Z",
    updatedAt: "2026-02-18T06:00:00.000Z",
  },
  {
    id: "MEM-2021",
    firstName: "Nikhil",
    lastName: "Bansal",
    email: "nikhil.bansal@example.com",
    mobile: "+91 98421 23456",
    gender: "Male",
    dob: "1996-12-09",
    height: "183",
    weight: "86",
    bloodGroup: "B+",
    batchId: "BATCH-04",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "183 cm",
      weight: "86 kg",
      bmi: "25.7",
      bloodGroup: "B+",
    },
    emergencyName: "Pawan Bansal",
    emergencyPhone: "+91 98421 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "Pawan Bansal",
      phone: "+91 98421 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-26",
      notes: "Heavy barbell clearance granted.",
    },
    address: "Penthouse 4, SNN Raj Serenity, Begur, Bengaluru",
    registeredAt: "2026-01-26T06:00:00.000Z",
    updatedAt: "2026-01-26T06:00:00.000Z",
  },

  // --- BATCH 5 (TTS 08:00 AM - 09:00 AM) ---
  {
    id: "MEM-2022",
    firstName: "Sanjay",
    lastName: "Singhal",
    email: "sanjay.singhal@example.com",
    mobile: "+91 98422 34567",
    gender: "Male",
    dob: "1986-06-30",
    height: "172",
    weight: "75",
    bloodGroup: "A+",
    batchId: "BATCH-05",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Half-Yearly Functional Pass",
    planId: "PLAN-HALF-YEARLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "172 cm",
      weight: "75 kg",
      bmi: "25.4",
      bloodGroup: "A+",
    },
    emergencyName: "Anita Singhal",
    emergencyPhone: "+91 98422 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Anita Singhal",
      phone: "+91 98422 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-17",
      notes: "Cardiac clearance confirmed.",
    },
    address: "House 18, 4th Cross, Malleshwaram, Bengaluru",
    registeredAt: "2026-01-17T08:00:00.000Z",
    updatedAt: "2026-01-17T08:00:00.000Z",
  },
  {
    id: "MEM-2023",
    firstName: "Tanvi",
    lastName: "Kulkarni",
    email: "tanvi.k@example.com",
    mobile: "+91 98423 45678",
    gender: "Female",
    dob: "1997-09-14",
    height: "169",
    weight: "61",
    bloodGroup: "O+",
    batchId: "BATCH-05",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "169 cm",
      weight: "61 kg",
      bmi: "21.4",
      bloodGroup: "O+",
    },
    emergencyName: "Prasad Kulkarni",
    emergencyPhone: "+91 98423 98765",
    emergencyRelation: "Brother",
    emergencyContact: {
      name: "Prasad Kulkarni",
      phone: "+91 98423 98765",
      relation: "Brother",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-21",
      notes: "Cleared for heavy resistance workouts.",
    },
    address: "Flat 402, Godrej Woodsman Estate, Bellary Road, Bengaluru",
    registeredAt: "2026-01-21T08:00:00.000Z",
    updatedAt: "2026-01-21T08:00:00.000Z",
  },
  {
    id: "MEM-2024",
    firstName: "Varun",
    lastName: "Agarwal",
    email: "varun.a@example.com",
    mobile: "+91 98424 56789",
    gender: "Male",
    dob: "1995-02-18",
    height: "178",
    weight: "81",
    bloodGroup: "B+",
    batchId: "BATCH-05",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Quarterly Transformation",
    planId: "PLAN-QUARTERLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "178 cm",
      weight: "81 kg",
      bmi: "25.6",
      bloodGroup: "B+",
    },
    emergencyName: "Mahesh Agarwal",
    emergencyPhone: "+91 98424 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "Mahesh Agarwal",
      phone: "+91 98424 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-02-11",
      notes: "No active injuries.",
    },
    address: "704, L&T Raintree Boulevard, Sahakar Nagar, Bengaluru",
    registeredAt: "2026-02-11T08:00:00.000Z",
    updatedAt: "2026-02-11T08:00:00.000Z",
  },
  {
    id: "MEM-2025",
    firstName: "Aishwarya",
    lastName: "Pillai",
    email: "aishwarya.p@example.com",
    mobile: "+91 98425 67890",
    gender: "Female",
    dob: "1994-11-22",
    height: "165",
    weight: "59",
    bloodGroup: "AB-",
    batchId: "BATCH-05",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "165 cm",
      weight: "59 kg",
      bmi: "21.7",
      bloodGroup: "AB-",
    },
    emergencyName: "Gopal Pillai",
    emergencyPhone: "+91 98425 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "Gopal Pillai",
      phone: "+91 98425 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-29",
      notes: "Regular athlete medical clearance.",
    },
    address: "Villa 3, RMV 2nd Stage, Bengaluru",
    registeredAt: "2026-01-29T08:00:00.000Z",
    updatedAt: "2026-01-29T08:00:00.000Z",
  },

  // --- BATCH 6 (MWF 08:00 PM - 09:00 PM) ---
  {
    id: "MEM-2026",
    firstName: "Aditya",
    lastName: "Verma",
    email: "aditya.verma@example.com",
    mobile: "+91 98426 78901",
    gender: "Male",
    dob: "1998-07-03",
    height: "176",
    weight: "73",
    bloodGroup: "O+",
    batchId: "BATCH-06",
    batchTiming: "08:00 PM - 09:00 PM",
    membershipPlan: "Quarterly Transformation",
    planId: "PLAN-QUARTERLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "176 cm",
      weight: "73 kg",
      bmi: "23.6",
      bloodGroup: "O+",
    },
    emergencyName: "Seema Verma",
    emergencyPhone: "+91 98426 98765",
    emergencyRelation: "Mother",
    emergencyContact: {
      name: "Seema Verma",
      phone: "+91 98426 98765",
      relation: "Mother",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-02-08",
      notes: "Fit for night shift athletic strength session.",
    },
    address: "Flat 201, Brigade Metropolis, Garudacharpalya, Bengaluru",
    registeredAt: "2026-02-08T20:00:00.000Z",
    updatedAt: "2026-02-08T20:00:00.000Z",
  },
  {
    id: "MEM-2027",
    firstName: "Neha",
    lastName: "Bhatt",
    email: "neha.bhatt@example.com",
    mobile: "+91 98427 89012",
    gender: "Female",
    dob: "1996-03-19",
    height: "164",
    weight: "55",
    bloodGroup: "A+",
    batchId: "BATCH-06",
    batchTiming: "08:00 PM - 09:00 PM",
    membershipPlan: "Half-Yearly Functional Pass",
    planId: "PLAN-HALF-YEARLY",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "164 cm",
      weight: "55 kg",
      bmi: "20.4",
      bloodGroup: "A+",
    },
    emergencyName: "Rakesh Bhatt",
    emergencyPhone: "+91 98427 98765",
    emergencyRelation: "Brother",
    emergencyContact: {
      name: "Rakesh Bhatt",
      phone: "+91 98427 98765",
      relation: "Brother",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-24",
      notes: "General gym clearance provided.",
    },
    address: "302, Total Environment Windmills, Whitefield, Bengaluru",
    registeredAt: "2026-01-24T20:00:00.000Z",
    updatedAt: "2026-01-24T20:00:00.000Z",
  },
  {
    id: "MEM-2028",
    firstName: "Rajesh",
    lastName: "Raman",
    email: "rajesh.raman@example.com",
    mobile: "+91 98428 90123",
    gender: "Male",
    dob: "1984-12-16",
    height: "180",
    weight: "85",
    bloodGroup: "B+",
    batchId: "BATCH-06",
    batchTiming: "08:00 PM - 09:00 PM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "180 cm",
      weight: "85 kg",
      bmi: "26.2",
      bloodGroup: "B+",
    },
    emergencyName: "Vidya Raman",
    emergencyPhone: "+91 98428 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Vidya Raman",
      phone: "+91 98428 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-01-13",
      notes: "Cardio fitness test completed. Fit for advanced lifting.",
    },
    address: "101, Prestige Shantiniketan, ITPL Road, Bengaluru",
    registeredAt: "2026-01-13T20:00:00.000Z",
    updatedAt: "2026-01-13T20:00:00.000Z",
  },
  {
    id: "MEM-2029",
    firstName: "Tara",
    lastName: "Srinivasan",
    email: "tara.s@example.com",
    mobile: "+91 98429 01234",
    gender: "Female",
    dob: "2000-08-05",
    height: "162",
    weight: "52",
    bloodGroup: "O+",
    batchId: "BATCH-06",
    batchTiming: "08:00 PM - 09:00 PM",
    membershipPlan: "Annual Pro Strength Pass",
    planId: "PLAN-ANNUAL-PRO",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "162 cm",
      weight: "52 kg",
      bmi: "19.8",
      bloodGroup: "O+",
    },
    emergencyName: "K. Srinivasan",
    emergencyPhone: "+91 98429 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "K. Srinivasan",
      phone: "+91 98429 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2026-02-12",
      notes: "Clearance approved.",
    },
    address: "Apt 504, Assetz Marq, Kannamangala, Bengaluru",
    registeredAt: "2026-02-12T20:00:00.000Z",
    updatedAt: "2026-02-12T20:00:00.000Z",
  },

  // --- PROSPECTIVE LEADS & INACTIVE (FOR FILTER TESTING) ---
  {
    id: "MEM-2030",
    firstName: "Siddharth",
    lastName: "Malhotra",
    email: "sid.m@example.com",
    mobile: "+91 98430 12345",
    gender: "Male",
    dob: "1995-05-18",
    height: "180",
    weight: "80",
    bloodGroup: "O+",
    batchId: "BATCH-01",
    batchTiming: "06:00 AM - 07:00 AM",
    membershipPlan: "Trial Prospect / Free Assessment",
    status: "Lead",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "180 cm",
      weight: "80 kg",
      bmi: "24.7",
      bloodGroup: "O+",
    },
    emergencyName: "Vipin Malhotra",
    emergencyPhone: "+91 98430 98765",
    emergencyRelation: "Father",
    emergencyContact: {
      name: "Vipin Malhotra",
      phone: "+91 98430 98765",
      relation: "Father",
    },
    medicalDoc: {
      submitted: false,
      notes: "Trial session pending medical clearance form.",
    },
    address: "Flat 2B, Ferns City, Doddanekkundi, Bengaluru",
    registeredAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "MEM-2031",
    firstName: "Sunita",
    lastName: "Rao",
    email: "sunita.rao@example.com",
    mobile: "+91 98431 23456",
    gender: "Female",
    dob: "1990-02-14",
    height: "163",
    weight: "64",
    bloodGroup: "B+",
    batchId: "BATCH-02",
    batchTiming: "08:00 AM - 09:00 AM",
    membershipPlan: "Monthly Pass (Paused)",
    status: "Inactive",
    isDeleted: false,
    deletedAt: null,
    physicalStats: {
      height: "163 cm",
      weight: "64 kg",
      bmi: "24.1",
      bloodGroup: "B+",
    },
    emergencyName: "Dr. K. Rao",
    emergencyPhone: "+91 98431 98765",
    emergencyRelation: "Spouse",
    emergencyContact: {
      name: "Dr. K. Rao",
      phone: "+91 98431 98765",
      relation: "Spouse",
    },
    medicalDoc: {
      submitted: true,
      clearanceDate: "2025-11-10",
      notes: "Membership temporarily paused for relocation travel.",
    },
    address: "House 14, 6th Main, Sadashivanagar, Bengaluru",
    registeredAt: "2025-11-10T09:00:00.000Z",
    updatedAt: "2026-02-28T12:00:00.000Z",
  },
];

const LEGACY_MOCK_IDS = ["MEM-1001", "MEM-1002", "MEM-1003", "MEM-1004"];

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MEMBERS));
      return [...SEED_MEMBERS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized = parsed.filter((m) => !LEGACY_MOCK_IDS.includes(m.id));
      if (sanitized.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MEMBERS));
        return [...SEED_MEMBERS];
      }
      return sanitized;
    }
    // If empty array was previously in storage, populate SEED_MEMBERS
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MEMBERS));
    return [...SEED_MEMBERS];
  } catch {
    return [...SEED_MEMBERS];
  }
}

function writeStorage(members) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  } catch {
    // ignore storage write error in restricted env
  }
}

export function getMembers(includeDeleted = false) {
  const all = readStorage();
  if (includeDeleted) return all;
  return all.filter((m) => !m.isDeleted);
}

export function getMemberById(id) {
  if (!id) return null;
  const all = readStorage();
  const searchId = String(id).trim().toLowerCase();
  return all.find((m) => String(m.id).toLowerCase() === searchId) || null;
}

export function createMember(data) {
  const all = readStorage();
  const newMember = {
    id: data.id || `MEM-${Date.now().toString().slice(-4)}`,
    ...data,
    status: data.status || "Active",
    isDeleted: false,
    deletedAt: null,
    registeredAt: data.registeredAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newMember, ...all];
  writeStorage(updated);
  return newMember;
}

export function updateMember(id, updates) {
  const all = readStorage();
  let updatedMember = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      updatedMember = {
        ...m,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedMember;
    }
    return m;
  });
  writeStorage(updated);
  return updatedMember;
}

/**
 * Soft delete: sets isDeleted = true, status = "Archived", preserves member data.
 */
export function softDeleteMember(id) {
  const all = readStorage();
  let deletedMember = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      deletedMember = {
        ...m,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        status: "Archived",
      };
      return deletedMember;
    }
    return m;
  });
  writeStorage(updated);
  return deletedMember;
}

/**
 * Restores a soft-deleted member back to Active status.
 */
export function restoreMember(id) {
  const all = readStorage();
  let restoredMember = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      restoredMember = {
        ...m,
        isDeleted: false,
        deletedAt: null,
        status: "Active",
      };
      return restoredMember;
    }
    return m;
  });
  writeStorage(updated);
  return restoredMember;
}

/**
 * Permanently removes a member record from storage.
 */
export function permanentDeleteMember(id) {
  const all = readStorage();
  const updated = all.filter((m) => m.id !== id);
  writeStorage(updated);
  return true;
}

export function toggleMemberStatus(id) {
  const all = readStorage();
  let toggled = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      const nextStatus = m.status === "Active" ? "Inactive" : "Active";
      toggled = { ...m, status: nextStatus, updatedAt: new Date().toISOString() };
      return toggled;
    }
    return m;
  });
  writeStorage(updated);
  return toggled;
}

/**
 * Converts a prospective Lead into a confirmed Active member with emergency contact,
 * fitness information, membership plan, and payment details.
 */
export function convertLeadToMember(id, additionalDetails = {}) {
  const all = readStorage();
  let converted = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      converted = {
        ...m,
        ...additionalDetails,
        status: "Active",
        convertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return converted;
    }
    return m;
  });
  if (converted) {
    writeStorage(updated);
    return converted;
  }

  // If not found in members storage (e.g. from Inquiry), create directly as an active member:
  const newMember = {
    id: id?.startsWith("MEM-") ? id : `MEM-${Date.now().toString().slice(-4)}`,
    ...additionalDetails,
    status: "Active",
    isDeleted: false,
    convertedAt: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeStorage([newMember, ...all]);
  return newMember;
}
