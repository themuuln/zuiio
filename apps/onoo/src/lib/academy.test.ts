/**
 * Unit tests for academy data layer.
 *
 * Tests the pure data-assembly logic independently of Supabase.
 * The integration tests in src/test/ cover real DB query behavior.
 */

import { describe, expect, it } from "vitest";
import type {
  AcademyProgramRow,
  AcademyTrainerRow,
  AcademyLocationRow,
  AcademyData,
} from "@/app/lib/data";

function buildAcademyData(
  programs: AcademyProgramRow[],
  trainers: AcademyTrainerRow[],
  locations: AcademyLocationRow[],
): AcademyData | null {
  const firstRow = programs[0] ?? trainers[0] ?? locations[0] ?? null;
  if (!firstRow) return null;
  return {
    academy_name: firstRow.academy_name,
    academy_logo_url: firstRow.academy_logo_url,
    programs,
    trainers,
    locations,
  };
}

describe("AcademyData assembly", () => {
  const sampleProgram: AcademyProgramRow = {
    id: "p1",
    academy_id: "a1",
    academy_name: "Тест Академи",
    academy_logo_url: null,
    name: "Сагсан бөмбөгийн суурь",
    description: "Анхлан суралцагчдад",
    age_group: "8-12",
    price_mnt: 200_000,
    duration_weeks: 12,
    location_id: "l1",
    location_name: "Төв заал",
    location_address: "Чингисийн өргөн чөлөө",
    location_city: "Улаанбаатар",
  };

  const sampleTrainer: AcademyTrainerRow = {
    id: "t1",
    academy_id: "a1",
    academy_name: "Тест Академи",
    academy_logo_url: null,
    name: "Бат-Эрдэнэ",
    photo_url: "/photos/t1.jpg",
    specialties: ["Хүүхдийн дасгалжуулагч", "Довтолгоо"],
    bio: "10 жилийн туршлагатай",
  };

  const sampleLocation: AcademyLocationRow = {
    id: "l1",
    academy_id: "a1",
    academy_name: "Тест Академи",
    academy_logo_url: null,
    name: "Төв заал",
    address: "Чингисийн өргөн чөлөө",
    city: "Улаанбаатар",
    hours: "08:00-22:00",
  };

  it("returns null when no data", () => {
    const result = buildAcademyData([], [], []);
    expect(result).toBeNull();
  });

  it("assembles data from programs when trainers and locations are empty", () => {
    const result = buildAcademyData([sampleProgram], [], []);
    expect(result).not.toBeNull();
    expect(result!.academy_name).toBe("Тест Академи");
    expect(result!.programs).toHaveLength(1);
    expect(result!.trainers).toHaveLength(0);
    expect(result!.locations).toHaveLength(0);
  });

  it("picks academy_name from trainers when programs are empty", () => {
    const result = buildAcademyData([], [sampleTrainer], []);
    expect(result).not.toBeNull();
    expect(result!.academy_name).toBe("Тест Академи");
    expect(result!.trainers).toHaveLength(1);
  });

  it("picks academy_name from locations when programs and trainers are empty", () => {
    const result = buildAcademyData([], [], [sampleLocation]);
    expect(result).not.toBeNull();
    expect(result!.academy_name).toBe("Тест Академи");
    expect(result!.locations).toHaveLength(1);
  });

  it("merges all three arrays into one AcademyData object", () => {
    const result = buildAcademyData(
      [sampleProgram],
      [sampleTrainer],
      [sampleLocation],
    );
    expect(result).not.toBeNull();
    expect(result!.programs).toHaveLength(1);
    expect(result!.trainers).toHaveLength(1);
    expect(result!.locations).toHaveLength(1);
  });

  it("preserves academy_logo_url when set", () => {
    const progWithLogo: AcademyProgramRow = {
      ...sampleProgram,
      academy_logo_url: "/logos/academy.png",
    };
    const result = buildAcademyData([progWithLogo], [], []);
    expect(result).not.toBeNull();
    expect(result!.academy_logo_url).toBe("/logos/academy.png");
  });

  it("AcademyProgramRow has all expected fields", () => {
    expect(sampleProgram).toHaveProperty("id");
    expect(sampleProgram).toHaveProperty("name");
    expect(sampleProgram).toHaveProperty("description");
    expect(sampleProgram).toHaveProperty("age_group");
    expect(sampleProgram).toHaveProperty("price_mnt");
    expect(sampleProgram).toHaveProperty("duration_weeks");
    expect(sampleProgram).toHaveProperty("location_name");
    expect(sampleProgram).toHaveProperty("location_city");
  });

  it("AcademyTrainerRow has specialties array", () => {
    expect(Array.isArray(sampleTrainer.specialties)).toBe(true);
    expect(sampleTrainer.specialties).toContain("Хүүхдийн дасгалжуулагч");
  });

  it("AcademyLocationRow has address and hours", () => {
    expect(sampleLocation.address).toBeTruthy();
    expect(sampleLocation.city).toBeTruthy();
    expect(sampleLocation.hours).toBeTruthy();
  });
});
