import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    smtp_enabled: false,
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

  const tlsMode = useMemo(() => (smtp.smtp_use_ssl ? "ssl" : smtp.smtp_use_tls ? "starttls" : "none"), [smtp]);

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
        smtp_enabled: smtp.smtp_enabled,
        smtp_host: smtp.smtp_host,
        smtp_port: smtp.smtp_port,
        smtp_use_tls: tlsMode === "starttls",
        smtp_use_ssl: tlsMode === "ssl",
        smtp_username: smtp.smtp_username,
        smtp_from_email: smtp.smtp_from_email,
      };
      if (smtp.smtp_password) payload.smtp_password = smtp.smtp_password;
      const res = await workspaceAPI.updateSmtpSettings(workspaceId, payload);
      setSmtp(prev => ({ ...prev, ...res, smtp_password: "" }));
      toast.success("SMTP gespeichert");
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
      const res = await workspaceAPI.testSmtp(workspaceId, to);
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
        toast.error("Nur PDF erlaubt");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Maximal 20 MB");
        return;
      }
      setUploading(true);
      const res = await agentAPI.uploadSendDocument(agentId, {
        file,
        email_default_subject: subject || undefined,
        email_default_body: body || undefined,
      });
      setDocInfo(res);
      toast.success("Upload erfolgreich");
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await agentAPI.deleteSendDocument(agentId);
      setDocInfo({ has_document: false, filename: null, url: null, email_default_subject: null, email_default_body: null });
      toast.success("Dokument entfernt");
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Entfernen fehlgeschlagen");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokumentenversand konfigurieren</DialogTitle>
        </DialogHeader>

        {/* SMTP Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">E‑Mail (SMTP)</div>
              <div className="text-xs text-gray-500">Absender ist immer die Workspace‑E‑Mail</div>
            </div>
            <Switch checked={smtp.smtp_enabled} onCheckedChange={(v) => setSmtp(prev => ({ ...prev, smtp_enabled: v }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>From E‑Mail</Label>
              <Input value={smtp.smtp_from_email} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_from_email: e.target.value }))} placeholder="you@domain.tld" />
            </div>
            <div>
              <Label>Host</Label>
              <Input value={smtp.smtp_host} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_host: e.target.value }))} placeholder="smtp.domain.tld" />
            </div>
            <div>
              <Label>Port</Label>
              <Input type="number" value={smtp.smtp_port} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_port: Number(e.target.value || 0) }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-1">
              <Label>Verschlüsselung</Label>
              <RadioGroup
                value={tlsMode}
                onValueChange={(v) => setSmtp(prev => ({ ...prev, smtp_use_ssl: v === "ssl", smtp_use_tls: v === "starttls" }))}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="starttls" id="tls-starttls" />
                  <Label htmlFor="tls-starttls">STARTTLS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ssl" id="tls-ssl" />
                  <Label htmlFor="tls-ssl">SSL/TLS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="tls-none" />
                  <Label htmlFor="tls-none">Keine</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Benutzername</Label>
              <Input value={smtp.smtp_username} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_username: e.target.value }))} />
            </div>
            <div>
              <Label>Passwort (write‑only)</Label>
              <Input type="password" value={smtp.smtp_password} onChange={(e) => setSmtp(prev => ({ ...prev, smtp_password: e.target.value }))} placeholder={smtp.smtp_password_set ? "••••••" : ""} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveSmtp} disabled={savingSmtp}>{savingSmtp ? "Speichern…" : "Speichern"}</Button>
            <Button size="sm" variant="outline" onClick={handleTestSmtp} disabled={testing}>{testing ? "Testet…" : "Testmail"}</Button>
          </div>
        </div>

        {/* Document Section */}
        <div className="space-y-3 mt-6">
          <div className="text-sm font-medium">Dokument</div>
          {docInfo.has_document ? (
            <div className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
              <span className="text-gray-700">PDF: {docInfo.filename}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => document.getElementById("doc-upload-input")?.click()} disabled={uploading}>Ersetzen</Button>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Entfernt…" : "Entfernen"}</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
              <span className="text-gray-600">Kein Dokument vorhanden</span>
              <Button size="sm" onClick={() => document.getElementById("doc-upload-input")?.click()} disabled={uploading}>{uploading ? "Lädt…" : "Upload"}</Button>
            </div>
          )}

          <input id="doc-upload-input" className="hidden" type="file" accept="application/pdf" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Standard‑Betreff (optional)</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="z. B. Informationen zu Ihrem Anliegen" />
            </div>
            <div>
              <Label>Standard‑Text (optional)</Label>
              <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Kurzer Begleittext. Platzhalter: {current_date}, {lead_name}" />
              <div className="text-xs text-gray-500 mt-1">Nur Platzhalter {"{current_date}"}, {"{lead_name}"} werden ersetzt.</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {!smtp.smtp_enabled && (
            <div className="text-xs text-gray-500">SMTP nicht aktiv – Versand wird serverseitig blockiert.</div>
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Schließen</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


