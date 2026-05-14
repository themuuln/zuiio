import type {
  BodyType,
  DrivetrainType,
  FuelType,
  TransmissionType,
} from "@/lib/database.types";

export const DEMO_QUEUE_TARGET = 100;

type DemoQueueBlueprint = {
  make: string;
  model: string;
  trim: string;
  baseYear: number;
  color: string;
  engine: string;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: TransmissionType;
  drivetrain: DrivetrainType;
};

const DEMO_QUEUE_BLUEPRINTS: DemoQueueBlueprint[] = [
  {
    make: "Toyota",
    model: "Camry",
    trim: "Hybrid XLE",
    baseYear: 2021,
    color: "Silver",
    engine: "2.5L A25A-FXS Hybrid",
    bodyType: "sedan",
    fuelType: "hybrid",
    transmission: "automatic",
    drivetrain: "fwd",
  },
  {
    make: "Toyota",
    model: "Land Cruiser",
    trim: "ZX",
    baseYear: 2022,
    color: "Black",
    engine: "3.3L V6 Diesel",
    bodyType: "suv",
    fuelType: "diesel",
    transmission: "automatic",
    drivetrain: "4wd",
  },
  {
    make: "Honda",
    model: "Fit",
    trim: "e:HEV Home",
    baseYear: 2020,
    color: "Blue",
    engine: "1.5L Hybrid",
    bodyType: "hatchback",
    fuelType: "hybrid",
    transmission: "cvt",
    drivetrain: "fwd",
  },
  {
    make: "Toyota",
    model: "GR86",
    trim: "RZ",
    baseYear: 2023,
    color: "Red",
    engine: "2.4L Boxer",
    bodyType: "coupe",
    fuelType: "gasoline",
    transmission: "manual",
    drivetrain: "rwd",
  },
  {
    make: "Subaru",
    model: "Outback",
    trim: "Limited",
    baseYear: 2021,
    color: "Green",
    engine: "2.5L Boxer",
    bodyType: "wagon",
    fuelType: "gasoline",
    transmission: "automatic",
    drivetrain: "awd",
  },
  {
    make: "Toyota",
    model: "Hilux",
    trim: "Invincible",
    baseYear: 2022,
    color: "White",
    engine: "2.8L Turbo Diesel",
    bodyType: "pickup",
    fuelType: "diesel",
    transmission: "manual",
    drivetrain: "4wd",
  },
  {
    make: "Toyota",
    model: "Hiace",
    trim: "Super GL",
    baseYear: 2020,
    color: "Pearl",
    engine: "2.8L Diesel",
    bodyType: "van",
    fuelType: "diesel",
    transmission: "automatic",
    drivetrain: "rwd",
  },
  {
    make: "Toyota",
    model: "Sienna",
    trim: "XSE",
    baseYear: 2021,
    color: "Gray",
    engine: "2.5L Hybrid",
    bodyType: "minivan",
    fuelType: "hybrid",
    transmission: "automatic",
    drivetrain: "fwd",
  },
  {
    make: "Mazda",
    model: "MX-5",
    trim: "RF",
    baseYear: 2023,
    color: "Soul Red",
    engine: "2.0L Skyactiv-G",
    bodyType: "convertible",
    fuelType: "gasoline",
    transmission: "manual",
    drivetrain: "rwd",
  },
  {
    make: "Hyundai",
    model: "Ioniq 5",
    trim: "Limited",
    baseYear: 2024,
    color: "White",
    engine: "Dual Motor EV",
    bodyType: "crossover",
    fuelType: "electric",
    transmission: "automatic",
    drivetrain: "awd",
  },
  {
    make: "Renault",
    model: "Duster",
    trim: "Techroad LPG",
    baseYear: 2021,
    color: "Orange",
    engine: "1.6L LPG",
    bodyType: "suv",
    fuelType: "lpg",
    transmission: "manual",
    drivetrain: "awd",
  },
  {
    make: "Nissan",
    model: "Serena",
    trim: "e-Power",
    baseYear: 2022,
    color: "Silver",
    engine: "1.2L e-Power",
    bodyType: "minivan",
    fuelType: "hybrid",
    transmission: "cvt",
    drivetrain: "fwd",
  },
  {
    make: "Tesla",
    model: "Model 3",
    trim: "Long Range",
    baseYear: 2024,
    color: "Black",
    engine: "Dual Motor EV",
    bodyType: "sedan",
    fuelType: "electric",
    transmission: "automatic",
    drivetrain: "awd",
  },
  {
    make: "Ford",
    model: "Transit",
    trim: "CNG",
    baseYear: 2020,
    color: "Blue",
    engine: "3.5L CNG",
    bodyType: "van",
    fuelType: "cng",
    transmission: "automatic",
    drivetrain: "rwd",
  },
  {
    make: "Volkswagen",
    model: "Passat",
    trim: "R-Line",
    baseYear: 2022,
    color: "Gray",
    engine: "2.0L TSI",
    bodyType: "wagon",
    fuelType: "gasoline",
    transmission: "dct",
    drivetrain: "fwd",
  },
  {
    make: "Mitsubishi",
    model: "Pajero Sport",
    trim: "Exceed",
    baseYear: 2021,
    color: "Bronze",
    engine: "2.4L Diesel",
    bodyType: "suv",
    fuelType: "diesel",
    transmission: "automatic",
    drivetrain: "4wd",
  },
];

const DEMO_QUEUE_SERVICES = [
  "Oil change & filter",
  "Brake pad replacement",
  "Tire rotation & balance",
  "Engine diagnostic",
  "Transmission fluid change",
  "AC recharge & service",
  "Timing belt replacement",
  "Suspension check",
  "Wheel alignment",
  "Battery replacement",
  "Coolant flush",
  "Spark plug replacement",
  "Turbo inspection",
  "EV battery health check",
  "Fuel system cleaning",
  "CNG leak inspection",
];

const DEMO_QUEUE_CUSTOMERS = [
  "Bat Erdene",
  "Sukhbold Otgon",
  "Tsetseg Baatar",
  "Gan Zorig",
  "Enkh Tuvshin",
  "Dash Purev",
  "Odkoo Dorj",
  "Naraa Batzorig",
  "Bayarsaikhan Bold",
  "Tuya Chimed",
  "Zolboo Davaa",
  "Amar Ganbold",
  "Batmunkh Khorloo",
  "Munkhbat Tseren",
  "Erdene Otgon",
  "Saruul Bayar",
];

export function buildDemoQueueSeed(index: number, mechanicIds: string[]) {
  const blueprint = DEMO_QUEUE_BLUEPRINTS[index % DEMO_QUEUE_BLUEPRINTS.length];
  const customerName =
    DEMO_QUEUE_CUSTOMERS[index % DEMO_QUEUE_CUSTOMERS.length];
  const [firstName, ...rest] = customerName.split(" ");
  const suffix = String(index + 1).padStart(3, "0");
  const phoneSuffix = String(index + 1).padStart(4, "0");
  const mechanicId =
    mechanicIds.length > 0 ? mechanicIds[index % mechanicIds.length] : null;
  const shouldAssignMechanic =
    mechanicId && index % 5 !== 0 ? mechanicId : null;

  return {
    customer: {
      type: "individual" as const,
      first_name: firstName,
      last_name: rest.join(" ") || null,
      full_name: customerName,
      phone: `9911${phoneSuffix}`,
      email: `demo-${suffix.toLowerCase()}@bayview.tolom.mn`,
      address: null,
      notes: `Bay View demo customer #${suffix}`,
      tags: ["bay-view", "demo"],
    },
    vehicle: {
      plate_number: `BV-${suffix}`,
      vin: `TOLOMBV${String(index + 1).padStart(10, "0")}`,
      chassis_number: `CH${String(index + 1).padStart(10, "0")}`,
      make: blueprint.make,
      model: blueprint.model,
      year: blueprint.baseYear - (index % 3),
      trim: blueprint.trim,
      color: blueprint.color,
      engine: blueprint.engine,
      fuel_type: blueprint.fuelType,
      transmission: blueprint.transmission,
      drivetrain: blueprint.drivetrain,
      body_type: blueprint.bodyType,
      odometer: 8000 + index * 425,
      notes: `${blueprint.bodyType} ${blueprint.fuelType} demo unit`,
      tags: ["bay-view", blueprint.bodyType, blueprint.fuelType],
    },
    mechanicId: shouldAssignMechanic,
    notes: `${DEMO_QUEUE_SERVICES[index % DEMO_QUEUE_SERVICES.length]} — demo queue #${suffix}`,
  };
}
