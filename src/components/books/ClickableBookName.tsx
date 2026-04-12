import { useBookCard } from "@/contexts/BookCardContext";

interface ClickableBookNameProps {
  bookId: string;
  auctionName: string;
  children: React.ReactNode;
  className?: string;
}

export default function ClickableBookName({ bookId, auctionName, children, className = "" }: ClickableBookNameProps) {
  const { openBookCard } = useBookCard();

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        openBookCard(bookId, auctionName);
      }}
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      style={{ color: "#F59E0B" }}
    >
      {children}
    </span>
  );
}
