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
import { ArrowLeft, Plus, Share2, Copy, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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

  // AI Summary state and handler
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");

  const fetchAISummary = async () => {
    if (!content || content.trim().length === 0) {
      toast.error("Nothing to summarize");
      return;
    }

    const token = import.meta.env.VITE_HUGGINGFACE_TOKEN;
    if (!token) {
      toast.error("Missing Hugging Face token (VITE_HUGGINGFACE_TOKEN)");
      return;
    }

    setSummaryLoading(true);
    setSummaryText("");

    try {
      // Dynamically import the Hugging Face Inference SDK on demand.
      let HfInference: any;
      try {
        const mod = await import("@huggingface/inference");
        HfInference =
          (mod as any).HfInference || (mod as any).default || (mod as any);
      } catch (importErr) {
        console.error("Hugging Face SDK not installed:", importErr);
        toast.error(
          "Hugging Face SDK not installed. Run `npm i @huggingface/inference` and restart."
        );
        return;
      }

      const hf = new HfInference(token);

      // Models have a max input length; if the note exceeds it the provider
      // can return errors like "index out of range in self". Try the full
      // content first and, on that specific failure, retry with truncated text.
      const MAX_CHARS = 3000; // heuristic (safe for BART's ~1k token limit)

      const callSummarize = async (inputText: string) =>
        hf.summarization({
          model: "facebook/bart-large-cnn",
          inputs: inputText,
          parameters: { max_length: 200, min_length: 25 },
        });

      let response: any;
      try {
        response = await callSummarize(content);
      } catch (firstErr: any) {
        const msg =
          (firstErr && (firstErr.message || firstErr.toString())) || "";
        console.warn("First summarization attempt failed:", msg || firstErr);
        if (
          msg.includes("index out of range") ||
          msg.toLowerCase().includes("token") ||
          msg.toLowerCase().includes("input")
        ) {
          const truncated =
            content.slice(0, MAX_CHARS) +
            (content.length > MAX_CHARS ? "\n\n[...truncated]" : "");
          toast.info("Note was too long — summarizing truncated content.");
          try {
            response = await callSummarize(truncated);
          } catch (secondErr) {
            console.error("Retry with truncated content failed:", secondErr);
            throw secondErr;
          }
        } else {
          throw firstErr;
        }
      }

      // Normalize SDK response shapes to a single string
      let out = "";
      if (Array.isArray(response)) {
        const first = response[0];
        out =
          (first && (first.summary_text || first.generated_text)) ||
          JSON.stringify(first || response);
      } else if (response && typeof response === "object") {
        out =
          (response as any).summary_text ||
          (response as any).generated_text ||
          JSON.stringify(response);
      } else if (typeof response === "string") {
        out = response;
      } else {
        out = JSON.stringify(response);
      }

      setSummaryText(out || "(no summary returned)");
      setSummaryOpen(true);
    } catch (err) {
      console.error("Error calling Hugging Face inference via SDK:", err);
      const msg =
        (err && (err.message || err.toString())) || "AI summarization failed";
      if (msg.includes("index out of range")) {
        toast.error(
          "AI summarization failed: input too long even after truncation."
        );
      } else {
        toast.error("AI summarization failed");
      }
    } finally {
      setSummaryLoading(false);
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
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>

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
                onClick={fetchAISummary}
                disabled={summaryLoading}
                className="group flex items-center gap-2 transform transition-all duration-150 hover:scale-105 hover:bg-gradient-to-r hover:from-primary hover:to-secondary hover:text-white hover:shadow-lg"
              >
                <Sparkles className="h-4 w-4 text-primary transition-transform group-hover:rotate-12 group-hover:text-white" />
                {summaryLoading ? "Summarizing..." : "AI Summary"}
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
          <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Summary</DialogTitle>
                <DialogDescription>
                  A concise summary generated by Hugging Face's model.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                {summaryLoading ? (
                  <div className="animate-pulse text-muted-foreground">
                    Summarizing...
                  </div>
                ) : (
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {summaryText || "(no summary)"}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button onClick={() => setSummaryOpen(false)}>Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </main>
    </div>
  );
};

export default NoteDetail;
