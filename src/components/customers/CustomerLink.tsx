import { useCustomerCard } from "@/contexts/CustomerCardContext";

interface CustomerLinkProps {
  email: string;
  children: React.ReactNode;
  className?: string;
}

export default function CustomerLink({ email, children, className = "" }: CustomerLinkProps) {
  const { openCustomerCard } = useCustomerCard();

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        openCustomerCard(email);
      }}
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      style={{ color: "#7F77DD" }}
    >
      {children}
    </span>
  );
}
