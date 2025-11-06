import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { TagChip } from "@/components/TagChip";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

const SharedNote = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchSharedNote();
    }
  }, [token]);

  const fetchSharedNote = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("share_token", token)
        .eq("is_public", true)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Note not found or not public");
        navigate("/");
        return;
      }

      setNote(data);
    } catch (error) {
      toast.error("Failed to load shared note");
      console.error("Error fetching shared note:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 flex items-center justify-center">
          <p className="text-muted-foreground">Note not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
              📖 Shared Note (Read Only)
            </div>
            <Button onClick={() => navigate("/auth")} variant="outline">
              Create Your Own
            </Button>
          </div>

          <Card className="glass rounded-2xl p-8">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">{note.title}</h1>
              
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag, idx) => (
                    <TagChip
                      key={idx}
                      tag={tag}
                      variant={
                        ["purple", "blue", "green", "orange"][idx % 4] as any
                      }
                    />
                  ))}
                </div>
              )}

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>

              <div className="pt-6 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Created {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default SharedNote;
