import { useState } from "react";
import { Check, ChevronsUpDown, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspace } from "@/hooks/use-workspace";
import React from "react";

export function WorkspaceSelector() {
  const [open, setOpen] = useState(false);
  const { workspaces, primaryWorkspace, loading, error, selectedWorkspaceId, setSelectedWorkspace } = useWorkspace();
  
  // Use selected workspace id from hook
  const value = selectedWorkspaceId || primaryWorkspace?.id || "";

  // Map API workspaces to selector format
  const workspaceOptions = workspaces.map(workspace => ({
    value: workspace.id,
    label: workspace.workspace_name
  }));

  const selectedWorkspace = workspaceOptions.find(workspace => workspace.value === value);

  if (loading) {
    return (
      <div className="px-2 pb-3">
        <Button
          variant="outline"
          className="w-full justify-between h-10 border-gray-200"
          disabled
        >
          <div className="flex items-center gap-2 min-w-0">
            <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
            <span className="truncate">Lade Workspaces...</span>
          </div>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 pb-3">
        <Button
          variant="outline"
          className="w-full justify-between h-10 border-red-200 text-red-600"
          disabled
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4" />
            <span className="truncate">Fehler beim Laden</span>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-2 pb-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 border-gray-200 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="truncate" title={selectedWorkspace?.label || "Workspace wählen..."}>
                {selectedWorkspace?.label || "Workspace wählen..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Workspace suchen..." />
            <CommandList>
              <CommandEmpty>Kein Workspace gefunden.</CommandEmpty>
              <CommandGroup>
                {workspaceOptions.map((workspace) => (
                  <CommandItem
                    key={workspace.value}
                    value={workspace.value}
                    className="min-w-0"
                    onSelect={() => {
                      const id = workspace.value;
                      setSelectedWorkspace(id);
                      setOpen(false);
                      const url = `/dashboard?joined_workspace=${encodeURIComponent(id)}&skip_welcome=1`;
                      try {
                        window.location.assign(url);
                      } catch {
                        window.location.href = url;
                      }
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === workspace.value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span className="truncate" title={workspace.label}>{workspace.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}