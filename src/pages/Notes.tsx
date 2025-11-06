import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { TagChip } from "@/components/TagChip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const Notes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      toast.error("Failed to load notes");
      console.error("Error fetching notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
      
      setNotes(notes.filter((note) => note.id !== id));
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error("Error deleting note:", error);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  if (loading || loadingNotes) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
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
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Notes</h1>
              <p className="text-muted-foreground">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </p>
            </div>
            <Button
              onClick={() => navigate("/create")}
              className="rounded-full gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              New Note
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search notes or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-xl glass"
            />
          </div>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground text-lg mb-4">
                {searchQuery ? "No notes found" : "No notes yet"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/create")} variant="outline">
                  Create your first note
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass rounded-2xl p-6 hover-lift cursor-pointer h-full flex flex-col">
                      <div
                        onClick={() => navigate(`/notes/${note.id}`)}
                        className="flex-1"
                      >
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                          {note.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {note.content}
                        </p>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {note.tags.slice(0, 3).map((tag, idx) => (
                              <TagChip
                                key={idx}
                                tag={tag}
                                variant={
                                  ["purple", "blue", "green", "orange"][idx % 4] as any
                                }
                              />
                            ))}
                            {note.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.updated_at).toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Notes;
