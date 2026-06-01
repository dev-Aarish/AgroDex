import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Clock, CheckCircle, Info } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Helmet } from "react-helmet-async";

export default function SessionSettings() {
  const navigate = useNavigate();
  const [sessionDuration, setSessionDuration] = useState<string>("3600"); // 1 heure par défaut
  const [success, setSuccess] = useState<string | null>(null);

  const sessionOptions = [
    { value: "1800", label: "30 minutes" },
    { value: "3600", label: "1 hours" },
    { value: "7200", label: "2 hours" },
    { value: "14400", label: "4 hours" },
    { value: "28800", label: "8 hours" },
    { value: "86400", label: "24 hours" },
    { value: "604800", label: "7 days" },
    { value: "2592000", label: "30 days" },
  ];

  const handleSave = async () => {
    setSuccess(null);

    // Sauvegarder la préférence dans le localStorage
    localStorage.setItem("session_duration_preference", sessionDuration);

    // Rafraîchir la session avec la nouvelle durée
    const { error } = await supabase.auth.refreshSession();

    if (!error) {
      const selectedOption = sessionOptions.find(
        (opt) => opt.value === sessionDuration
      );
      setSuccess(`Updated session duration: ${selectedOption?.label}`);
    }
  };

  const getCurrentSessionInfo = () => {
    const expiresAt = localStorage.getItem("supabase.auth.token")
      ? JSON.parse(localStorage.getItem("supabase.auth.token") || "{}")
          .expires_at
      : null;

    if (expiresAt) {
      const expiryDate = new Date(expiresAt * 1000);
      return expiryDate.toLocaleString("en-US");
    }
    return "Not available";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 dark:bg-background text-foreground p-4">
      <Helmet>
        <title>Session Settings | AgroDex</title>
      </Helmet>
      <div className="container mx-auto max-w-2xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/profile")}
          className="mb-6 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <Card className="bg-card text-card-foreground dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Clock className="h-5 w-5" />
              Session Settings
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Configure the duration of your session validity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {success && (
              <Alert className="border-green-500 dark:border-green-900/30 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Alert className="bg-muted text-muted-foreground border-border">
              <Info className="h-4 w-4 text-foreground" />
              <AlertDescription className="text-foreground">
                <strong>Current session expires on:</strong>{" "}
                {getCurrentSessionInfo()}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="session-duration" className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  Desired Session Duration
                </Label>
                <Select
                  value={sessionDuration}
                  onValueChange={setSessionDuration}
                >
                  <SelectTrigger id="session-duration" className="mt-2 border-gray-300 dark:border-slate-800 dark:bg-slate-900 text-foreground">
                    <SelectValue placeholder="Sélectionner une durée" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border border-border">
                    {sessionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">
                  About the sessions
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>
                    • The session is automatically refreshed before expiration
                  </li>
                  <li>
                    • You remain logged in even after closing the browser
                  </li>
                  <li>• For better security, choose a shorter duration</li>
                  <li>
                    • The maximum server-side duration is 24 hours (JWT)
                  </li>
                </ul>
              </div>

              <Button onClick={handleSave} className="w-full">
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
