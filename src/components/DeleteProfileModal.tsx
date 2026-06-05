import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
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
      // Soft delete: set deleted_at timestamp
      const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Account Deleted",
        description: "Your profile has been successfully deleted.",
      });

      // Sign out the user
      await signOut();

      // Redirect to home page
      navigate("/");
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
            will be permanently marked for deletion. You will be signed out
            immediately.
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