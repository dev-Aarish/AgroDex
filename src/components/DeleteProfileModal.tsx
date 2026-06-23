import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { deleteAccount } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteProfileModal() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, signOut } = useAuth();
  const { isConnected, disconnect } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user is currently logged in.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Hard-delete via backend — MUST run before signOut().
      // signOut() invalidates the access_token; the backend needs it to
      // authenticate this request. Reversing the order causes a 401.
      await deleteAccount();

      // Step 2: Disconnect Hedera wallet if one is linked.
      // Done before signOut() so the wallet context is still available.
      if (isConnected) {
        await disconnect();
      }

      // Step 3: Invalidate local Supabase session.
      await signOut();

      // Step 4: Redirect to /login with the exact success string from issue #107.
      navigate("/login", {
        state: { message: "Account Deleted Successfully" },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete account";

      toast({
        title: "Deletion Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Profile</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Your profile and all associated data
            will be permanently deleted. You will be signed out immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}