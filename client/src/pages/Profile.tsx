import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import ValorantCard from "@/components/ValorantCard";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: team, refetch } = useQuery({
    queryKey: ["/api/teams?action=my-team"],
    retry: false,
    refetchInterval: 30000, // Check for updates every 30 seconds
  });

  // Show notification when team status changes
  useEffect(() => {
    if (team?.status === "approved") {
      toast({
        title: "🎉 Team Approved!",
        description: "Congratulations! Your team has been approved for the tournament. Get ready to compete!",
        duration: 10000,
      });
    } else if (team?.status === "rejected" && team?.rejectionReason) {
      toast({
        title: "❌ Registration Issues",
        description: `Your registration was rejected: ${team.rejectionReason}`,
        variant: "destructive",
        duration: 10000,
      });
    }
  }, [team?.status, team?.rejectionReason, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  return (
    <Layout>
      <section className="py-20 bg-valorant-charcoal min-h-screen">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-teko text-5xl font-bold text-valorant-red mb-4">PLAYER PROFILE</h2>
            <div className="h-1 w-24 bg-valorant-mint mx-auto"></div>
          </div>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* User Info */}
            <ValorantCard>
              <h3 className="font-teko text-2xl font-bold text-valorant-mint mb-4">PLAYER INFO</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-valorant-off-white/70">Name:</span>
                  <span data-testid="text-user-name">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-valorant-off-white/70">Email:</span>
                  <span data-testid="text-user-email">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-valorant-off-white/70">Discord:</span>
                  <span data-testid="text-user-discord">{user?.discordId}</span>
                </div>
              </div>
            </ValorantCard>
            
            {/* Team Status */}
            <ValorantCard>
              <h3 className="font-teko text-2xl font-bold text-valorant-mint mb-4">TEAM STATUS</h3>
              {team ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Team Name:</span>
                    <span className="font-bold" data-testid="text-team-name">{team.teamName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <span 
                      className={`${getStatusColor(team.status)} px-3 py-1 rounded-full text-xs font-bold text-white`}
                      data-testid="text-team-status"
                    >
                      {team.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Members:</span>
                    <span data-testid="text-team-members">{team.members?.length || 0}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment:</span>
                    {team.paymentProofPath ? (
                      <i className="fas fa-check text-valorant-mint" data-testid="icon-payment-verified"></i>
                    ) : (
                      <i className="fas fa-times text-valorant-red" data-testid="icon-payment-pending"></i>
                    )}
                  </div>
                  
                  {team.status === "approved" && (
                    <div className="mt-4 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                      <div className="flex items-center">
                        <i className="fas fa-trophy text-yellow-400 mr-2"></i>
                        <h4 className="font-bold text-green-400">🎉 Ready to Compete!</h4>
                      </div>
                      <p className="text-green-300 text-sm mt-2">Your team is approved and ready for the tournament. Good luck!</p>
                    </div>
                  )}
                  
                  {team.status === "pending" && (
                    <div className="mt-4 p-4 bg-orange-900/20 rounded-lg border border-orange-500/30">
                      <div className="flex items-center">
                        <i className="fas fa-clock text-orange-400 mr-2"></i>
                        <h4 className="font-bold text-orange-400">⏳ Under Review</h4>
                      </div>
                      <p className="text-orange-300 text-sm mt-2">Payment verification in progress. You'll be notified once approved!</p>
                    </div>
                  )}
                  
                  {team.status === "rejected" && team.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                      <div className="flex items-center">
                        <i className="fas fa-exclamation-triangle text-red-400 mr-2"></i>
                        <h4 className="font-bold text-red-400 mb-2">❌ Registration Issues</h4>
                      </div>
                      <p className="text-red-300 text-sm" data-testid="text-rejection-reason">{team.rejectionReason}</p>
                      <p className="text-red-200 text-xs mt-2">Please contact support or resubmit with correct information.</p>
                    </div>
                  )}
                  
                  {/* Payment Proof */}
                  {team.paymentProofPath && (
                    <div className="mt-6 pt-4 border-t border-valorant-red/20">
                      <h4 className="font-bold text-valorant-mint mb-2">Payment Proof:</h4>
                      <div className="w-full h-32 bg-valorant-navy rounded-lg flex items-center justify-center border border-valorant-red/30 overflow-hidden">
                        <img 
                          src={`/uploads/${team.paymentProofPath}`} 
                          alt="Payment Proof"
                          className="max-w-full max-h-full object-contain"
                          data-testid="img-payment-proof"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-users text-4xl text-valorant-mint/50 mb-4"></i>
                  <p className="text-valorant-off-white/70" data-testid="text-no-team">No team registered yet</p>
                  <p className="text-sm text-valorant-mint mt-2">Register your team to participate in the tournament</p>
                </div>
              )}
            </ValorantCard>
          </div>
        </div>
      </section>
    </Layout>
  );
}
