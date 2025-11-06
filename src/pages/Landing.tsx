import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Sparkles, Tag, Share2, Zap } from "lucide-react";
import { motion } from "framer-motion";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "Beautiful Notes",
      description: "Write in markdown with a clean, distraction-free interface",
    },
    {
      icon: Tag,
      title: "Smart Tags",
      description: "Organize your thoughts with colorful, searchable tags",
    },
    {
      icon: Share2,
      title: "Easy Sharing",
      description: "Generate shareable links for any note in seconds",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Smooth animations and instant search for the best UX",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 pt-32 pb-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <div className="relative">
              {/* removed animated glow to avoid squared shadow around the icon */}
              <Sparkles className="h-20 w-20 text-primary" />
            </div>
          </motion.div>

          {/* increased bottom margin so the subtitle won't overlap the descenders (eg. 'g') */}
          <h1 className="text-6xl md:text-7xl font-bold mb-10">
            <span className="text-primary block">Your thoughts,</span>
            <span className="text-secondary block">beautifully organized</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            VibeNotes is a minimal, elegant note-taking app with powerful
            features. Write, organize, and share your ideas effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="rounded-full text-lg px-8 py-6 animate-scale-in"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/notes")}
              className="rounded-full text-lg px-8 py-6 hover-lift"
            >
              View Demo
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              className="glass rounded-2xl p-6 hover-lift"
            >
              <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl inline-block mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* footer removed: eliminated Lovable footprint */}
    </div>
  );
};

export default Landing;
