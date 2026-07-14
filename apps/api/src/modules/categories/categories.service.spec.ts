import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { CategoriesService } from "./categories.service";

describe("CategoriesService", () => {
  let prisma: any;
  let service: CategoriesService;

  const userId = "user-1";
  const systemCategory = { id: "cat-system", userId: null, isSystem: true, name: "Food", type: "EXPENSE" };
  const ownedCategory = { id: "cat-owned", userId, isSystem: false, name: "Hobbies", type: "EXPENSE" };
  const othersCategory = { id: "cat-others", userId: "user-2", isSystem: false, name: "Golf", type: "EXPENSE" };

  beforeEach(() => {
    prisma = {
      category: {
        findMany: jest.fn().mockResolvedValue([systemCategory, ownedCategory]),
        create: jest.fn().mockResolvedValue(ownedCategory),
        update: jest.fn().mockResolvedValue({ ...ownedCategory, name: "Renamed" }),
        delete: jest.fn().mockResolvedValue(ownedCategory),
        findUnique: jest.fn(),
      },
    };
    service = new CategoriesService(prisma);
  });

  describe("list", () => {
    it("lists system categories plus the user's own", async () => {
      const result = await service.list(userId, undefined);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: undefined, OR: [{ userId: null }, { userId }] },
        }),
      );
      expect(result).toEqual([systemCategory, ownedCategory]);
    });
  });

  describe("create", () => {
    it("creates a custom category owned by the user", async () => {
      await service.create(userId, { name: "Hobbies", type: "EXPENSE" as const });

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId, name: "Hobbies" }) }),
      );
    });
  });

  describe("update", () => {
    it("throws NotFoundException for a missing category", async () => {
      prisma.category.findUnique.mockResolvedValueOnce(null);

      await expect(service.update(userId, "missing", { name: "X" })).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException when updating a system category", async () => {
      prisma.category.findUnique.mockResolvedValueOnce(systemCategory);

      await expect(service.update(userId, systemCategory.id, { name: "X" })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws ForbiddenException when updating another user's category", async () => {
      prisma.category.findUnique.mockResolvedValueOnce(othersCategory);

      await expect(service.update(userId, othersCategory.id, { name: "X" })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("updates a category the user owns", async () => {
      prisma.category.findUnique.mockResolvedValueOnce(ownedCategory);

      const result = await service.update(userId, ownedCategory.id, { name: "Renamed" });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: ownedCategory.id },
        data: { name: "Renamed" },
      });
      expect(result.name).toBe("Renamed");
    });
  });

  describe("remove", () => {
    it("throws ForbiddenException when deleting a system category", async () => {
      prisma.category.findUnique.mockResolvedValueOnce(systemCategory);

      await expect(service.remove(userId, systemCategory.id)).rejects.toThrow(ForbiddenException);
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it("deletes a category the user owns", async () => {
      prisma.category.findUnique.mockResolvedValueOnce(ownedCategory);

      await service.remove(userId, ownedCategory.id);

      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: ownedCategory.id } });
    });
  });
});
