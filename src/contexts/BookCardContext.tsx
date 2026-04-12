import { createContext, useContext, useState, ReactNode } from "react";

interface BookCardContextType {
  bookId: string | null;
  auctionName: string | null;
  openBookCard: (bookId: string, auctionName: string) => void;
  closeBookCard: () => void;
}

const BookCardContext = createContext<BookCardContextType>({
  bookId: null,
  auctionName: null,
  openBookCard: () => {},
  closeBookCard: () => {},
});

export function BookCardProvider({ children }: { children: ReactNode }) {
  const [bookId, setBookId] = useState<string | null>(null);
  const [auctionName, setAuctionName] = useState<string | null>(null);

  const openBookCard = (id: string, auction: string) => {
    if (id) {
      setBookId(id);
      setAuctionName(auction);
    }
  };

  const closeBookCard = () => {
    setBookId(null);
    setAuctionName(null);
  };

  return (
    <BookCardContext.Provider value={{ bookId, auctionName, openBookCard, closeBookCard }}>
      {children}
    </BookCardContext.Provider>
  );
}

export const useBookCard = () => useContext(BookCardContext);
