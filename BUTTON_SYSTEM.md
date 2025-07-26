# 🎯 EINHEITLICHES DESIGN-SYSTEM

## Übersicht
Dieses System sorgt für 100% konsistentes Design in der gesamten Anwendung mit einheitlichen Buttons, Farben, Schriften und Spacing.

## 🔥 PROBLEM GELÖST
**Vorher:** Chaos mit verschiedenen Button-Styles, Font-Größen und Farben überall
**Jetzt:** Ein System - überall konsistent

---

## 🎨 BUTTON-KATEGORIEN

### 1. 🟠 CREATE/ADD BUTTONS (Voll Orange)
**Verwendung:** Neue Inhalte erstellen
```typescript
buttonStyles.create.default  // Standard
buttonStyles.create.large    // Größer für wichtige Actions
```
**Beispiele:** "Agent erstellen", "Lead Quelle hinzufügen", "Event erstellen"

### 2. 🧡 PRIMARY BUTTONS (Orange Outline)  
**Verwendung:** Hauptaktionen, Save, Update
```typescript
buttonStyles.primary.default    // Standard
buttonStyles.primary.large      // Größer
buttonStyles.primary.fullWidth  // Volle Breite
```
**Beispiele:** "Speichern", "Testen", "Konfigurieren"

### 3. ⚪ SECONDARY BUTTONS (Grau Outline)
**Verwendung:** Nebenaktionen, Zurück, Plan ansehen
```typescript
buttonStyles.secondary.default    // Standard
buttonStyles.secondary.large      // Größer
buttonStyles.secondary.fullWidth  // Volle Breite
```
**Beispiele:** "Abbrechen", "Plan ansehen", "Bearbeiten"

### 4. 🎯 CARD ACTION BUTTONS
**Verwendung:** Actions in Cards (Agent, Lead-Quellen)
```typescript
// Status Buttons
buttonStyles.cardAction.statusActive   // Grün
buttonStyles.cardAction.statusPaused   // Gelb

// Icon Buttons
buttonStyles.cardAction.icon        // Grau (Settings, Analytics)
buttonStyles.cardAction.iconDelete  // Rot (Delete)
```

### 5. 🔙 NAVIGATION BUTTONS
**Verwendung:** Zurück-Navigation
```typescript
buttonStyles.navigation.back  // Ghost-Style für "Zurück zu..."
```

### 6. ⚠️ DIALOG BUTTONS
**Verwendung:** AlertDialogs, Modals
```typescript
buttonStyles.dialog.cancel      // Grau Cancel
buttonStyles.dialog.destructive // Rot Delete/Destroy
buttonStyles.dialog.confirm     // Orange Confirm
```

---

## 📝 TEXT & TYPOGRAPHY

### Page Headers
```typescript
textStyles.pageTitle     // "text-2xl font-bold text-gray-900"
textStyles.pageSubtitle  // "text-sm font-medium text-gray-500"
textStyles.sectionTitle  // "text-xl font-semibold text-gray-900"
```

### Card Content
```typescript
textStyles.cardTitle     // "text-lg font-semibold text-gray-900"
textStyles.cardSubtitle  // "text-sm font-medium text-gray-500"
```

### Metrics
```typescript
textStyles.metric      // "text-lg font-semibold text-gray-900"
textStyles.metricLabel // "text-xs font-medium text-gray-500 uppercase tracking-wide"
```

### Button Text
```typescript
textStyles.buttonText      // "text-sm font-medium"
textStyles.buttonTextLarge // "text-base font-medium"
```

---

## 🖼️ ICON-GRÖSSEN

```typescript
iconSizes.small   // "h-4 w-4" - Standard für Buttons
iconSizes.medium  // "h-5 w-5" - Größere Buttons
iconSizes.large   // "h-6 w-6" - Card Headers  
iconSizes.xlarge  // "h-8 w-8" - Page Headers
```

---

## 💡 VERWENDUNG

### Import
```typescript
import { buttonStyles, textStyles, iconSizes } from "@/lib/buttonStyles";
```

### Beispiele

#### Create Button
```tsx
<button className={buttonStyles.create.default}>
  <Plus className={iconSizes.small} />
  <span>Neuen Agent erstellen</span>
</button>
```

#### Primary Action
```tsx
<button className={buttonStyles.primary.default} onClick={handleSave}>
  <Save className={iconSizes.small} />
  <span>Speichern</span>
</button>
```

#### Card Action Button
```tsx
<button className={buttonStyles.cardAction.icon} onClick={handleEdit}>
  <Settings className={iconSizes.small} />
</button>
```

#### Page Title
```tsx
<h1 className={textStyles.pageTitle}>KI-Agenten</h1>
<p className={textStyles.pageSubtitle}>Verwalte deine KI-Agenten</p>
```

---

## ✅ AKTUALISIERTE SEITEN

- ✅ **Agents.tsx**: Vollständig mit neuem System
- ✅ **AgentConfig.tsx**: Header & Navigation Buttons
- ✅ **LeadSources.tsx**: Bereits kompatibel 
- ✅ **Calendar.tsx**: Bereits kompatibel
- ✅ **Settings.tsx**: Orange Theme bereits korrekt

## 🚀 MIGRATION PLAN

### Phase 1: Core Pages (✅ DONE)
- [x] Agents.tsx
- [x] AgentConfig.tsx

### Phase 2: Remaining Pages
- [ ] Dashboard.tsx
- [ ] Leads.tsx  
- [ ] LeadSources.tsx (finalize)
- [ ] Calendar.tsx (finalize)
- [ ] Settings.tsx (finalize)

### Phase 3: Components
- [ ] CreateAgentDialog.tsx
- [ ] Modals & Dialogs

---

## 🎯 DESIGN-PRINZIPIEN

1. **🟠 Orange = Action**: Erstellen, Speichern, Hauptaktionen
2. **⚪ Grau = Secondary**: Zurück, Abbrechen, Nebenaktionen  
3. **🔴 Rot = Danger**: Löschen, Zerstörerische Aktionen
4. **🟢 Grün = Active**: Status "Aktiv"
5. **🟡 Gelb = Paused**: Status "Pausiert"

## 🎨 FARB-SYSTEM

- **Orange**: `#f97316` (orange-500)
- **Grau**: `#6b7280` (gray-500) 
- **Rot**: `#dc2626` (red-600)
- **Grün**: `#16a34a` (green-600)
- **Gelb**: `#ca8a04` (yellow-600)

---

## ⚡ VORTEILE

✅ **Konsistenz**: Überall gleiche Buttons
✅ **Entwickler-Speed**: Kein Nachdenken über Styles
✅ **Wartbarkeit**: Zentrale Änderungen
✅ **UX**: Nutzer lernen einmal, kennen überall
✅ **Brand**: Einheitliche Orange-Identität 