import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ValorantCard from "@/components/ValorantCard";
import GlitchText from "@/components/GlitchText";
import WebGLBackground from "@/components/WebGLBackground";
import WebGLGlitchEffect from "@/components/WebGLGlitchEffect";

export default function Signup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showGlitch, setShowGlitch] = useState(false);
  
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      discordId: "",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: InsertUser) => apiRequest("POST", "/api/auth/signup", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to Nyxxus E-Sports!",
        description: "Your account has been created successfully",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    setShowGlitch(true);
    signupMutation.mutate(data);
    setTimeout(() => setShowGlitch(false), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-valorant-navy p-6">
      {/* Epic WebGL Background Effects */}
      <WebGLBackground intensity={0.7} particleCount={2000} />
      <WebGLGlitchEffect trigger={showGlitch} intensity={1.0} />
      
      {/* Background Effects */}
      <div className="fixed inset-0 hexagon-pattern opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-valorant-navy/80 via-valorant-charcoal/80 to-valorant-navy/80 pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-20">
        <ValorantCard className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-valorant-red rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-user-plus text-white text-2xl"></i>
            </div>
            <h1 className="font-teko text-4xl font-bold mb-2">
              <GlitchText text="JOIN THE FIGHT" />
            </h1>
            <p className="text-valorant-mint">Create your account</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="name" className="text-valorant-mint font-bold">FULL NAME</Label>
              <Input
                id="name"
                {...form.register("name")}
                className="bg-valorant-charcoal border-valorant-red/30 text-valorant-off-white focus:border-valorant-red"
                placeholder="Enter your full name"
                data-testid="input-name"
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>

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
              <Label htmlFor="discordId" className="text-valorant-mint font-bold">DISCORD ID</Label>
              <Input
                id="discordId"
                {...form.register("discordId")}
                className="bg-valorant-charcoal border-valorant-red/30 text-valorant-off-white focus:border-valorant-red"
                placeholder="YourName#1234"
                data-testid="input-discord"
              />
              {form.formState.errors.discordId && (
                <p className="text-red-400 text-sm">{form.formState.errors.discordId.message}</p>
              )}
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-valorant-mint font-bold">PASSWORD</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="bg-valorant-charcoal border-valorant-red/30 text-valorant-off-white focus:border-valorant-red"
                placeholder="Create a password"
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full bg-valorant-red hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
              data-testid="button-signup"
            >
              {signupMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  CREATING ACCOUNT...
                </div>
              ) : (
                <>
                  <i className="fas fa-rocket mr-2"></i>
                  CREATE ACCOUNT
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-valorant-red/20">
            <p className="text-valorant-off-white/70">
              Already have an account?{" "}
              <Link href="/login" className="text-valorant-mint hover:text-valorant-red transition-colors font-bold">
                Login
              </Link>
            </p>
          </div>
        </ValorantCard>
      </div>
    </div>
  );
}
