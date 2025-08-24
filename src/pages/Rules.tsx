import Layout from "@/components/Layout";
import ValorantCard from "@/components/ValorantCard";

export default function Rules() {
  return (
    <Layout>
      <section className="py-20 bg-valorant-navy min-h-screen">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-teko text-5xl font-bold text-valorant-red mb-4">TOURNAMENT RULES</h2>
            <div className="h-1 w-24 bg-valorant-mint mx-auto mb-6"></div>
            <p className="text-xl opacity-90">Official Spike Rush Cup 2.0 Regulations</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <ValorantCard>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-teko text-2xl font-bold text-valorant-mint mb-4">GENERAL RULES</h3>
                  <ul className="space-y-3 text-valorant-off-white/90">
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>Teams must consist of exactly 5 players</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>All players must be registered on the platform</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>Entry fee of ₹500 per team required</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>Payment proof must be submitted</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>Registration closes 24 hours before tournament</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-teko text-2xl font-bold text-valorant-mint mb-4">GAMEPLAY RULES</h3>
                  <ul className="space-y-3 text-valorant-off-white/90">
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>Tournament Mode: Spike Rush</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>Best of 3 format for all matches</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>No agent restrictions apply</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>Server: Mumbai (Asia)</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-chevron-right text-valorant-red mr-3 mt-1"></i>
                      <span>Disconnections result in automatic loss</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-valorant-red/20 rounded-lg border border-valorant-red/30">
                <h4 className="font-teko text-xl font-bold text-valorant-red mb-2">PRIZE POOL</h4>
                <div className="text-center">
                  <div className="text-4xl font-bold text-valorant-mint mb-2">₹10,000</div>
                  <div className="text-lg text-valorant-off-white">Winner Takes All</div>
                </div>
              </div>
            </ValorantCard>
          </div>
        </div>
      </section>
    </Layout>
  );
}
