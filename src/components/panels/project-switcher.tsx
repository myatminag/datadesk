"use client"

import { useNavigate } from "@tanstack/react-router"
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useDiagramStore } from "@/stores/diagram-store"

export function ProjectSwitcher({ activeId }: { activeId: string }) {
  const diagrams = useDiagramStore((s) => s.diagrams)
  const order = useDiagramStore((s) => s.order)
  const createDiagram = useDiagramStore((s) => s.createDiagram)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const active = diagrams[activeId]
  const list = order.map((id) => diagrams[id]).filter(Boolean)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] justify-between gap-2 border-transparent font-medium hover:bg-accent/60 data-[state=open]:bg-accent/60"
        >
          <span className="truncate text-base">
            {active?.name ?? "Select diagram"}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search diagrams…" />
          <CommandList>
            <CommandEmpty>No diagrams.</CommandEmpty>
            <CommandGroup heading="Diagrams">
              {list.map((d) => (
                <CommandItem
                  key={d.id}
                  value={d.name + d.id}
                  onSelect={() => {
                    setOpen(false)
                    navigate({
                      to: "/editor/$diagramId",
                      params: { diagramId: d.id },
                    })
                  }}
                >
                  <span className="flex-1 truncate">{d.name}</span>
                  {d.id === activeId && <CheckIcon className="ml-2 size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  const id = createDiagram()
                  setOpen(false)
                  navigate({
                    to: "/editor/$diagramId",
                    params: { diagramId: id },
                  })
                }}
              >
                <PlusIcon className={cn("mr-2 size-4")} />
                New diagram
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  navigate({ to: "/" })
                }}
              >
                All diagrams…
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
