import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AGB() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
          <h1 className="text-3xl font-bold">Allgemeine Geschäftsbedingungen (AGB) für HotCalls</h1>
          
          <div className="space-y-6 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Geltungsbereich und Vertragspartner</h2>
              <p className="mb-4">
                Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung des Dienstes „HotCalls". HotCalls ist ein umfassendes API‑System zur Verwaltung von KI‑Agenten, Anrufprotokollen, Leads, Workspaces und Kalenderintegrationen.
              </p>
              <p className="mb-4">
                Anbieter dieses Dienstes ist die <strong>malmachen GbR</strong>, Am Stadtpark 25, 94469 Deggendorf, Deutschland. Die Gesellschaft wird vertreten durch die Gesellschafter Marco Jülke, Anton Kirchner, Leonhard Pöppel und Maximilian Huber. Kontakt: Telefon +49 176 42740792, E‑Mail einfach@malmachen.com. Umsatzsteuer‑Identifikationsnummer: DE360599835.
              </p>
              <p>
                Vertragspartner sind der Anbieter und die natürlichen oder juristischen Personen, die sich für die Nutzung der angebotenen Dienste registrieren (nachfolgend „Nutzer").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Leistungsbeschreibung</h2>
              <p className="mb-3">Der Anbieter stellt eine Software‑Plattform zur Verfügung, über die Nutzer</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Benutzerkonten anlegen und verwalten können</li>
                <li>Abonnements (Pläne) definieren und verwalten können</li>
                <li>Workspaces anlegen und Nutzer zuordnen können</li>
                <li>KI‑Agenten einschließlich Telefonnummern und Konfigurationen verwalten können</li>
                <li>Leads anlegen, Metadaten verwalten und die Anrufhistorie einsehen können</li>
                <li>Anrufprotokolle und Analysen erfassen und auswerten können</li>
                <li>Kalender integrieren, Termine testen und Verfügbarkeiten prüfen können</li>
                <li>erweiterte Funktionen wie Authentifizierung, Rollen‑ und Rechteverwaltung, Filter, Sortierung, Analytics, Bulk‑Operationen und Kalendersynchronisation nutzen können</li>
              </ul>
              <p>
                Es handelt sich um eine Software‑as‑a‑Service‑Lösung, die über das Internet bereitgestellt wird. Die genaue Ausgestaltung der Leistungen ergibt sich aus der jeweils gewählten Abonnementstufe und den hierzu veröffentlichten Leistungsbeschreibungen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Registrierung und Vertragsschluss</h2>
              <p>
                Die Nutzung des Dienstes setzt eine Registrierung voraus. Mit Abschluss der Registrierung und der Annahme dieser AGB kommt ein Nutzungsvertrag zwischen Anbieter und Nutzer zustande. Der Nutzer versichert, dass die bei der Registrierung gemachten Angaben wahrheitsgemäß und vollständig sind und er das 18. Lebensjahr vollendet hat oder im Auftrag eines Unternehmens handelt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Rechte und Pflichten des Nutzers</h2>
              <div className="space-y-3">
                <p><strong>Nutzungsberechtigung:</strong> Der Nutzer erhält ein einfaches, nicht übertragbares Recht, die Plattform während der Laufzeit des Vertrages zu nutzen.</p>
                <p><strong>Gesetzeskonforme Nutzung:</strong> Der Nutzer verpflichtet sich, die Dienste ausschließlich im Rahmen der geltenden Gesetze zu verwenden. Insbesondere verpflichtet er sich, nur solche Personen anzurufen oder anzuschreiben, für die er eine gültige Einwilligung bzw. einen zulässigen gesetzlichen Grund besitzt, um sie zu kontaktieren.</p>
                <p><strong>Verbotene Inhalte und Handlungen:</strong> Die Plattform darf nicht zur Durchführung unerlaubter Telefonwerbung, automatisierter Massenanrufe ohne Einwilligung, Betrugsversuche oder sonstiger rechtswidriger Zwecke genutzt werden.</p>
                <p><strong>Pflichten zur Mitwirkung:</strong> Der Nutzer ist verpflichtet, Zugangsdaten geheim zu halten, angemessene Schutzmaßnahmen gegen unbefugte Zugriffe zu treffen und bei der Untersuchung von Störungen mitzuwirken.</p>
                <p><strong>Verantwortung für Daten:</strong> Der Nutzer stellt sicher, dass durch die Verarbeitung der durch ihn eingegebenen oder hochgeladenen Daten keine Rechte Dritter verletzt werden. Er trägt Verantwortung für die Rechtmäßigkeit der Verarbeitung von personenbezogenen Daten seiner Leads und Gesprächspartner.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Vergütung</h2>
              <p>
                Für die Nutzung des Dienstes fallen je nach gewähltem Abonnement Nutzungsentgelte an. Umfang und Höhe der Entgelte ergeben sich aus der jeweiligen Leistungsbeschreibung des gebuchten Tarifes. Die Zahlung erfolgt im Voraus für die jeweils vereinbarte Vertragsperiode. Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zur Plattform zu sperren.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Laufzeit und Kündigung</h2>
              <p>
                Der Vertrag läuft auf unbestimmte Zeit und kann von beiden Parteien mit einer Frist von 14 Tagen zum Ende der jeweils laufenden Vertragsperiode gekündigt werden. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Mit Wirksamwerden der Kündigung wird der Zugang des Nutzers zur Plattform deaktiviert.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Verfügbarkeit und Wartung</h2>
              <p>
                Der Anbieter bemüht sich um eine hohe Verfügbarkeit der Plattform. Wartungsarbeiten, Sicherheits‑Updates oder Maßnahmen zur Optimierung der Leistung können zu kurzfristigen Unterbrechungen führen. Der Anbieter informiert die Nutzer rechtzeitig über planbare Wartungsfenster, soweit dies möglich ist.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Haftung</h2>
              <div className="space-y-3">
                <p><strong>Haftungsumfang:</strong> Der Anbieter haftet nach den gesetzlichen Bestimmungen für Schäden an Leben, Körper oder Gesundheit, die auf einer schuldhaften Pflichtverletzung beruhen, sowie für Schäden, die auf einer vorsätzlichen oder grob fahrlässigen Pflichtverletzung oder Arglist des Anbieters beruhen.</p>
                <p><strong>Begrenzte Haftung:</strong> Bei leicht fahrlässigen Pflichtverletzungen haftet der Anbieter nur für vorhersehbare, vertragstypische Schäden und nur, wenn wesentliche Vertragspflichten verletzt wurden.</p>
                <p><strong>Haftungsausschluss:</strong> Der Anbieter übernimmt keine Haftung für Schäden, die durch unsachgemäße Nutzung der Plattform, technische Störungen außerhalb seines Einflussbereiches oder die Nichteinhaltung gesetzlicher Vorgaben durch den Nutzer entstehen.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Datenschutz</h2>
              <p>
                Der Schutz personenbezogener Daten ist dem Anbieter wichtig. Informationen zur Erhebung und Verarbeitung personenbezogener Daten finden sich in der separaten Datenschutzerklärung.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Änderungen der AGB</h2>
              <p>
                Der Anbieter behält sich das Recht vor, diese AGB bei Änderungen der Rechtslage, der Marktlage oder der technischen Rahmenbedingungen anzupassen. Der Nutzer wird über Änderungen mindestens sechs Wochen vor Inkrafttreten per E‑Mail informiert. Widerspricht der Nutzer der Änderung nicht innerhalb von vier Wochen nach Zugang der Mitteilung, gelten die geänderten AGB als angenommen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Schlussbestimmungen</h2>
              <p>
                Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN‑Kaufrechts. Ausschließlicher Gerichtsstand für Streitigkeiten aus diesem Vertrag ist – soweit gesetzlich zulässig – der Sitz des Anbieters.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Information zur Verbraucherstreitbeilegung</h2>
              <p>
                Die malmachen GbR ist zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle weder verpflichtet noch bereit. Dies gilt gemäß § 36 Verbraucherstreitbeilegungsgesetz (VSBG).
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 