import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

/** Bán hàng: yêu cầu mua, cân ở cảng, hóa đơn, khách hàng, công nợ, phiếu thu, tài khoản nhận tiền, khiếu nại. */
export const ROUTES: ManageRoute[] = [
  { path: "/account/purchases", element: lazyPage(() => import("@/features/sales/pages/MyPurchasesPage")) },
  { path: "/account/weighings", element: lazyPage(() => import("@/features/sales/pages/MyWeighingsPage")) },
  { path: "/account/invoices", element: lazyPage(() => import("@/features/sales/pages/MyInvoicesPage")) },
  { path: "/account/invoices/:id/pay", element: lazyPage(() => import("@/features/sales/pages/PayInvoicePage")) },
  { path: "/manage/purchase-requests", element: lazyPage(() => import("@/features/sales/pages/PurchaseRequestsPage")) },
  { path: "/manage/sales-products", element: lazyPage(() => import("@/features/sales/pages/SalesProductsPage")) },
  { path: "/manage/weighings", element: lazyPage(() => import("@/features/sales/pages/WeighingsPage")) },
  { path: "/manage/weighings/:requestId", element: lazyPage(() => import("@/features/sales/pages/RequestWeighingsPage")) },
  { path: "/manage/invoices/new", element: lazyPage(() => import("@/features/sales/pages/InvoiceFormPage")) },
  { path: "/manage/invoices/:id", element: lazyPage(() => import("@/features/sales/pages/InvoiceDetailPage")) },
  { path: "/manage/customers", element: lazyPage(() => import("@/features/customers/pages/CustomersPage")) },
  { path: "/manage/customers/new", element: lazyPage(() => import("@/features/customers/pages/CustomerFormPage")) },
  { path: "/manage/customers/:id", element: lazyPage(() => import("@/features/customers/pages/CustomerDetailPage")) },
  { path: "/manage/customers/:id/edit", element: lazyPage(() => import("@/features/customers/pages/CustomerFormPage")) },
  { path: "/manage/customers/:id/merge", element: lazyPage(() => import("@/features/customers/pages/CustomerMergePage")) },
  { path: "/manage/customer-debts", element: lazyPage(() => import("@/features/customers/pages/CustomerDebtsPage")) },
  { path: "/manage/customer-debts/:customerId", element: lazyPage(() => import("@/features/customers/pages/CustomerDebtPage")) },
  // Ba đường dẫn cố định đứng trước `:id`.
  { path: "/manage/customer-payments/new", element: lazyPage(() => import("@/features/finance/pages/ReceiptFormPage")) },
  { path: "/manage/customer-payments/pay-back", element: lazyPage(() => import("@/features/finance/pages/PayBackPage")) },
  { path: "/manage/customer-payments/awaiting", element: lazyPage(() => import("@/features/finance/pages/AwaitingPaymentsPage")) },
  { path: "/manage/customer-payments/:id", element: lazyPage(() => import("@/features/finance/pages/CustomerPaymentDetailPage")) },
  { path: "/manage/bank-account", element: lazyPage(() => import("@/features/finance/pages/BankAccountPage")) },
  { path: "/account/claims", element: lazyPage(() => import("@/features/claims/pages/ClaimsPage")) },
  { path: "/account/claims/new", element: lazyPage(() => import("@/features/claims/pages/ClaimFormPage")) },
  { path: "/account/claims/:id", element: lazyPage(() => import("@/features/claims/pages/ClaimDetailPage")) },
  { path: "/manage/quality-claims", element: lazyPage(() => import("@/features/claims/pages/QualityClaimsPage")) },
  { path: "/manage/quality-claims/:id", element: lazyPage(() => import("@/features/claims/pages/QualityClaimDetailPage")) },
];
