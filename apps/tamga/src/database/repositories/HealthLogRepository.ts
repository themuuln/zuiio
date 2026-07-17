import { Q, type Database, type Model } from "@nozbe/watermelondb";
import { database } from "../provider";

const requireDb = (): Database => {
  if (!database) throw new Error("WatermelonDB not available — requires native build");
  return database;
};

const healthLogs = () => requireDb().get<Model>("health_logs");

export const HealthLogRepository = {
  async getAllForHorse(horseId: string): Promise<Model[]> {
    return healthLogs()
      .query(Q.where("horse_id", horseId), Q.sortBy("date", Q.desc))
      .fetch();
  },

  async getById(id: string): Promise<Model | null> {
    try {
      return await healthLogs().find(id);
    } catch {
      return null;
    }
  },

  async create(data: Record<string, any>): Promise<Model> {
    return requireDb().write(async () => {
      return healthLogs().create((record) => {
        Object.entries(data).forEach(([key, value]) => {
          (record as any).set(key, value);
        });
      });
    });
  },

  async delete(id: string): Promise<void> {
    const log = await healthLogs().find(id);
    await requireDb().write(async () => {
      await log.destroyPermanently();
    });
  },
};
