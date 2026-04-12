import { X } from "lucide-react";
import { useCustomerCard } from "@/contexts/CustomerCardContext";
import { useBookCard } from "@/contexts/BookCardContext";
import CustomerCardContent from "./CustomerCardContent";

const MUTED = "#888780";

export default function CustomerCard() {
  const { customerEmail, closeCustomerCard } = useCustomerCard();
  const { bookId } = useBookCard();

  if (!customerEmail) return null;

  const bookDrawerOpen = !!bookId;
  console.log("[CustomerCard] bookDrawerOpen:", bookDrawerOpen, "bookId:", bookId);

  return (
    <>
      {!bookDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={closeCustomerCard}
        />
      )}
      <div
        className="fixed top-0 right-0 h-screen bg-white overflow-y-auto"
        style={{
          width: 560,
          zIndex: 60,
          borderLeft: "0.5px solid rgba(0,0,0,0.15)",
          borderRadius: "12px 0 0 12px",
          boxShadow: "-8px 0 30px rgba(0,0,0,0.12)",
        }}
        dir="rtl"
      >
        <button
          onClick={closeCustomerCard}
          className="absolute left-4 top-4 z-10 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" style={{ color: MUTED }} />
        </button>
        <div className="p-6">
          <CustomerCardContent email={customerEmail} />
        </div>
      </div>
    </>
  );
}
