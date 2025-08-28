import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { workspaceAPI, agentAPI } from "@/lib/apiService";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string;
  agentId: string;
  onChanged?: () => void; // notify parent to refresh card status
};

export default function DocumentSendDialog({ open, onOpenChange, workspaceId, agentId, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [smtp, setSmtp] = useState({
    smtp_enabled: true,
    smtp_host: "",
    smtp_port: 587,
    smtp_use_tls: true,
    smtp_use_ssl: false,
    smtp_username: "",
    smtp_from_email: "",
    smtp_password: "",
    smtp_password_set: false,
  });

  const [docInfo, setDocInfo] = useState<{
    has_document: boolean;
    filename: string | null;
    url: string | null;
    email_default_subject: string | null;
    email_default_body: string | null;
  }>({ has_document: false, filename: null, url: null, email_default_subject: null, email_default_body: null });

  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");

  // Auto-detect transport security: Port 465 => SSL, otherwise STARTTLS
  const computedUseSSL = smtp.smtp_port === 465;
  const computedUseTLS = !computedUseSSL; // default to STARTTLS for non-465

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        const [smtpRes, docRes] = await Promise.all([
          workspaceAPI.getSmtpSettings(workspaceId),
          agentAPI.getSendDocument(agentId),
        ]);
        setSmtp(prev => ({ ...prev, ...smtpRes, smtp_password: "" }));
        setDocInfo(docRes);
        setSubject(docRes.email_default_subject || "");
        setBody(docRes.email_default_body || "");
      } catch (e: any) {
        toast.error(e?.message || "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, workspaceId, agentId]);

  const handleSaveSmtp = async () => {
    try {
      setSavingSmtp(true);
      const payload: any = {
        // Immer aktiv speichern (kein UI-Switch mehr)
        smtp_enabled: true,
        smtp_host: smtp.smtp_host,
        smtp_port: smtp.smtp_port,
        smtp_use_tls: computedUseTLS,
        smtp_use_ssl: computedUseSSL,
        smtp_username: smtp.smtp_username,
        smtp_from_email: smtp.smtp_from_email,
      };
      if (smtp.smtp_password) payload.smtp_password = smtp.smtp_password;
      const res = await workspaceAPI.updateSmtpSettings(workspaceId, payload);
      setSmtp(prev => ({ ...prev, ...res, smtp_password: "" }));

      // Save default subject/body for the agent without re-uploading a file
      try {
        await agentAPI.updateSendDocumentDefaults(agentId, {
          email_default_subject: subject ?? "",
          email_default_body: body ?? "",
        });
      } catch {}

      toast.success("Einstellungen gespeichert");
    } catch (e: any) {
      toast.error(e?.message || "SMTP konnte nicht gespeichert werden");
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    try {
      setTesting(true);
      const to = smtp.smtp_from_email || "";
      if (!to) {
        toast.error("Bitte Absender‑E‑Mail setzen");
        return;
      }
      // Optional: warn if no document uploaded
      if (!docInfo?.has_document) {
        toast.info("Hinweis: Es ist noch kein PDF hochgeladen – Testmail wird ohne Anhang gesendet.");
      }
      const res = await workspaceAPI.testSmtp(workspaceId, to, {
        agent_id: agentId,
        subject: subject || undefined,
        body: body || undefined,
      });
      if (res?.success) toast.success("Testmail gesendet"); else toast.error(res?.error || "Test fehlgeschlagen");
    } catch (e: any) {
      toast.error(e?.message || "Test fehlgeschlagen");
    } finally {
      setTesting(false);
    }
  };

  const handleUpload = async (file?: File) => {
    try {
      if (!file) return;
      if (file.type !== "application/pdf") {
        toast.error("PDF only allowed");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Maximum 20 MB");
        return;
      }
      setUploading(true);
      const res = await agentAPI.uploadSendDocument(agentId, {
        file,
        email_default_subject: subject || undefined,
        email_default_body: body || undefined,
      });
      setDocInfo(res);
      toast.success("Upload successful");
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await agentAPI.deleteSendDocument(agentId);
      setDocInfo({ has_document: false, filename: null, url: null, email_default_subject: null, email_default_body: null });
      toast.success("Document removed");
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Remove failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl w-[640px] max-w-[95vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Dokumentenversand konfigurieren</DialogTitle>
          <DialogDescription>SMTP konfigurieren und PDF festlegen, das der Agent versendet.</DialogDescription>
        </DialogHeader>

        {/* SMTP Section */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">E‑Mail (SMTP)</div>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-[2] min-w-0">
              <Label>From E‑Mail</Label>
              <Input className="w-full" value={smtp.smtp_from_email} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_from_email: e.target.value }))} placeholder="you@domain.tld" />
            </div>
            <div className="flex-1 min-w-0">
              <Label>Host</Label>
              <Input className="w-full truncate" value={smtp.smtp_host} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_host: e.target.value }))} placeholder="smtp.domain.tld" />
            </div>
            <div className="basis-24 shrink-0">
              <Label>Port</Label>
              <Input className="w-full text-center" type="number" min={1} max={65535} step={1} value={smtp.smtp_port} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_port: Number(e.target.value || 0) }))} placeholder="587" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="min-w-0 md:col-span-1 overflow-hidden">
              <Label>Benutzername</Label>
              <Input className="w-full truncate" value={smtp.smtp_username} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_username: e.target.value }))} />
            </div>
            <div className="min-w-0 md:col-span-1 overflow-hidden">
              <Label>Passwort</Label>
              <Input className="w-full truncate" type="password" value={smtp.smtp_password} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_password: e.target.value }))} placeholder={smtp.smtp_password_set ? "••••••" : ""} />
            </div>
            <div className="hidden md:block" />
          </div>

          {/* Save/Test actions moved to footer */}
        </div>

        {/* Document Section */}
        <div className="space-y-3 mt-6">
          <div className="text-sm font-medium">Dokument</div>
          {docInfo.has_document ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                value={`PDF: ${docInfo.filename || ''}`}
                readOnly
                className="truncate cursor-default"
                title={docInfo.filename || ''}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => document.getElementById("doc-upload-input")?.click()} disabled={uploading}>Ersetzen</Button>
                <Button size="sm" variant="destructive" className="whitespace-nowrap" onClick={handleDelete} disabled={deleting}>{deleting ? "Entfernt…" : "Entfernen"}</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input value="Kein Dokument vorhanden" readOnly className="cursor-default" />
              <Button size="sm" className="whitespace-nowrap" onClick={() => document.getElementById("doc-upload-input")?.click()} disabled={uploading}>{uploading ? "Lädt…" : "Upload"}</Button>
            </div>
          )}

          <input id="doc-upload-input" className="hidden" type="file" accept="application/pdf" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Standard‑Betreff (optional)</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} onBlur={async () => {
                try {
                  await agentAPI.updateSendDocumentDefaults(agentId, { email_default_subject: subject || null as any });
                } catch {}
              }} placeholder="z. B. Informationen zu Ihrem Anliegen" />
            </div>
            <div>
              <Label>Standard‑Text (optional)</Label>
              <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} onBlur={async () => {
                try {
                  await agentAPI.updateSendDocumentDefaults(agentId, { email_default_body: body || null as any });
                } catch {}
              }} placeholder="Kurzer Begleittext. Platzhalter: {current_date}, {lead_name}" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveSmtp} disabled={savingSmtp}>{savingSmtp ? "Speichern…" : "Speichern"}</Button>
            <Button size="sm" variant="outline" onClick={handleTestSmtp} disabled={testing}>{testing ? "Testet…" : "Testmail"}</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Schließen</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


