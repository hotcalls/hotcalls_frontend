import { Button } from "@/components/ui/button";

export function DebugWelcome() {
  const resetWelcome = () => {
    localStorage.removeItem('welcomeCompleted');
    localStorage.removeItem('userLoggedIn'); // Reset login auch
    window.location.reload();
  };

  const hasCompleted = localStorage.getItem('welcomeCompleted');

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={resetWelcome}
        variant="outline"
        size="sm"
        className="bg-white shadow-lg"
      >
        🔄 {hasCompleted ? 'Welcome erneut anzeigen' : 'Welcome aktiv'}
      </Button>
    </div>
  );
} 