import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { TagChip } from "@/components/TagChip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const CreateNote = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          title: title.trim(),
          content: content.trim(),
          tags,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Note created!");
      navigate(`/notes/${data.id}`);
    } catch (error) {
      toast.error("Failed to create note");
      console.error("Error creating note:", error);
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/notes")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Edit" : "Preview"}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>

          <Card className="glass rounded-2xl p-8">
            {!showPreview ? (
              <div className="space-y-6">
                {/* Title Input */}
                <Input
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  // keep visual borderless style but add padding so text doesn't touch edges
                  className="text-3xl font-bold border-0 px-3 py-2 focus-visible:ring-0 bg-transparent"
                />

                {/* Tags Input */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      className="rounded-xl"
                    />
                    <Button
                      onClick={addTag}
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, idx) => (
                        <TagChip
                          key={idx}
                          tag={tag}
                          onRemove={() => removeTag(tag)}
                          variant={
                            ["purple", "blue", "green", "orange"][
                              idx % 4
                            ] as any
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Editor */}
                <Textarea
                  placeholder="Write your note in markdown..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  // keep borderless editor but add comfortable padding
                  className="min-h-[400px] border-0 px-3 py-2 focus-visible:ring-0 bg-transparent resize-none"
                />
              </div>
            ) : (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">{title || "Untitled"}</h1>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
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
                  <ReactMarkdown>{content || "*No content yet*"}</ReactMarkdown>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateNote;
