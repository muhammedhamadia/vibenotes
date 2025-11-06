import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { TagChip } from "@/components/TagChip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Share2, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_public: boolean;
  share_token: string | null;
}

const NoteDetail = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingNote, setLoadingNote] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchNote();
    }
  }, [user, id]);

  const fetchNote = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setNote(data);
      setTitle(data.title);
      setContent(data.content);
      setTags(data.tags || []);
    } catch (error) {
      toast.error("Failed to load note");
      console.error("Error fetching note:", error);
      navigate("/notes");
    } finally {
      setLoadingNote(false);
    }
  };

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
      const { error } = await supabase
        .from("notes")
        .update({
          title: title.trim(),
          content: content.trim(),
          tags,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Note saved!");
      fetchNote();
    } catch (error) {
      toast.error("Failed to save note");
      console.error("Error saving note:", error);
    } finally {
      setSaving(false);
    }
  };

  const generateShareLink = async () => {
    try {
      let shareToken = note?.share_token;

      if (!shareToken) {
        const { data, error } = await supabase.rpc("generate_share_token");
        if (error) throw error;
        shareToken = data;

        const { error: updateError } = await supabase
          .from("notes")
          .update({ is_public: true, share_token: shareToken })
          .eq("id", id);

        if (updateError) throw updateError;

        fetchNote();
      }

      const shareUrl = `${window.location.origin}/s/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to generate share link");
      console.error("Error generating share link:", error);
    }
  };

  if (loading || loadingNote) {
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
                onClick={generateShareLink}
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Share"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Edit" : "Preview"}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <Card className="glass rounded-2xl p-8">
            {!showPreview ? (
              <div className="space-y-6">
                <Input
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  // keep visual borderless style but add padding so text doesn't touch edges
                  className="text-3xl font-bold border-0 px-3 py-2 focus-visible:ring-0 bg-transparent"
                />

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
                <h1 className="text-3xl font-bold">{title}</h1>
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
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default NoteDetail;
