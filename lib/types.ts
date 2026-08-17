// Mirrors of backend DTOs (see backend/src/**/dto/*.dto.ts). Keep in sync
// with the NestJS source of truth — never guess shapes independently.

export type UserRole =
  | "ADMIN"
  | "EMPLOYER"
  | "EMPLOYEE"
  | "SUPPLIER"
  | "LOGISTICS"
  | "NUTRITIONIST";
export type UserStatus = "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  employerId: string | null;
  employerName: string | null;
  employerInviteCode: string | null;
  businessName: string | null;
  fleetName: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  employerId: string | null;
  employerName: string | null;
  businessName: string | null;
  fleetName: string | null;
}

export interface PlatformSettings {
  id: string;
  maxInterestAnnualRateBps: number;
  penaltiesEnabledGlobal: boolean;
  updatedAt: string;
}

export type UpdatePlatformSettingsInput = Partial<
  Pick<PlatformSettings, "maxInterestAnnualRateBps" | "penaltiesEnabledGlobal">
>;

export type WriteOffStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED";

export interface WriteOffRequest {
  id: string;
  creditAccountId: string;
  employeeId: string | null;
  employeeName: string | null;
  employerName: string | null;
  amountKobo: number;
  reason: string;
  status: WriteOffStatus;
  requestedById: string;
  requestedByName: string | null;
  approvedById: string | null;
  approvedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWriteOffInput {
  creditAccountId: string;
  amountKobo: number;
  reason: string;
}

export interface Allergy {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrimaryGoal {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconKey: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type MealPlanStatus =
  | "GENERATING"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "FAILED";

export type MealItemMatchType = "PRIMARY" | "ALTERNATIVE";

export interface MealPlanSummary {
  id: string;
  employeeId: string;
  employeeName: string;
  employerName: string;
  status: MealPlanStatus;
  title: string;
  packageId: string | null;
  failureReason: string | null;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanItem {
  id: string;
  mealSlot: string;
  title: string;
  rationale: string;
  requestedProductName: string;
  productId: string | null;
  productName: string | null;
  matchType: MealItemMatchType;
  quantity: number;
  quantityCanonical: number;
  measureUnitId: string | null;
  measureUnitLabel: string | null;
  sortOrder: number;
}

export interface MealPlanDay {
  id: string;
  dayIndex: number;
  label: string;
  items: MealPlanItem[];
}

export interface MealPlanDetail extends MealPlanSummary {
  days: MealPlanDay[];
  profile: {
    age: number;
    gender: string;
    heightCm: number;
    weightKg: number;
    lifestyle: string;
    activityLevel: string;
    allergies: string[];
    goals: string[];
  } | null;
}

export interface MediaUpload {
  url: string;
  fileId: string;
  name: string;
  thumbnailUrl: string | null;
}

export interface MarketplaceCategory {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  accentColor: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  imageUrl: string;
  accentColor: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface MarketplaceSubcategory {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubcategoryInput {
  categoryId: string;
  name: string;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateSubcategoryInput = Partial<
  Pick<CreateSubcategoryInput, "name" | "sortOrder" | "isActive">
>;

export interface MarketplaceBanner {
  id: string;
  badgeLabel: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaRoute: string | null;
  gradientStart: string;
  gradientEnd: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerInput {
  badgeLabel: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaRoute?: string | null;
  gradientStart: string;
  gradientEnd: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateBannerInput = Partial<CreateBannerInput>;

export interface PerfectForItem {
  title: string;
  description: string;
  imageUrl: string;
}

export interface RatingDistribution {
  star1: number;
  star2: number;
  star3: number;
  star4: number;
  star5: number;
}

export interface MeasureUnit {
  id: string;
  slug: string;
  name: string;
  shortLabel: string;
  kind: string;
  dimension: string;
  milligrams: number | null;
  millilitres: number | null;
  piecesPerUnit: number | null;
  isPurchaseUnit: boolean;
  isRecipeUnit: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MeasureFamily {
  id: string;
  slug: string;
  name: string;
  description: string;
  dimension: string;
  defaultRecipeUnitId: string | null;
  defaultPurchaseUnitId: string | null;
  defaultRecipeUnit: MeasureUnit | null;
  defaultPurchaseUnit: MeasureUnit | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPack {
  id: string;
  sku: string;
  productId: string;
  packUnitId: string;
  packUnit: MeasureUnit;
  brand: string;
  packAmount: number;
  amountMg: number | null;
  amountMl: number | null;
  amountEach: number | null;
  packageLabel: string;
  imageUrl: string;
  priceKobo: number;
  retailPriceKobo: number;
  discountPercent: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPackInput {
  brand: string;
  packUnitId: string;
  packAmount: number;
  packageLabel: string;
  priceKobo: number;
  retailPriceKobo: number;
  sku?: string;
  imageUrl?: string;
  amountMg?: number | null;
  amountMl?: number | null;
  amountEach?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateProductPackInput = Partial<CreateProductPackInput>;

export interface MarketplaceProduct {
  id: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  measureFamilyId: string;
  measureFamily: MeasureFamily;
  name: string;
  imageUrl: string;
  fromPriceKobo: number;
  fromRetailPriceKobo: number;
  discountPercent: number;
  description: string;
  origin: string;
  recipeUnitOverrideMg: number | null;
  recipeUnitOverrideMl: number | null;
  expiresAt: string | null;
  isVerified: boolean;
  bulkAllocationClaimedPercent: number;
  nutritionFacts: Record<string, string>;
  perfectFor: PerfectForItem[];
  tags: string[];
  packs: ProductPack[];
  sortOrder: number;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  ratingDistribution: RatingDistribution;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  items: MarketplaceProduct[];
  total: number;
}

export interface CreateProductInput {
  categoryId: string;
  subcategoryId: string;
  measureFamilyId: string;
  name: string;
  slug?: string;
  imageUrl: string;
  description?: string;
  origin?: string;
  recipeUnitOverrideMg?: number | null;
  recipeUnitOverrideMl?: number | null;
  expiresAt?: string | null;
  isVerified?: boolean;
  bulkAllocationClaimedPercent?: number;
  nutritionFacts?: Record<string, string>;
  perfectFor?: PerfectForItem[];
  tags?: string[];
  packs?: CreateProductPackInput[];
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateProductInput = Omit<Partial<CreateProductInput>, "packs">;

export interface PackageItemInput {
  packId: string;
  quantity: number;
  sortOrder?: number;
}

export interface PackageItem {
  id: string;
  packId: string;
  productId: string;
  quantity: number;
  sortOrder: number;
  name: string;
  brand: string;
  packageLabel: string;
  imageUrl: string;
  priceKobo: number;
  retailPriceKobo: number;
  lineWholesaleKobo: number;
  lineRetailKobo: number;
}

export interface DiscountTier {
  id: string;
  label: string;
  minSpendKobo: number;
  discountPercent: number;
  sortOrder: number;
  isActive: boolean;
}

export interface PackagePricing {
  wholesaleSubtotalKobo: number;
  retailSubtotalKobo: number;
  discountPercent: number;
  savingsKobo: number;
  totalKobo: number;
  appliedTier: DiscountTier | null;
  nextTier: DiscountTier | null;
  nextTierProgress: number;
  nextTierRemainingKobo: number;
}

export interface PackageCreator {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AdminPackage {
  id: string;
  kind: string;
  name: string;
  description: string;
  coverImageUrl: string;
  isPopular: boolean;
  sortOrder: number;
  isActive: boolean;
  visibility: string;
  shareSlug: string;
  shareUrl: string;
  shareBannerUrl: string;
  createdByUserId: string | null;
  createdBy: PackageCreator | null;
  itemSummary: string;
  itemCount: number;
  items: PackageItem[];
  pricing: PackagePricing;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPackageListItem {
  id: string;
  kind: string;
  name: string;
  description: string;
  coverImageUrl: string;
  isPopular: boolean;
  visibility: string;
  shareSlug: string;
  shareUrl: string;
  itemSummary: string;
  itemCount: number;
  pricing: PackagePricing;
  createdBy: PackageCreator | null;
}

export interface CreateAdminPackageInput {
  name: string;
  description?: string;
  coverImageUrl: string;
  isPopular?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  items: PackageItemInput[];
}

export type UpdateAdminPackageInput = Partial<CreateAdminPackageInput>;

export interface CreateDiscountTierInput {
  label: string;
  minSpendKobo: number;
  discountPercent: number;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateDiscountTierInput = Partial<CreateDiscountTierInput>;

export interface CompanyListItem {
  id: string;
  employerId: string;
  name: string;
  inviteCode: string;
}

export type EmployeeVerificationStatus =
  | "INVITED"
  | "REGISTERED"
  | "DOCS_SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type OrderFulfillmentStatus =
  | "DRAFT"
  | "VERIFICATION_HOLD"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "FULFILLED"
  | "CANCELLED"
  | "EXPIRED";

export interface CompanyActivity {
  type: "ORDER" | "VERIFICATION";
  id: string;
  employeeId: string;
  employeeName: string;
  status: string;
  totalKobo?: number;
  occurredAt: string;
}

export interface CompanyPortal {
  id: string;
  employerId: string;
  name: string;
  inviteCode: string;
  employeeCount: number;
  verifiedCount: number;
  pendingVerificationCount: number;
  amountOwedKobo: number;
  totalPurchasesKobo: number;
  remittedKobo: number;
  recentActivity: CompanyActivity[];
}

export interface CompanyEmployee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  verificationStatus: EmployeeVerificationStatus;
  salaryKobo: number;
  exposureKobo: number;
  createdAt: string;
}

export interface VerificationDocument {
  id: string;
  employeeId: string;
  type: "EMPLOYMENT_PROOF" | "PAYROLL_PROOF" | "OTHER";
  status: "UPLOADED" | "SUBMITTED" | "REJECTED";
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  note: string | null;
  createdAt: string;
}

export interface VerificationEmployee {
  id: string;
  userId: string;
  employerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  verificationStatus: EmployeeVerificationStatus;
  salaryKobo: number;
  creditMultiplierBps: number | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  documents: VerificationDocument[];
  createdAt: string;
}

export interface OrderStatusHistory {
  id: string;
  fromStatus: OrderFulfillmentStatus | null;
  toStatus: OrderFulfillmentStatus;
  note: string | null;
  changedById: string | null;
  createdAt: string;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  employerId: string | null;
  employerName: string | null;
  employeeId: string | null;
  verificationStatus: EmployeeVerificationStatus | null;
  businessName: string | null;
  fleetName: string | null;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  platformRole: string | null;
  businessName: string | null;
  fleetName: string | null;
  employerId: string | null;
  employer: {
    id: string;
    name: string;
    inviteCode: string | null;
    payrollDayOfMonth: number | null;
    createdAt: string | null;
  } | null;
  memberships: Array<{
    id: string;
    role: string;
    employerId: string;
    employerName: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    employerId: string;
    employerName: string;
    salaryKobo: number;
    creditMultiplierBps: number | null;
    deductionPercent: number;
    accountStatus: string;
    verificationStatus: EmployeeVerificationStatus;
    verifiedAt: string | null;
    rejectionReason: string | null;
    phone: string | null;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    createdAt: string;
    exposureKobo: number;
    verificationDocuments: VerificationDocument[];
    salaryHistory: Array<{
      id: string;
      salaryKobo: number;
      effectiveAt: string;
      reason: string | null;
    }>;
    orders: Array<{
      id: string;
      totalKobo: number;
      fulfillmentStatus: OrderFulfillmentStatus;
      creditStatus: string;
      createdAt: string;
      items: Array<{ id: string; name: string; quantity: number }>;
      statusHistory: OrderStatusHistory[];
    }>;
    creditAccount: {
      id: string;
      creditLimitKobo: number;
      availableKobo: number;
      reservedKobo: number;
      principalOutstandingKobo: number;
      postedInterestKobo: number;
      postedFeesKobo: number;
      postedPenaltiesKobo: number;
      status: string;
      ledgerEntries: Array<{
        id: string;
        entryType: string;
        amountKobo: number;
        balanceAfterKobo: number;
        createdAt: string;
      }>;
    } | null;
    mealPlans: Array<{
      id: string;
      title: string;
      status: string;
      activatedAt: string | null;
      reviewedAt: string | null;
      createdAt: string;
    }>;
    payrollLines: Array<{
      id: string;
      requestedKobo: number;
      collectedKobo: number;
      status: string;
      salarySnapshotKobo: number;
      deductionPercentSnapshot: number;
      createdAt: string;
      payrollRun: {
        id: string;
        periodStart: string;
        periodEnd: string;
        payrollDate: string;
        status: string;
      };
    }>;
    cookedMeals: Array<{
      id: string;
      recipeId: string;
      recipeTitle: string;
      mealSlot: string;
      cookedAt: string;
      energyKcal: number;
    }>;
  } | null;
  packagesCreated: Array<{
    id: string;
    name: string;
    kind: string;
    visibility: string;
    createdAt: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    status: string;
    readAt: string | null;
    createdAt: string;
  }>;
}

export interface AdminEmployeeDetail {
  id: string;
  employerId: string;
  salaryKobo: number;
  creditMultiplierBps: number | null;
  deductionPercent: number;
  verificationStatus: EmployeeVerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
  };
  employer: { id: string; name: string };
  verificationDocuments: VerificationDocument[];
  salaryHistory: Array<{
    id: string;
    salaryKobo: number;
    effectiveAt: string;
    reason: string | null;
  }>;
  orders: Array<{
    id: string;
    totalKobo: number;
    fulfillmentStatus: OrderFulfillmentStatus;
    creditStatus: string;
    createdAt: string;
    items: Array<{ id: string; name: string; quantity: number }>;
    statusHistory: OrderStatusHistory[];
  }>;
  creditAccount: {
    id: string;
    creditLimitKobo: number;
    availableKobo: number;
    principalOutstandingKobo: number;
    postedInterestKobo: number;
    postedFeesKobo: number;
    postedPenaltiesKobo: number;
    ledgerEntries: Array<{
      id: string;
      entryType: string;
      amountKobo: number;
      balanceAfterKobo: number;
      createdAt: string;
    }>;
  } | null;
}

export type CompanyInvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID";

export interface CompanyInvoice {
  id: string;
  employerId: string;
  periodStart: string;
  periodEnd: string;
  status: CompanyInvoiceStatus;
  subtotalKobo: number;
  feesKobo: number;
  interestKobo: number;
  totalDueKobo: number;
  remittedKobo: number;
  issuedAt: string | null;
  createdAt: string;
  _count?: { lines: number };
}

export interface PickupPoint {
  id: string;
  employerId: string;
  companyId: string;
  label: string;
  addressLine: string;
  city: string;
  state: string | null;
  latitude: number;
  longitude: number;
  isActive: boolean;
  updatedAt: string;
}

export interface CreatePickupPointInput {
  label: string;
  addressLine: string;
  city: string;
  state?: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
}

export type UpdatePickupPointInput = Partial<CreatePickupPointInput>;

export interface DeliverySettings {
  id: string;
  freeDeliveryMinKobo: number;
  deliveryFeeKobo: number;
  updatedAt: string;
}

export interface UpdateDeliverySettingsInput {
  freeDeliveryMinKobo?: number;
  deliveryFeeKobo?: number;
}
