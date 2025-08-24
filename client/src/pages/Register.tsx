import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamSchema, type InsertTeam } from "@shared/schema";
import paymentQrImage from "../assets/payment-qr.png";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import ValorantCard from "@/components/ValorantCard";
import SkewButton from "@/components/SkewButton";
import { Link } from "wouter";

export default function Register() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);
  
  const { data: registrationStatus } = useQuery<{ registrationOpen: boolean }>({
    queryKey: ["/api/settings?action=registration-open"],
  });

  const { data: existingTeam } = useQuery<{ teamName: string; status: string; members: any[] } | null>({
    queryKey: ["/api/teams?action=my-team"],
    retry: false,
  });

  // Check if user can register (no team or has rejected team)
  const canRegister = !existingTeam || existingTeam.status === "rejected";

  const form = useForm<InsertTeam>({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: {
      teamName: "",
      members: [{ ign: "", discord: "" }],
    },
  });

  const members = form.watch("members");
  const totalAmount = members.length * 200; // ₹200 per person

  const addMember = () => {
    if (members.length < 5) {
      form.setValue("members", [...members, { ign: "", discord: "" }]);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = members.filter((_, i) => i !== index);
      form.setValue("members", newMembers);
    }
  };

  const registerMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return fetch("/api/teams?action=register", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
    },
    onSuccess: async (response) => {
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/teams?action=my-team"] });
        const responseData = await response.json();
        const isResubmission = existingTeam && existingTeam.status === "rejected";
        
        toast({
          title: isResubmission ? "🔄 Resubmission Complete!" : "🎉 Registration Complete!",
          description: isResubmission 
            ? "Your team has been resubmitted. Payment verification is in progress. You'll get notified once approved!" 
            : "Your team has been registered. Payment verification is in progress. You'll get notified once approved!",
        });
        setShowPayment(false);
        // Redirect to profile to see status
        setTimeout(() => {
          window.location.href = "/profile";
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: { teamName: string; members: Array<{ ign: string; discord?: string }> }) => {
    console.log("Form submitted with data:", data);
    
    // Basic validation
    if (!data.teamName || data.teamName.trim() === "") {
      toast({
        title: "Team name required",
        description: "Please enter a team name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.members || data.members.length === 0) {
      toast({
        title: "Team members required",
        description: "Please add at least one team member.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if all members have IGNs
    const invalidMembers = data.members.filter(member => !member.ign || member.ign.trim() === "");
    if (invalidMembers.length > 0) {
      toast({
        title: "Member IGNs required",
        description: "Please fill in IGN (In-Game Name) for all team members.",
        variant: "destructive",
      });
      return;
    }
    
    setShowPayment(true);
  };

  const onError = (errors: any) => {
    console.log("Form validation errors:", errors);
    
    // Show specific error messages
    let errorMessage = "Please fix the following issues:\n";
    if (errors.teamName) {
      errorMessage += "• Team name is required\n";
    }
    if (errors.members) {
      if (typeof errors.members === 'object' && errors.members.message) {
        errorMessage += "• " + errors.members.message + "\n";
      } else {
        errorMessage += "• Please check member information\n";
      }
    }
    
    toast({
      title: "Form validation failed",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add team data to form
    const teamName = form.getValues("teamName");
    const members = form.getValues("members");
    
    formData.append("teamName", teamName);
    formData.append("members", JSON.stringify(members));
    
    registerMutation.mutate(formData);
  };

  // Check authentication first
  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <ValorantCard className="text-center max-w-md">
            <div className="w-16 h-16 bg-valorant-red rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-white text-2xl"></i>
            </div>
            <h2 className="font-teko text-4xl font-bold text-valorant-red mb-4">LOGIN REQUIRED</h2>
            <p className="text-valorant-off-white/70 mb-6">
              You must be logged in to register a team for the tournament.
            </p>
            <Link href="/login">
              <SkewButton variant="primary" testId="button-go-login">
                <i className="fas fa-sign-in-alt mr-2"></i>LOGIN NOW
              </SkewButton>
            </Link>
          </ValorantCard>
        </div>
      </Layout>
    );
  }

  if (!registrationStatus?.registrationOpen) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <ValorantCard className="text-center max-w-md">
            <div className="w-16 h-16 bg-valorant-red rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-white text-2xl"></i>
            </div>
            <h2 className="font-teko text-4xl font-bold text-valorant-red mb-4">REGISTRATION CLOSED</h2>
            <p className="text-valorant-off-white/70">
              Tournament registration is currently closed. Please check back later.
            </p>
          </ValorantCard>
        </div>
      </Layout>
    );
  }

  // Block users who have teams that aren't rejected
  if (existingTeam && existingTeam.status !== "rejected") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <ValorantCard className="text-center max-w-md">
            <div className="w-16 h-16 bg-valorant-mint rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-valorant-navy text-2xl"></i>
            </div>
            <h2 className="font-teko text-4xl font-bold text-valorant-mint mb-4">ALREADY REGISTERED</h2>
            <p className="text-valorant-off-white/70 mb-6">
              You have already registered a team for this tournament.
            </p>
            <p className="text-valorant-red font-bold">Team: {existingTeam?.teamName}</p>
            <p className="text-valorant-mint text-sm mt-2">Status: {existingTeam?.status?.toUpperCase()}</p>
          </ValorantCard>
        </div>
      </Layout>
    );
  }

  if (showPayment) {
    return (
      <Layout>
        <section className="py-20 min-h-screen">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <ValorantCard>
                <h3 className="font-teko text-4xl font-bold text-valorant-red mb-6">COMPLETE PAYMENT</h3>
                
                <div className="mb-8">
                  <div className="w-64 h-64 mx-auto bg-white rounded-lg p-4 mb-6 shadow-lg">
                    <img 
                      src={paymentQrImage}
                      alt="Payment QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="mb-6">
                    <p className="text-valorant-mint mb-2 text-lg">💳 Scan QR code to make payment</p>
                    <div className="mb-4">
                      <p className="text-lg text-valorant-mint">Team Members: {members.length}</p>
                      <p className="text-lg text-valorant-off-white/80">₹200 × {members.length} persons</p>
                      <p className="text-4xl font-bold text-valorant-red">₹{totalAmount} Total</p>
                    </div>
                    <p className="text-valorant-off-white/80 text-sm">UPI • TRIS • Supported</p>
                  </div>
                  
                  <div className="bg-valorant-charcoal/50 rounded-lg p-4 mb-6">
                    <h4 className="text-valorant-mint font-bold mb-2">Payment Instructions:</h4>
                    <ol className="text-left text-valorant-off-white/80 text-sm space-y-1">
                      <li>1. Scan the QR code with your UPI app</li>
                      <li>2. Complete the payment of ₹500</li>
                      <li>3. Take a screenshot of payment confirmation</li>
                      <li>4. Upload the screenshot below and submit</li>
                    </ol>
                  </div>
                </div>
                
                <form onSubmit={handlePaymentSubmit}>
                  <div className="mb-6">
                    <Label className="block text-sm font-bold text-valorant-mint mb-2">
                      UPLOAD PAYMENT PROOF *
                    </Label>
                    <input
                      type="file"
                      name="paymentProof"
                      accept=".jpg,.jpeg,.png,.pdf"
                      required
                      className="w-full bg-valorant-charcoal border border-valorant-red/30 rounded-lg px-4 py-3 text-white file:bg-valorant-red file:border-0 file:text-white file:px-4 file:py-2 file:rounded file:mr-4"
                      data-testid="input-payment-proof"
                    />
                    <p className="text-xs text-valorant-mint mt-2">Accepted formats: JPG, PNG, PDF</p>
                  </div>

                  <div className="bg-valorant-navy/30 rounded-lg p-4 mb-6">
                    <p className="text-valorant-mint text-sm flex items-center">
                      <i className="fab fa-discord mr-2"></i>
                      <span>Need help with payment? </span>
                      <a 
                        href="https://discord.gg/BtNqdht2Jd" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-valorant-mint hover:text-white underline font-bold ml-1"
                      >
                        Join our Discord for support
                      </a>
                    </p>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <Button
                      type="button"
                      onClick={() => setShowPayment(false)}
                      className="glass-morphism-light px-8 py-3 font-bold rounded-lg hover:bg-valorant-mint hover:text-valorant-navy"
                      data-testid="button-back"
                    >
                      BACK
                    </Button>
                    <SkewButton 
                      type="submit" 
                      variant="primary" 
                      disabled={registerMutation.isPending}
                      testId="button-submit-proof"
                      className="min-w-[200px]"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                          COMPLETING...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle mr-2"></i>
                          COMPLETE REGISTRATION
                        </>
                      )}
                    </SkewButton>
                  </div>
                </form>
              </ValorantCard>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20 bg-valorant-charcoal min-h-screen">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-teko text-5xl font-bold text-valorant-red mb-4">TEAM REGISTRATION</h2>
            <div className="h-1 w-24 bg-valorant-mint mx-auto mb-6"></div>
            <p className="text-xl opacity-90">Assemble your squad for the ultimate Valorant showdown</p>
            
            {/* Show resubmission message for rejected teams */}
            {existingTeam && existingTeam.status === "rejected" && (
              <div className="mt-8">
                <ValorantCard className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-600/30">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-redo text-white text-xl"></i>
                    </div>
                    <div className="text-left">
                      <h3 className="font-teko text-2xl font-bold text-yellow-400 mb-1">RESUBMISSION AVAILABLE</h3>
                      <p className="text-yellow-200/80">Your previous application was rejected. You can now register a new team.</p>
                    </div>
                  </div>
                  <div className="bg-yellow-900/20 rounded-lg p-4">
                    <p className="text-sm text-yellow-100/90">
                      <strong>Previous Team:</strong> {existingTeam.teamName} • <strong>Status:</strong> REJECTED
                    </p>
                    {existingTeam.rejectionReason && (
                      <p className="text-sm text-yellow-100/70 mt-2">
                        <strong>Reason:</strong> {existingTeam.rejectionReason}
                      </p>
                    )}
                  </div>
                </ValorantCard>
              </div>
            )}
          </div>
          
          <div className="max-w-4xl mx-auto">
            <ValorantCard hover>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = {
                  teamName: form.getValues("teamName"),
                  members: form.getValues("members")
                };
                handleSubmit(formData);
              }} className="space-y-6">
                {/* Team Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="block text-sm font-bold text-valorant-mint mb-2">TEAM NAME *</Label>
                    <Input
                      {...form.register("teamName")}
                      className="w-full bg-valorant-navy border border-valorant-red/30 rounded-lg px-4 py-3 text-white focus:border-valorant-red focus:outline-none"
                      placeholder="Enter your team name"
                      data-testid="input-team-name"
                    />
                    {form.formState.errors.teamName && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.teamName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-bold text-valorant-mint mb-2">TEAM LEADER *</Label>
                    <Input
                      value={user?.name || ""}
                      className="w-full bg-valorant-charcoal border border-valorant-mint/30 rounded-lg px-4 py-3 text-valorant-off-white"
                      readOnly
                      data-testid="text-leader-name"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="block text-sm font-bold text-valorant-mint mb-2">LEADER EMAIL</Label>
                    <Input
                      value={user?.email || ""}
                      className="w-full bg-valorant-charcoal border border-valorant-mint/30 rounded-lg px-4 py-3 text-valorant-off-white"
                      readOnly
                      data-testid="text-leader-email"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-bold text-valorant-mint mb-2">LEADER DISCORD</Label>
                    <Input
                      value={user?.discordId || ""}
                      className="w-full bg-valorant-charcoal border border-valorant-mint/30 rounded-lg px-4 py-3 text-valorant-off-white"
                      readOnly
                      data-testid="text-leader-discord"
                    />
                  </div>
                </div>
                
                {/* Team Members */}
                <div>
                  <h3 className="font-teko text-2xl font-bold text-valorant-red mb-4">TEAM MEMBERS (Up to 5)</h3>
                  <div className="space-y-4">
                    {members.map((member, index) => (
                      <div key={index} className="grid md:grid-cols-2 gap-4 glass-morphism-light rounded-lg p-4">
                        <div>
                          <Label className="block text-sm font-bold text-valorant-mint mb-2">
                            IGN (In-Game Name) *
                          </Label>
                          <Input
                            {...form.register(`members.${index}.ign`)}
                            className="w-full bg-valorant-navy border border-valorant-red/30 rounded-lg px-4 py-3 text-white focus:border-valorant-red focus:outline-none"
                            placeholder="Player IGN"
                            data-testid={`input-member-ign-${index}`}
                          />
                          {form.formState.errors.members?.[index]?.ign && (
                            <p className="text-red-400 text-sm mt-1">{form.formState.errors.members[index]?.ign?.message}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="block text-sm font-bold text-valorant-mint mb-2">
                              Discord (Optional)
                            </Label>
                            <Input
                              {...form.register(`members.${index}.discord`)}
                              className="w-full bg-valorant-navy border border-valorant-red/30 rounded-lg px-4 py-3 text-white focus:border-valorant-red focus:outline-none"
                              placeholder="Discord#1234"
                              data-testid={`input-member-discord-${index}`}
                            />
                          </div>
                          {members.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeMember(index)}
                              className="mt-7 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded"
                              data-testid={`button-remove-member-${index}`}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {members.length < 5 && (
                    <Button
                      type="button"
                      onClick={addMember}
                      className="mt-4 glass-morphism-light px-4 py-2 rounded-lg hover:bg-valorant-mint hover:text-valorant-navy transition-colors"
                      data-testid="button-add-member"
                    >
                      <i className="fas fa-plus mr-2"></i>Add Member
                    </Button>
                  )}
                </div>
                
                <div className="bg-valorant-navy/30 rounded-lg p-4 mb-6">
                  <p className="text-valorant-mint text-sm text-center">
                    <i className="fas fa-question-circle mr-2"></i>
                    <span>Questions about registration? </span>
                    <a 
                      href="https://discord.gg/BtNqdht2Jd" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-valorant-mint hover:text-white underline font-bold"
                    >
                      Get help on Discord
                    </a>
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <SkewButton 
                    type="submit" 
                    testId="button-register-team-submit"
                  >
                    <i className="fas fa-rocket mr-2"></i>REGISTER TEAM
                  </SkewButton>
                </div>
                
                {/* Debug: Show validation errors */}
                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                    <h4 className="text-red-400 font-bold mb-2">Please fix these errors:</h4>
                    <ul className="text-red-300 text-sm space-y-1">
                      {form.formState.errors.teamName && (
                        <li>• Team name is required</li>
                      )}
                      {form.formState.errors.members && (
                        <li>• {form.formState.errors.members.message || 'Check member information'}</li>
                      )}
                      {members.map((_, index) => {
                        const memberErrors = form.formState.errors.members?.[index];
                        if (memberErrors?.ign) {
                          return <li key={index}>• Member {index + 1}: IGN is required</li>;
                        }
                        return null;
                      })}
                    </ul>
                  </div>
                )}
              </form>
            </ValorantCard>
          </div>
        </div>
      </section>
    </Layout>
  );
}
