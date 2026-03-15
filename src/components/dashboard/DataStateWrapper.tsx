import { ReactNode } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface DataStateWrapperProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty?: boolean;
  children: ReactNode;
}

export default function DataStateWrapper({ isLoading, error, isEmpty, children }: DataStateWrapperProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin ml-2" />
        <span className="text-sm">טוען נתונים...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-destructive">
        <AlertCircle className="w-6 h-6 mb-2" />
        <span className="text-sm font-medium">שגיאה בטעינת נתונים</span>
        <span className="text-xs text-muted-foreground mt-1 max-w-md text-center">{error.message}</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <span className="text-sm">אין נתונים להצגה</span>
      </div>
    );
  }

  return <>{children}</>;
}
