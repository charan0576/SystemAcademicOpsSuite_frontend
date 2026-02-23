import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

export default function StudentDoubts() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [form, setForm] = useState({ subject: "", question: "" });

  useEffect(() => {
    if (profile) loadDoubts();
  }, [profile]);

  const loadDoubts = async () => {
    try {
      const response = await api.get(`/doubts/student/${profile?.user_id}`);
      setDoubts(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/doubts", form);
      toast({ title: "Success", description: "Doubt submitted successfully" });
      setForm({ subject: "", question: "" });
      loadDoubts();
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit doubt", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Doubts</h1>
        <Card>
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required rows={4} />
              </div>
              <Button type="submit">Submit Doubt</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              My Questions ({doubts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {doubts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No doubts submitted yet</p>
            ) : (
              <div className="space-y-4">
                {doubts.map((doubt) => (
                  <div key={doubt._id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{doubt.subject}</div>
                        <div className="text-sm text-muted-foreground">{doubt.created_at}</div>
                      </div>
                      {doubt.reply ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Answered</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                      )}
                    </div>
                    <p className="text-sm">{doubt.question}</p>
                    {doubt.reply && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">Reply from {doubt.replied_by}:</div>
                        <p className="text-sm">{doubt.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
