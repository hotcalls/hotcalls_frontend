import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, User, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Datenlöschung() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Datenlöschungsantrag:", formData);
    setIsSubmitted(true);
  };

  const isFormValid = formData.name && formData.email && formData.message;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
          </div>

          <div className="text-center space-y-6 py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Antrag übermittelt</h1>
              <p className="text-lg text-gray-600 mb-4">
                Vielen Dank für Ihren Datenlöschungsantrag. Wir haben Ihre Anfrage erhalten und werden diese innerhalb von 30 Tagen bearbeiten.
              </p>
              <p className="text-sm text-gray-500">
                Sie erhalten eine Bestätigung per E-Mail an <strong>{formData.email}</strong>
              </p>
            </div>
            <Button onClick={() => navigate("/login")}>
              Zur Anmeldung
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        </div>

        <div className="space-y-8 text-gray-900">
          <div>
            <h1 className="text-3xl font-bold mb-4">Datenlöschung beantragen</h1>
            <p className="text-lg text-gray-600">
              Nutzen Sie dieses Formular, um die Löschung Ihrer personenbezogenen Daten zu beantragen. 
              Wir werden Ihren Antrag gemäß Art. 17 DSGVO (Recht auf Vergessenwerden) prüfen und bearbeiten.
            </p>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Wichtige Informationen</h2>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Die Bearbeitung Ihres Antrags erfolgt innerhalb von 30 Tagen</li>
              <li>• Sie erhalten eine Bestätigung per E-Mail</li>
              <li>• Gesetzliche Aufbewahrungspflichten können einer sofortigen Löschung entgegenstehen</li>
              <li>• Bei Rückfragen kontaktieren wir Sie unter der angegebenen E-Mail-Adresse</li>
            </ul>
          </div>

          {/* Kontaktformular */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Vollständiger Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Max Mustermann"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  E-Mail-Adresse *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="max.mustermann@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Ihr Antrag *
              </Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Bitte beschreiben Sie Ihren Datenlöschungsantrag. Geben Sie an, welche Daten gelöscht werden sollen und ob Sie bereits Kunde bei HotCalls waren oder sind..."
                rows={6}
                value={formData.message}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Kontaktdaten</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>malmachen GbR</strong></p>
                <p>Am Stadtpark 25, 94469 Deggendorf</p>
                <p>E-Mail: einfach@malmachen.com</p>
                <p>Telefon: +49 176 42740792</p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-lg" 
              disabled={!isFormValid}
            >
              Datenlöschungsantrag senden
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 