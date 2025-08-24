import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ValorantCard from "@/components/ValorantCard";
import GlitchText from "@/components/GlitchText";

interface AdminLoginData {
  username: string;
  password: string;
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<AdminLoginData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: AdminLoginData) => apiRequest("POST", "/api/admin?action=login", data),
    onSuccess: () => {
      toast({
        title: "Admin access granted",
        description: "Welcome to the control panel",
      });
      setLocation("/admin/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Access denied",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminLoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-valorant-navy p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 hexagon-pattern opacity-30 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-valorant-navy via-valorant-charcoal to-valorant-navy pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <ValorantCard className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-valorant-red rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shield-alt text-white text-2xl"></i>
            </div>
            <h1 className="font-teko text-4xl font-bold mb-2">
              <GlitchText text="ADMIN CONTROL" />
            </h1>
            <p className="text-valorant-mint">Nyxxus E-Sports</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="username" className="text-valorant-mint font-bold">USERNAME</Label>
              <Input
                id="username"
                {...form.register("username")}
                className="bg-valorant-charcoal border-valorant-red/30 text-valorant-off-white focus:border-valorant-red"
                placeholder="Enter admin username"
                data-testid="input-admin-username"
              />
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-valorant-mint font-bold">PASSWORD</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="bg-valorant-charcoal border-valorant-red/30 text-valorant-off-white focus:border-valorant-red"
                placeholder="Enter admin password"
                data-testid="input-admin-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-valorant-red hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ACCESSING...
                </div>
              ) : (
                <>
                  <i className="fas fa-key mr-2"></i>
                  ACCESS CONTROL PANEL
                </>
              )}
            </Button>
          </form>
        </ValorantCard>
      </div>
    </div>
  );
}
