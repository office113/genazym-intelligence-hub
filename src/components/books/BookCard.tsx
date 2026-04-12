import { X } from "lucide-react";
import { useBookCard } from "@/contexts/BookCardContext";
import BookCardContent from "./BookCardContent";

const MUTED = "#888780";

export default function BookCard() {
  const { bookId, auctionName, closeBookCard } = useBookCard();

  if (!bookId || !auctionName) return null;

  return (
    <>
      {/* Overlay — only show if no customer card open (customer card has its own overlay) */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={closeBookCard}
      />
      {/* Drawer — LEFT side */}
      <div
        className="fixed top-0 left-0 h-screen z-50 bg-white overflow-y-auto"
        style={{
          width: 580,
          borderRight: "0.5px solid rgba(0,0,0,0.15)",
          borderRadius: "0 12px 12px 0",
          boxShadow: "8px 0 30px rgba(0,0,0,0.12)",
        }}
        dir="rtl"
      >
        {/* Close button */}
        <button
          onClick={closeBookCard}
          className="absolute right-4 top-4 z-10 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" style={{ color: MUTED }} />
        </button>

        <div className="p-6">
          <BookCardContent bookId={bookId} auctionName={auctionName} />
        </div>
      </div>
    </>
  );
}
