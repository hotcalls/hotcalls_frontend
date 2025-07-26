import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Webhook } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WebhookConfig() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard/lead-sources")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zurück zu Lead Quellen</span>
          </Button>
        </div>
      </div>

      <h2 className="text-xl font-semibold">Website Webhook Konfiguration</h2>

      {/* Webhook Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Webhook className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Webhook Konfiguration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Konfiguriere deine Website Webhook Integration
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="text-center py-12">
            <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Webhook Konfiguration
            </h3>
            <p className="text-gray-500">
              Diese Konfiguration wird in Kürze verfügbar sein.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 