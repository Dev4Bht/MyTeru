import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@druksave/database";
import { TransactionsService } from "./transactions.service";

describe("TransactionsService", () => {
  let prisma: any;
  let service: TransactionsService;

  const userId = "user-1";
  const transaction = {
    id: "tx-1",
    userId,
    type: "EXPENSE",
    amountNu: new Prisma.Decimal(450),
    categoryId: null,
    category: null,
    merchantId: null,
    merchant: null,
    description: "Internet bill",
    occurredAt: new Date("2026-07-10"),
    createdAt: new Date("2026-07-10"),
    updatedAt: new Date("2026-07-10"),
  };

  beforeEach(() => {
    prisma = {
      transaction: {
        create: jest.fn().mockResolvedValue(transaction),
        findMany: jest.fn().mockResolvedValue([transaction]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(transaction),
        delete: jest.fn().mockResolvedValue(transaction),
        aggregate: jest.fn(),
      },
      merchant: {
        upsert: jest.fn().mockResolvedValue({ id: "merchant-1", name: "Bhutan Telecom" }),
      },
    };
    service = new TransactionsService(prisma);
  });

  describe("create", () => {
    it("creates a transaction without a merchant when none is given", async () => {
      await service.create(userId, {
        type: "EXPENSE",
        amountNu: 450,
        occurredAt: "2026-07-10",
      });

      expect(prisma.merchant.upsert).not.toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId, merchantId: undefined }) }),
      );
    });

    it("upserts the merchant by normalized name when merchantName is given", async () => {
      await service.create(userId, {
        type: "EXPENSE",
        amountNu: 450,
        merchantName: "  Bhutan Telecom  ",
        occurredAt: "2026-07-10",
      });

      expect(prisma.merchant.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { normalizedName: "bhutan telecom" },
          create: { name: "Bhutan Telecom", normalizedName: "bhutan telecom" },
        }),
      );
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ merchantId: "merchant-1" }) }),
      );
    });
  });

  describe("list", () => {
    it("applies default pagination and returns items/total/page/pageSize", async () => {
      const result = await service.list(userId, {});

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20, where: expect.objectContaining({ userId }) }),
      );
      expect(result).toEqual({ items: [transaction], total: 1, page: 1, pageSize: 20 });
    });

    it("applies custom page/pageSize as skip/take", async () => {
      await service.list(userId, { page: 3, pageSize: 10 });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe("findOwnedOrThrow", () => {
    it("throws NotFoundException for a missing transaction", async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOwnedOrThrow(userId, "missing")).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException for another user's transaction", async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...transaction, userId: "user-2" });

      await expect(service.findOwnedOrThrow(userId, transaction.id)).rejects.toThrow(ForbiddenException);
    });

    it("returns the transaction when owned", async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(transaction);

      await expect(service.findOwnedOrThrow(userId, transaction.id)).resolves.toEqual(transaction);
    });
  });

  describe("update / remove", () => {
    it("updates a transaction the user owns", async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(transaction);

      await service.update(userId, transaction.id, { description: "Updated" });

      expect(prisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: transaction.id },
          data: expect.objectContaining({ description: "Updated" }),
        }),
      );
    });

    it("rejects updating another user's transaction", async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...transaction, userId: "user-2" });

      await expect(
        service.update(userId, transaction.id, { description: "Updated" }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it("deletes a transaction the user owns", async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(transaction);

      await service.remove(userId, transaction.id);

      expect(prisma.transaction.delete).toHaveBeenCalledWith({ where: { id: transaction.id } });
    });
  });

  describe("summary", () => {
    it("aggregates income/expense totals and computes a balance for the month", async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amountNu: new Prisma.Decimal(30000) } }) // income
        .mockResolvedValueOnce({ _sum: { amountNu: new Prisma.Decimal(12000) } }); // expense
      prisma.transaction.count.mockResolvedValueOnce(5);

      const result = await service.summary(userId, "2026-07");

      expect(result).toEqual({
        month: "2026-07",
        totalIncomeNu: "30000",
        totalExpenseNu: "12000",
        balanceNu: "18000",
        transactionCount: 5,
      });
    });

    it("defaults sums to zero when there are no transactions", async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amountNu: null } })
        .mockResolvedValueOnce({ _sum: { amountNu: null } });
      prisma.transaction.count.mockResolvedValueOnce(0);

      const result = await service.summary(userId, "2026-07");

      expect(result).toEqual({
        month: "2026-07",
        totalIncomeNu: "0",
        totalExpenseNu: "0",
        balanceNu: "0",
        transactionCount: 0,
      });
    });
  });
});
