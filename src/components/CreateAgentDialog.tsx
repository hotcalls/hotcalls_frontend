import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAgentDialog({ open, onOpenChange }: CreateAgentDialogProps) {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Hier würde normalerweise die Agent-Erstellung stattfinden
    onOpenChange(false);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen KI-Agenten erstellen</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Schritt {step} von 3
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name</Label>
                <Input id="agentName" placeholder="z.B. Sarah" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Geschlecht</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Geschlecht wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Weiblich</SelectItem>
                    <SelectItem value="male">Männlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice">Stimme</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Stimme wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Freundlich</SelectItem>
                    <SelectItem value="professional">Professionell</SelectItem>
                    <SelectItem value="energetic">Energisch</SelectItem>
                    <SelectItem value="calm">Ruhig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="script">Skript</Label>
                <Textarea 
                  id="script" 
                  placeholder="Geben Sie das Gesprächsskript für den Agenten ein..."
                  className="min-h-[100px]"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="leadSource">Lead Quelle</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Lead Quelle wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Neue Lead Quelle erstellen</p>
                  <p className="text-sm text-muted-foreground">
                    Falls die gewünschte Quelle nicht verfügbar ist
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Erstellen
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="calendar">Mitarbeiter Kalender</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Kalender wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marcus">Marcus Weber</SelectItem>
                    <SelectItem value="lisa">Lisa Müller</SelectItem>
                    <SelectItem value="thomas">Thomas Klein</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Neuen Kalender hinzufügen</p>
                  <p className="text-sm text-muted-foreground">
                    Google oder Outlook Kalender verbinden
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Hinzufügen
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={step === 1}
          >
            Zurück
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext}>Weiter</Button>
          ) : (
            <Button onClick={handleSubmit}>Agent erstellen</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}