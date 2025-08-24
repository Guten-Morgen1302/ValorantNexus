import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ValorantCard from "@/components/ValorantCard";
import GlitchText from "@/components/GlitchText";
import WebGLBackground from "@/components/WebGLBackground";
import WebGLGlitchEffect from "@/components/WebGLGlitchEffect";

export default function Login() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showGlitch, setShowGlitch] = useState(false);
  
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => apiRequest("POST", "/api/auth?action=login", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth?action=user"] });
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    setShowGlitch(true);
    loginMutation.mutate(data);
    setTimeout(() => setShowGlitch(false), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-valorant-navy p-6">
      {/* Epic WebGL Background Effects */}
      <WebGLBackground intensity={0.6} particleCount={1500} />
      <WebGLGlitchEffect trigger={showGlitch} intensity={1.2} />
      
      {/* Background Effects */}
      <div className="fixed inset-0 hexagon-pattern opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-valorant-navy/80 via-valorant-charcoal/80 to-valorant-navy/80 pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-20">
        <ValorantCard className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-valorant-red rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-gamepad text-white text-2xl"></i>
            </div>
            <h1 className="font-teko text-4xl font-bold mb-2">
              <GlitchText text="NYXXUS E-SPORTS" />
            </h1>
            <p className="text-valorant-mint">Tournament Portal</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-valorant-mint font-bold">EMAIL</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="bg-valorant-charcoal border-valorant-red/30 text-valorant-off-white focus:border-valorant-red"
                placeholder="Enter your email"
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-valorant-mint font-bold">PASSWORD</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="bg-valorant-charcoal border-valorant-red/30 text-valorant-off-white focus:border-valorant-red"
                placeholder="Enter your password"
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-valorant-red hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  LOGGING IN...
                </div>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  LOGIN
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-valorant-red/20">
            <p className="text-valorant-off-white/70">
              Don't have an account?{" "}
              <Link href="/signup" className="text-valorant-mint hover:text-valorant-red transition-colors font-bold">
                Sign Up
              </Link>
            </p>
          </div>
        </ValorantCard>
      </div>
    </div>
  );
}
