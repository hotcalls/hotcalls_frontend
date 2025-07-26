import { useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
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

const workspaces = [
  { value: "acme-corp", label: "Acme Corp" },
  { value: "tech-solutions", label: "Tech Solutions GmbH" },
  { value: "marketing-pro", label: "Marketing Pro AG" },
  { value: "digital-agency", label: "Digital Agency" },
];

export function WorkspaceSelector() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("acme-corp");

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
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="truncate">
                {value
                  ? workspaces.find((workspace) => workspace.value === value)?.label
                  : "Workspace wählen..."}
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
                {workspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.value}
                    value={workspace.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === workspace.value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {workspace.label}
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