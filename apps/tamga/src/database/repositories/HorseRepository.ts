import { Q, type Database, type Model } from "@nozbe/watermelondb";
import { database } from "../provider";

const requireDb = (): Database => {
  if (!database) throw new Error("WatermelonDB not available — requires native build");
  return database;
};

const horses = () => requireDb().get<Model>("horses");

export const HorseRepository = {
  async getAllForUser(userId: string): Promise<Model[]> {
    return horses()
      .query(Q.where("owner_id", userId), Q.sortBy("created_at", Q.desc))
      .fetch();
  },

  async getById(id: string): Promise<Model | null> {
    try {
      return await horses().find(id);
    } catch {
      return null;
    }
  },

  async create(data: Record<string, any>): Promise<Model> {
    return requireDb().write(async () => {
      return horses().create((record) => {
        Object.entries(data).forEach(([key, value]) => {
          (record as any).set(key, value);
        });
      });
    });
  },

  async update(id: string, data: Record<string, any>): Promise<void> {
    const horse = await horses().find(id);
    await requireDb().write(async () => {
      await horse.update((record) => {
        Object.entries(data).forEach(([key, value]) => {
          (record as any).set(key, value);
        });
      });
    });
  },

  async delete(id: string): Promise<void> {
    const horse = await horses().find(id);
    await requireDb().write(async () => {
      await horse.destroyPermanently();
    });
  },
};
