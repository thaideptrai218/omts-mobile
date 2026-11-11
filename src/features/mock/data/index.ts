import type { MockModule } from "@/features/mock/models/MockModule";
import { ADMIN_MODULES } from "@/features/mock/data/admin";
import { FARMING_MODULES } from "@/features/mock/data/farming";
import { MONEY_MODULES } from "@/features/mock/data/money";
import { SALES_MODULES } from "@/features/mock/data/sales";

export const MOCK_MODULES: MockModule[] = [...FARMING_MODULES, ...SALES_MODULES, ...MONEY_MODULES, ...ADMIN_MODULES];
