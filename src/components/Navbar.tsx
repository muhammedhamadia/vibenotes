import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Sparkles className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            VibeNotes
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/notes")}
                className="hover:bg-primary/10"
              >
                My Notes
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="rounded-full">
              Get Started
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};
