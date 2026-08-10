import { describe, expect, it } from "vitest";
import { buildDemoQueueSeed, DEMO_QUEUE_TARGET } from "../bay-view-seed-data";

const MECHANICS = ["m-1", "m-2", "m-3"];

describe("buildDemoQueueSeed", () => {
  it("exports the demo queue target of 100", () => {
    expect(DEMO_QUEUE_TARGET).toBe(100);
  });

  it("is deterministic for the same index and mechanic list", () => {
    expect(buildDemoQueueSeed(7, MECHANICS)).toEqual(
      buildDemoQueueSeed(7, MECHANICS),
    );
    expect(buildDemoQueueSeed(0, [])).toEqual(buildDemoQueueSeed(0, []));
  });

  it("only mechanicId changes when the mechanic list changes", () => {
    const none = buildDemoQueueSeed(1, []);
    const withMechanic = buildDemoQueueSeed(1, MECHANICS);

    expect(withMechanic.customer).toEqual(none.customer);
    expect(withMechanic.vehicle).toEqual(none.vehicle);
    expect(withMechanic.notes).toBe(none.notes);
    expect(withMechanic.mechanicId).toBe("m-2");
  });

  it("builds a complete, well-formed customer for index 0", () => {
    const seed = buildDemoQueueSeed(0, []);

    expect(seed.customer).toEqual({
      type: "individual",
      first_name: "Bat",
      last_name: "Erdene",
      full_name: "Bat Erdene",
      phone: "99110001",
      email: "demo-001@bayview.tolom.mn",
      address: null,
      notes: "Bay View demo customer #001",
      tags: ["bay-view", "demo"],
    });
  });

  it("builds a well-formed vehicle for index 0", () => {
    const seed = buildDemoQueueSeed(0, []);

    expect(seed.vehicle).toMatchObject({
      plate_number: "BV-001",
      vin: "TOLOMBV0000000001",
      chassis_number: "CH0000000001",
      make: "Toyota",
      model: "Camry",
      year: 2021,
      trim: "Hybrid XLE",
      color: "Silver",
      engine: "2.5L A25A-FXS Hybrid",
      fuel_type: "hybrid",
      transmission: "automatic",
      drivetrain: "fwd",
      body_type: "sedan",
      odometer: 8000,
      notes: "sedan hybrid demo unit",
      tags: ["bay-view", "sedan", "hybrid"],
    });
    expect(seed.mechanicId).toBeNull();
  });

  it("splits full_name into first_name and a joined last_name", () => {
    for (let i = 0; i < DEMO_QUEUE_TARGET; i++) {
      const { customer } = buildDemoQueueSeed(i, []);

      expect(customer.type).toBe("individual");
      expect(customer.first_name.length).toBeGreaterThan(0);
      expect(`${customer.first_name} ${customer.last_name}`).toBe(
        customer.full_name,
      );
    }
  });

  it("produces unique, well-formatted identifiers and consistent notes across the whole demo queue", () => {
    const plates = new Set<string>();
    const vins = new Set<string>();
    const chassis = new Set<string>();
    const emails = new Set<string>();
    const phones = new Set<string>();
    const suffixes = new Set<string>();

    for (let i = 0; i < DEMO_QUEUE_TARGET; i++) {
      const { customer, vehicle, notes } = buildDemoQueueSeed(i, []);
      const suffix = String(i + 1).padStart(3, "0");

      expect(vehicle.plate_number).toBe(`BV-${suffix}`);
      expect(vehicle.vin).toBe(`TOLOMBV${String(i + 1).padStart(10, "0")}`);
      expect(vehicle.chassis_number).toBe(
        `CH${String(i + 1).padStart(10, "0")}`,
      );
      expect(customer.email).toBe(`demo-${suffix}@bayview.tolom.mn`);
      expect(customer.phone).toMatch(/^9911\d{4}$/);
      expect(customer.notes).toBe(`Bay View demo customer #${suffix}`);
      expect(notes.endsWith(`demo queue #${suffix}`)).toBe(true);
      expect(customer.address).toBeNull();
      expect(customer.tags).toEqual(["bay-view", "demo"]);
      expect(vehicle.tags).toHaveLength(3);
      expect(vehicle.tags[0]).toBe("bay-view");
      expect(vehicle.tags[1]).toBe(vehicle.body_type);
      expect(vehicle.tags[2]).toBe(vehicle.fuel_type);
      expect(vehicle.odometer).toBe(8000 + i * 425);
      expect(Number.isInteger(vehicle.year)).toBe(true);

      plates.add(vehicle.plate_number);
      vins.add(vehicle.vin);
      chassis.add(vehicle.chassis_number);
      emails.add(customer.email);
      phones.add(customer.phone);
      suffixes.add(suffix);
    }

    expect(plates.size).toBe(DEMO_QUEUE_TARGET);
    expect(vins.size).toBe(DEMO_QUEUE_TARGET);
    expect(chassis.size).toBe(DEMO_QUEUE_TARGET);
    expect(emails.size).toBe(DEMO_QUEUE_TARGET);
    expect(phones.size).toBe(DEMO_QUEUE_TARGET);
    expect(suffixes.size).toBe(DEMO_QUEUE_TARGET);
  });

  it("cycles blueprints, customers and services every 16 seeds", () => {
    const a = buildDemoQueueSeed(0, []);
    const b = buildDemoQueueSeed(16, []);

    expect(b.vehicle.make).toBe(a.vehicle.make);
    expect(b.vehicle.model).toBe(a.vehicle.model);
    expect(b.vehicle.trim).toBe(a.vehicle.trim);
    expect(b.customer.full_name).toBe(a.customer.full_name);
    expect(b.notes.startsWith("Oil change & filter")).toBe(true);
    expect(a.notes.startsWith("Oil change & filter")).toBe(true);
    // Same service, different queue position.
    expect(b.notes).not.toBe(a.notes);
  });

  it("keeps year consistent within the blueprint/year cycle (lcm 48)", () => {
    expect(buildDemoQueueSeed(48, []).vehicle.year).toBe(
      buildDemoQueueSeed(0, []).vehicle.year,
    );
    expect(buildDemoQueueSeed(49, []).vehicle.year).toBe(
      buildDemoQueueSeed(1, []).vehicle.year,
    );
    expect(buildDemoQueueSeed(50, []).vehicle.year).toBe(
      buildDemoQueueSeed(2, []).vehicle.year,
    );
  });

  it("leaves mechanicId null when no mechanics are provided", () => {
    for (let i = 0; i < DEMO_QUEUE_TARGET; i++) {
      expect(buildDemoQueueSeed(i, []).mechanicId).toBeNull();
    }
  });

  it("assigns mechanics in round-robin order", () => {
    expect(buildDemoQueueSeed(1, MECHANICS).mechanicId).toBe("m-2");
    expect(buildDemoQueueSeed(2, MECHANICS).mechanicId).toBe("m-3");
    expect(buildDemoQueueSeed(3, MECHANICS).mechanicId).toBe("m-1");
    expect(buildDemoQueueSeed(4, MECHANICS).mechanicId).toBe("m-2");
    expect(buildDemoQueueSeed(17, MECHANICS).mechanicId).toBe("m-3");
  });

  it("skips mechanic assignment for every 5th seed", () => {
    expect(buildDemoQueueSeed(0, MECHANICS).mechanicId).toBeNull();
    expect(buildDemoQueueSeed(5, MECHANICS).mechanicId).toBeNull();
    expect(buildDemoQueueSeed(10, MECHANICS).mechanicId).toBeNull();
    expect(buildDemoQueueSeed(15, MECHANICS).mechanicId).toBeNull();
    // Adjacent non-multiple still assigns.
    expect(buildDemoQueueSeed(14, MECHANICS).mechanicId).toBe("m-3");
  });
});
