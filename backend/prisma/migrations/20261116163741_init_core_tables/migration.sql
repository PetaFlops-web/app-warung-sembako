/*
  Warnings:

  - The values [EMPTY] on the enum `StockStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `AIUsageHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RestockItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockMovement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('TRACKED', 'NOT_TRACKED');

-- DropForeignKey
ALTER TABLE "AIUsageHistory" DROP CONSTRAINT "AIUsageHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_createdById_fkey";

-- DropForeignKey
ALTER TABLE "RestockItem" DROP CONSTRAINT "RestockItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_userId_fkey";

-- DropTable
DROP TABLE "AIUsageHistory";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "RestockItem";

-- DropTable
DROP TABLE "StockMovement";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "MovementType";

-- DropEnum & Recreate StockStatus dengan nilai baru (EMPTY → OUT_OF_STOCK)
DROP TYPE "StockStatus";
CREATE TYPE "StockStatus" AS ENUM ('NORMAL', 'LOW', 'OUT_OF_STOCK');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'KEEPER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" UUID NOT NULL,
    "unit" TEXT NOT NULL,
    "sellingPrice" INTEGER NOT NULL,
    "stockQuantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "minStock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'NORMAL',
    "inventoryType" "InventoryType" NOT NULL DEFAULT 'TRACKED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
