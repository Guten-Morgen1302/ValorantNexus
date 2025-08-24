import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ValorantCard from "@/components/ValorantCard";
import type { TeamWithUser } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamWithUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const { data: teamsData } = useQuery({
    queryKey: ["/api/admin/teams"],
  });

  const { data: registrationStatus } = useQuery({
    queryKey: ["/api/settings/registration-open"],
  });

  const teams = teamsData?.teams || [];

  const filteredTeams = teams.filter((team: TeamWithUser) =>
    team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.leader.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRegistrationMutation = useMutation({
    mutationFn: (registrationOpen: boolean) => 
      apiRequest("POST", "/api/admin/settings/registration-toggle", { registrationOpen }),
    onSuccess: (_, registrationOpen) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/registration-open"] });
      toast({
        title: `Registration ${registrationOpen ? "opened" : "closed"}`,
        description: `Tournament registration is now ${registrationOpen ? "open" : "closed"}`,
      });
    },
  });

  const approveTeamMutation = useMutation({
    mutationFn: (teamId: number) => 
      apiRequest("POST", `/api/admin/teams/${teamId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      toast({
        title: "Team approved",
        description: "The team has been approved successfully",
      });
    },
  });

  const rejectTeamMutation = useMutation({
    mutationFn: ({ teamId, reason }: { teamId: number; reason: string }) => 
      apiRequest("POST", `/api/admin/teams/${teamId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      setRejectionReason("");
      toast({
        title: "Team rejected",
        description: "The team has been rejected",
      });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => 
      apiRequest("DELETE", `/api/admin/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully. The user can now register a new team.",
      });
    },
  });

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
    <div className="min-h-screen bg-valorant-navy p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 hexagon-pattern opacity-30 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-valorant-navy via-valorant-charcoal to-valorant-navy pointer-events-none"></div>
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-teko text-5xl font-bold text-valorant-red mb-4">ADMIN CONTROL PANEL</h2>
          <div className="h-1 w-24 bg-valorant-mint mx-auto mb-6"></div>
          <p className="text-xl opacity-90">Nyxxus E-Sports Tournament Management</p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {/* Admin Controls */}
          <ValorantCard className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h3 className="font-teko text-2xl font-bold text-valorant-mint">REGISTRATION STATUS</h3>
                <p className="text-valorant-off-white/70">Control tournament registration</p>
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-sm">Registration:</span>
                <Button
                  onClick={() => toggleRegistrationMutation.mutate(!registrationStatus?.registrationOpen)}
                  disabled={toggleRegistrationMutation.isPending}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    registrationStatus?.registrationOpen ? 'bg-valorant-mint' : 'bg-gray-600'
                  }`}
                  data-testid="button-toggle-registration"
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    registrationStatus?.registrationOpen ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </Button>
                <span className={`font-bold ${registrationStatus?.registrationOpen ? 'text-valorant-mint' : 'text-gray-400'}`}>
                  {registrationStatus?.registrationOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
          </ValorantCard>
          
          {/* Teams Table */}
          <ValorantCard className="overflow-hidden">
            <div className="p-6 border-b border-valorant-red/20">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <h3 className="font-teko text-2xl font-bold text-valorant-mint mb-4 md:mb-0">REGISTERED TEAMS</h3>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-valorant-navy border border-valorant-red/30 rounded-lg px-4 py-2 pl-10 text-white focus:border-valorant-red focus:outline-none w-64"
                    data-testid="input-search-teams"
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-valorant-mint"></i>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-valorant-navy/50">
                  <tr>
                    <th className="text-left p-4 font-teko text-valorant-mint">ID</th>
                    <th className="text-left p-4 font-teko text-valorant-mint">TEAM NAME</th>
                    <th className="text-left p-4 font-teko text-valorant-mint">LEADER</th>
                    <th className="text-left p-4 font-teko text-valorant-mint">MEMBERS</th>
                    <th className="text-left p-4 font-teko text-valorant-mint">STATUS</th>
                    <th className="text-left p-4 font-teko text-valorant-mint">PAYMENT</th>
                    <th className="text-left p-4 font-teko text-valorant-mint">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-valorant-off-white/70">
                        No teams found
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team: TeamWithUser) => (
                      <tr 
                        key={team.id} 
                        className="border-b border-valorant-red/10 hover:bg-valorant-navy/30 transition-colors"
                        data-testid={`row-team-${team.id}`}
                      >
                        <td className="p-4">#{team.id.toString().padStart(3, '0')}</td>
                        <td className="p-4 font-bold" data-testid={`text-team-name-${team.id}`}>
                          {team.teamName}
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium" data-testid={`text-leader-name-${team.id}`}>
                              {team.leader.name}
                            </div>
                            <div className="text-xs text-valorant-mint" data-testid={`text-leader-email-${team.id}`}>
                              {team.leader.email}
                            </div>
                          </div>
                        </td>
                        <td className="p-4" data-testid={`text-members-count-${team.id}`}>
                          {team.members.length}/5
                        </td>
                        <td className="p-4">
                          <span 
                            className={`${getStatusColor(team.status)} px-2 py-1 rounded text-xs font-bold`}
                            data-testid={`text-team-status-${team.id}`}
                          >
                            {team.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          {team.paymentProofPath ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="w-8 h-8 bg-valorant-mint rounded flex items-center justify-center hover:bg-green-400 transition-colors p-0"
                                  data-testid={`button-view-payment-${team.id}`}
                                >
                                  <i className="fas fa-eye text-valorant-navy"></i>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-valorant-charcoal border-valorant-red/30">
                                <DialogHeader>
                                  <DialogTitle className="text-valorant-mint">Payment Proof</DialogTitle>
                                </DialogHeader>
                                <div className="flex justify-center">
                                  <img 
                                    src={`/uploads/${team.paymentProofPath}`} 
                                    alt="Payment Proof" 
                                    className="max-w-full max-h-96 object-contain rounded"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-valorant-off-white/50">No proof</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            {team.status === "pending" && (
                              <>
                                <Button
                                  onClick={() => approveTeamMutation.mutate(team.id)}
                                  disabled={approveTeamMutation.isPending}
                                  className="px-3 py-1 bg-green-600 rounded text-xs font-bold hover:bg-green-500 transition-colors"
                                  data-testid={`button-approve-${team.id}`}
                                >
                                  APPROVE
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      onClick={() => setSelectedTeam(team)}
                                      className="px-3 py-1 bg-red-600 rounded text-xs font-bold hover:bg-red-500 transition-colors"
                                      data-testid={`button-reject-${team.id}`}
                                    >
                                      REJECT
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-valorant-charcoal border-valorant-red/30">
                                    <DialogHeader>
                                      <DialogTitle className="text-valorant-mint">Reject Team</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <p className="text-valorant-off-white">
                                        Are you sure you want to reject "{selectedTeam?.teamName}"?
                                      </p>
                                      <Textarea
                                        placeholder="Reason for rejection (optional)"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="bg-valorant-navy border-valorant-red/30 text-valorant-off-white"
                                        data-testid="input-rejection-reason"
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          onClick={() => {
                                            if (selectedTeam) {
                                              rejectTeamMutation.mutate({ 
                                                teamId: selectedTeam.id, 
                                                reason: rejectionReason 
                                              });
                                            }
                                          }}
                                          disabled={rejectTeamMutation.isPending}
                                          className="bg-red-600 hover:bg-red-500"
                                          data-testid="button-confirm-reject"
                                        >
                                          CONFIRM REJECT
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                            
                            {/* Delete button - available for all teams */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="px-3 py-1 bg-gray-700 rounded text-xs font-bold hover:bg-gray-600 transition-colors"
                                  data-testid={`button-delete-${team.id}`}
                                >
                                  <i className="fas fa-trash mr-1"></i>DELETE
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-valorant-charcoal border-valorant-red/30">
                                <DialogHeader>
                                  <DialogTitle className="text-valorant-red">Delete Team</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="text-center">
                                    <i className="fas fa-exclamation-triangle text-valorant-red text-4xl mb-4"></i>
                                    <p className="text-valorant-off-white mb-2">
                                      Are you sure you want to permanently delete:
                                    </p>
                                    <p className="font-bold text-valorant-red text-lg">
                                      "{team.teamName}"
                                    </p>
                                    <p className="text-valorant-off-white/70 text-sm mt-2">
                                      This action cannot be undone. The team leader will be able to register a new team.
                                    </p>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      onClick={() => deleteTeamMutation.mutate(team.id)}
                                      disabled={deleteTeamMutation.isPending}
                                      className="bg-red-600 hover:bg-red-500"
                                      data-testid={`button-confirm-delete-${team.id}`}
                                    >
                                      {deleteTeamMutation.isPending ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                          DELETING...
                                        </>
                                      ) : (
                                        <>
                                          <i className="fas fa-trash mr-2"></i>
                                          CONFIRM DELETE
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ValorantCard>
        </div>
      </div>
    </div>
  );
}
