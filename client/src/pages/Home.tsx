import { Link } from "wouter";
import { useState } from "react";
import Layout from "@/components/Layout";
import GlitchText from "@/components/GlitchText";
import SkewButton from "@/components/SkewButton";
import WebGLBackground from "@/components/WebGLBackground";
import WebGLGlitchEffect from "@/components/WebGLGlitchEffect";
import Interactive3DLogo from "@/components/Interactive3DLogo";

export default function Home() {
  const [glitchTrigger, setGlitchTrigger] = useState(false);

  const handleLogoHover = () => {
    setGlitchTrigger(true);
    setTimeout(() => setGlitchTrigger(false), 2000);
  };

  return (
    <Layout>
      {/* Epic WebGL Background Effects */}
      <WebGLBackground intensity={1} particleCount={3000} />
      <WebGLGlitchEffect trigger={glitchTrigger} intensity={0.8} />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative diagonal-section">
        <div className="absolute inset-0 bg-gradient-to-r from-valorant-navy/70 to-valorant-charcoal/70"></div>
        <div className="container mx-auto px-6 text-center relative z-20">
          <div className="mb-8 animate-float">
            {/* Interactive 3D Logo */}
            <div className="flex justify-center mb-6" onMouseEnter={handleLogoHover}>
              <Interactive3DLogo text="NYXXUS" size={1.2} hover={glitchTrigger} />
            </div>
            
            <h1 className="font-teko text-6xl md:text-8xl font-bold mb-4">
              <GlitchText text="NYXXUS E-SPORTS" />
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-valorant-red to-valorant-mint mx-auto mb-6"></div>
            <h2 className="font-teko text-4xl md:text-6xl text-valorant-mint mb-4">PRESENTS</h2>
            <h3 className="font-teko text-5xl md:text-7xl text-valorant-red font-bold animate-pulse-glow">
              SPIKE RUSH CUP 2.0
            </h3>
          </div>
          
          <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90">
            The ultimate Valorant tournament experience. Compete with the best, claim your victory.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link href="/register">
              <SkewButton variant="primary" testId="button-register-team">
                <i className="fas fa-users mr-2"></i>REGISTER TEAM
              </SkewButton>
            </Link>
            <Link href="/rules">
              <SkewButton variant="secondary" testId="button-view-rules">
                <i className="fas fa-book mr-2"></i>VIEW RULES
              </SkewButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Tournament Info Section */}
      <section className="py-20 bg-valorant-charcoal">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-teko text-5xl font-bold text-valorant-red mb-4">TOURNAMENT INFO</h2>
            <div className="h-1 w-24 bg-valorant-mint mx-auto mb-6"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass-morphism rounded-2xl p-6 text-center card-hover">
              <div className="w-16 h-16 bg-valorant-red rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-trophy text-white text-2xl"></i>
              </div>
              <h3 className="font-teko text-2xl font-bold text-valorant-mint mb-2">PRIZE POOL</h3>
              <p className="text-3xl font-bold text-valorant-red">₹10,000</p>
              <p className="text-sm text-valorant-off-white/70">Winner Takes All</p>
            </div>
            
            <div className="glass-morphism rounded-2xl p-6 text-center card-hover">
              <div className="w-16 h-16 bg-valorant-mint rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-valorant-navy text-2xl"></i>
              </div>
              <h3 className="font-teko text-2xl font-bold text-valorant-mint mb-2">TEAM SIZE</h3>
              <p className="text-3xl font-bold text-valorant-red">5 Players</p>
              <p className="text-sm text-valorant-off-white/70">Per Team</p>
            </div>
            
            <div className="glass-morphism rounded-2xl p-6 text-center card-hover">
              <div className="w-16 h-16 bg-valorant-red rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-rupee-sign text-white text-2xl"></i>
              </div>
              <h3 className="font-teko text-2xl font-bold text-valorant-mint mb-2">ENTRY FEE</h3>
              <p className="text-3xl font-bold text-valorant-red">₹200</p>
              <p className="text-sm text-valorant-off-white/70">Per Person</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
