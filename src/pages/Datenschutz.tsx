import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Datenschutz() {
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
          <h1 className="text-3xl font-bold">Datenschutzerklärung für HotCalls</h1>
          
          <div className="space-y-6 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
              <p className="mb-4">Verantwortlich für die Datenverarbeitung im Zusammenhang mit „HotCalls" ist die malmachen GbR:</p>
              <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm mb-4">
                malmachen GbR<br />
                Am Stadtpark 25<br />
                94469 Deggendorf<br />
                Deutschland<br />
                Tel.: +49 176 42740792<br />
                E‑Mail: einfach@malmachen.com<br />
                Vertretungsberechtigte Gesellschafter: Marco Jülke, Anton Kirchner, Leonhard Pöppel, Maximilian Huber<br />
                Umsatzsteuer‑Identifikationsnummer: DE360599835
              </div>
              <p>Wir sind zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle weder verpflichtet noch bereit.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Datenverarbeitung beim Besuch der Website und Nutzung der Plattform</h2>
              
              <h3 className="text-lg font-semibold mb-2">2.1 Bereitstellung der Plattform und Logfiles</h3>
              <p className="mb-4">
                Bei jedem Zugriff auf unsere Server werden automatisch Informationen erfasst, die Ihr Browser an uns übermittelt. Dazu gehören u. a. IP‑Adresse, Datum und Uhrzeit des Zugriffs, angeforderte URL, Browsertyp und Betriebssystem. Die Erhebung dieser Daten ist technisch erforderlich, um Ihnen die Inhalte anzuzeigen und die Stabilität und Sicherheit zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO).
              </p>

              <h3 className="text-lg font-semibold mb-2">2.2 Registrierung und Benutzerverwaltung</h3>
              <p className="mb-4">
                Für die Nutzung unserer Dienste ist eine Registrierung erforderlich. Wir verarbeiten dabei Stammdaten wie Name, Benutzername, E‑Mail‑Adresse, Passwort‑Hash und optional Telefonnummer sowie Angaben zu Workspace‑Zugehörigkeit und Berechtigungen. Diese Daten benötigen wir zur Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO) und zur Verwaltung von Benutzerkonten.
              </p>

              <h3 className="text-lg font-semibold mb-2">2.3 Abonnement‑ und Zahlungsdaten</h3>
              <p className="mb-4">
                Bei Abschluss eines kostenpflichtigen Abonnements verarbeiten wir Angaben zu Tarif und Laufzeit sowie Zahlungsinformationen. Die Abwicklung erfolgt über einen Zahlungsdienstleister. Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
              </p>

              <h3 className="text-lg font-semibold mb-2">2.4 Leads und Kontaktlisten</h3>
              <p className="mb-4">
                Nutzer können Leads anlegen und verwalten. Dabei werden personenbezogene Daten wie Name, E‑Mail, Telefonnummer und Metadaten zu potenziellen Kunden oder Interessenten verarbeitet sowie Anrufhistorien erstellt. Die Verantwortung für die Rechtmäßigkeit der Verarbeitung dieser Daten obliegt dem Nutzer (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Nutzer müssen sicherstellen, dass sie eine gültige Einwilligung oder einen sonstigen rechtlichen Grund zur Verarbeitung und Kontaktaufnahme besitzen.
              </p>

              <h3 className="text-lg font-semibold mb-2">2.5 Anrufprotokolle und Analysen</h3>
              <p className="mb-4">
                Bei der Nutzung der Plattform werden Anrufprotokolle („Call Logs") erstellt. Diese enthalten u. a. Rufnummern, Zeitstempel, Dauer, Gesprächsergebnisse und ggf. Gesprächsinhalte. Darüber hinaus können statistische Auswertungen wie Anrufdauer‑Verteilungen und Tagesstatistiken erstellt werden. Diese Daten dienen der Erfüllung des Vertrags (Art. 6 Abs. 1 lit. b DSGVO) und unserem berechtigten Interesse an der Verbesserung des Dienstes (Art. 6 Abs. 1 lit. f DSGVO). Falls Gesprächsinhalte aufgezeichnet werden, informieren wir Sie gesondert und holen die Einwilligung der Betroffenen ein (Art. 6 Abs. 1 lit. a DSGVO).
              </p>

              <h3 className="text-lg font-semibold mb-2">2.6 Kalender‑Integration</h3>
              <p className="mb-4">
                HotCalls ermöglicht die Verbindung zu externen Kalendern (z. B. Google oder Outlook), um Termine zu planen und Verfügbarkeiten zu prüfen. Hierfür wird auf Kalenderdaten wie freie und gebuchte Zeiträume zugegriffen. Die Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO); die Kalenderanbieter fungieren als eigenständige Verantwortliche.
              </p>

              <h3 className="text-lg font-semibold mb-2">2.7 Technische Daten & Nutzungsstatistiken</h3>
              <p>
                Wir nutzen Analysefunktionen, um Nutzungsdaten wie Aufrufhäufigkeiten, Feature‑Nutzung und Performance‑Kennzahlen zu erheben, um die Stabilität der Plattform zu gewährleisten und die Benutzerfreundlichkeit zu verbessern. Die Rechtsgrundlage hierfür ist unser berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Kategorien personenbezogener Daten</h2>
              <p className="mb-3">Zu den verarbeiteten Daten gehören insbesondere:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Stammdaten (Name, Benutzername, E‑Mail, Telefonnummer)</li>
                <li>Vertragsdaten (gewählter Tarif, Laufzeit, Zahlungsstatus)</li>
                <li>Kontakt‑ und Lead‑Daten (Kontaktdaten potenzieller Kunden, Metadaten, Notizen)</li>
                <li>Kommunikationsdaten (Anrufzeitpunkte, Rufnummern, Gesprächsergebnisse, Protokolle)</li>
                <li>Kalenderdaten (Termine, Zeitfenster)</li>
                <li>Nutzungs‑ und Metadaten (Logfiles, IP‑Adresse, Browser‑/Geräteinformationen)</li>
              </ul>
              <p>
                Gemäß dem GDPR‑Begriff ist „personenbezogene Daten" jede Information, die sich auf eine identifizierte oder identifizierbare Person bezieht. Dies umfasst z. B. Name, Telefonnummer, IP‑Adresse oder E‑Mail‑Adresse. Auch pseudonymisierte Daten gelten als personenbezogen, solange eine Re‑Identifizierung möglich ist.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Rechtsgrundlagen der Verarbeitung</h2>
              <p className="mb-3">Die Verarbeitung personenbezogener Daten ist nur rechtmäßig, wenn sie auf einer gesetzlichen Grundlage beruht. Art. 6 DSGVO nennt unter anderem folgende Gründe:</p>
              <div className="space-y-3">
                <p><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Die betroffene Person hat ihre Einwilligung zu der Verarbeitung für einen oder mehrere bestimmte Zwecke gegeben.</p>
                <p><strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Die Verarbeitung ist für die Erfüllung eines Vertrags erforderlich, z. B. zur Bereitstellung unseres Dienstes.</p>
                <p><strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):</strong> Die Verarbeitung ist erforderlich, um eine rechtliche Verpflichtung zu erfüllen.</p>
                <p><strong>Lebenswichtige Interessen (Art. 6 Abs. 1 lit. d DSGVO)</strong></p>
                <p><strong>Öffentliches Interesse bzw. Ausübung öffentlicher Gewalt (Art. 6 Abs. 1 lit. e DSGVO)</strong></p>
                <p><strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> Die Verarbeitung ist zur Wahrung unserer berechtigten Interessen oder der eines Dritten erforderlich, sofern nicht die Interessen oder Grundrechte der betroffenen Person überwiegen.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Empfänger der Daten</h2>
              <p className="mb-3">Wir geben personenbezogene Daten nur an Dritte weiter, wenn eine Rechtsgrundlage besteht oder eine Einwilligung vorliegt. Mögliche Empfänger sind:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Zahlungsdienstleister zur Abwicklung von Transaktionen</li>
                <li>Cloud‑ und Hosting‑Provider zur Bereitstellung der technischen Infrastruktur</li>
                <li>Telefon‑ und Kommunikationsprovider, wenn Anrufe oder SMS über externe Netze geführt werden</li>
                <li>Externe Kalenderanbieter (Google, Microsoft), wenn Nutzer deren Dienste anbinden</li>
                <li>Externe Berater (z. B. Steuerberater, Rechtsanwälte), soweit hierfür eine rechtliche Grundlage besteht</li>
              </ul>
              <p>
                Eine Übermittlung an Staaten außerhalb des Europäischen Wirtschaftsraums erfolgt nur, wenn entweder ein Angemessenheitsbeschluss der EU‑Kommission vorliegt oder geeignete Garantien (z. B. EU‑Standardvertragsklauseln) abgeschlossen wurden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Speicherdauer</h2>
              <p>
                Wir speichern personenbezogene Daten nur so lange, wie dies für die in dieser Erklärung genannten Zwecke erforderlich ist oder rechtliche Aufbewahrungspflichten bestehen. Anrufprotokolle und Leads können vom Nutzer über die Plattform gelöscht werden; spätestens 90 Tage nach Vertragsende werden alle Daten irreversibel gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Betroffenenrechte</h2>
              <p className="mb-3">Betroffene Personen haben nach der DSGVO insbesondere folgende Rechte:</p>
              <div className="space-y-3">
                <p><strong>Recht auf Information:</strong> Sie müssen darüber informiert werden, welche Daten erhoben werden, wie lange sie gespeichert werden und zu welchem Zweck. Diese Informationen stellen wir in dieser Datenschutzerklärung bereit.</p>
                <p><strong>Recht auf Auskunft:</strong> Sie können von uns eine Bestätigung verlangen, ob Sie betreffende personenbezogene Daten verarbeitet werden und Auskunft über diese Daten sowie eine Kopie der Daten erhalten.</p>
                <p><strong>Recht auf Berichtigung:</strong> Betroffene können die Berichtigung unrichtiger oder die Vervollständigung unvollständiger Daten verlangen.</p>
                <p><strong>Recht auf Löschung:</strong> Unter den Voraussetzungen des Art. 17 DSGVO können Betroffene die Löschung ihrer personenbezogenen Daten verlangen („Recht auf Vergessenwerden"). Dies gilt insbesondere, wenn die Daten nicht mehr benötigt werden oder die Einwilligung widerrufen wurde.</p>
                <p><strong>Recht auf Einschränkung der Verarbeitung:</strong> Betroffene haben das Recht, die Verarbeitung ihrer Daten zeitweise einzuschränken, z. B. wenn die Richtigkeit der Daten bestritten wird.</p>
                <p><strong>Recht auf Datenübertragbarkeit:</strong> Betroffene können ihre Daten in einem strukturierten, gängigen und maschinenlesbaren Format erhalten oder übertragen lassen.</p>
                <p><strong>Recht auf Widerspruch:</strong> Betroffene können der Datenverarbeitung aus Gründen, die sich aus ihrer besonderen Situation ergeben, widersprechen. Im Falle von Direktwerbung ist dies ein absolutes Recht.</p>
                <p><strong>Rechte im Zusammenhang mit automatisierten Entscheidungen einschließlich Profiling:</strong> Betroffene haben das Recht, nicht ausschließlich einer automatisierten Entscheidung unterworfen zu werden, die ihnen gegenüber rechtliche Wirkung entfaltet oder sie erheblich beeinträchtigt.</p>
              </div>
              <p className="mt-4">
                Zur Wahrnehmung der vorgenannten Rechte können sich Betroffene jederzeit per E‑Mail oder postalisch an uns wenden. Zusätzlich besteht das Recht, bei einer Aufsichtsbehörde Beschwerde einzulegen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Sicherheit der Verarbeitung</h2>
              <p>
                Wir setzen technische und organisatorische Maßnahmen ein, um die Sicherheit der personenbezogenen Daten zu gewährleisten. Hierzu gehören z. B. Verschlüsselung, Zugriffskontrollen, regelmäßige Sicherheitsaudits und Backups. Wir achten darauf, dass unsere Auftragsverarbeiter ähnliche Maßnahmen treffen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Automatisierte Entscheidungsfindung und Profiling</h2>
              <p>
                HotCalls verwendet KI‑Agenten, die Anrufe im Namen des Nutzers durchführen können. Dabei handelt es sich um automatisierte Systeme, die anhand von Regeln und Wahrscheinlichkeiten Gesprächsabläufe steuern. Es erfolgt jedoch keine automatisierte Entscheidung, die rechtliche Wirkung entfaltet oder die Nutzer erheblich beeinträchtigt; die KI dient lediglich der technischen Unterstützung. Sollten wir künftig automatisierte Entscheidungen einsetzen, die erhebliche Auswirkungen haben, werden wir Sie vorab hierüber informieren und sicherstellen, dass eine menschliche Kontrolle erfolgt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Änderungen der Datenschutzerklärung</h2>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen, technische Entwicklungen oder bei Einführung neuer Services anzupassen. Über wesentliche Änderungen informieren wir registrierte Nutzer per E‑Mail. Die jeweils aktuelle Version ist auf unserer Website abrufbar.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 