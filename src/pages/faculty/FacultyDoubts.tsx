import { useEffect, useState } from "react";
import { api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

export default function FacultyDoubts() {
  const { toast } = useToast();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDoubts();
  }, []);

  const loadDoubts = async () => {
    try {
      const response = await api.get("/doubts");
      setDoubts(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleReply = async (doubtId: string) => {
    const reply = replies[doubtId];
    if (!reply?.trim()) {
      toast({ title: "Error", description: "Please enter a reply", variant: "destructive" });
      return;
    }
    try {
      await api.patch(`/doubts/${doubtId}/reply`, { reply });
      toast({ title: "Success", description: "Reply sent successfully" });
      setReplies({ ...replies, [doubtId]: "" });
      loadDoubts();
    } catch (error) {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    }
  };

  const pendingDoubts = doubts.filter(d => !d.reply);
  const answeredDoubts = doubts.filter(d => d.reply);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Student Doubts</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Pending Doubts ({pendingDoubts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDoubts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No pending doubts</p>
            ) : (
              <div className="space-y-4">
                {pendingDoubts.map((doubt) => (
                  <div key={doubt._id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{doubt.student_name}</div>
                        <div className="text-sm text-muted-foreground">{doubt.subject} • {doubt.created_at}</div>
                      </div>
                    </div>
                    <p className="text-sm p-3 bg-muted rounded">{doubt.question}</p>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replies[doubt._id] || ""}
                        onChange={(e) => setReplies({ ...replies, [doubt._id]: e.target.value })}
                        rows={3}
                      />
                      <Button onClick={() => handleReply(doubt._id)}>Send Reply</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {answeredDoubts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Answered Doubts ({answeredDoubts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {answeredDoubts.map((doubt) => (
                  <div key={doubt._id} className="p-4 border rounded-lg space-y-2 opacity-75">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{doubt.student_name}</div>
                        <div className="text-sm text-muted-foreground">{doubt.subject} • {doubt.created_at}</div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Answered</span>
                    </div>
                    <p className="text-sm p-3 bg-muted rounded">{doubt.question}</p>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium mb-1">Your Reply:</div>
                      <p className="text-sm">{doubt.reply}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
