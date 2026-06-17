"use client";

import { Check, MagnifyingGlass, User, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
};

type CustomerPickerProps = {
  contacts: Contact[];
  selectedContactId: string | null;
  customerName: string;
  customerPhone: string;
  onSelectContact: (contact: Contact | null) => void;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
};

export function CustomerPicker({
  contacts,
  selectedContactId,
  customerName,
  customerPhone,
  onSelectContact,
  onNameChange,
  onPhoneChange,
}: CustomerPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [useWalkIn, setUseWalkIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset internal state when customerName is cleared externally (e.g., form reset)
  useEffect(() => {
    if (!customerName && !selectedContactId) {
      setSearchQuery("");
      setUseWalkIn(false);
    }
  }, [customerName, selectedContactId]);

  const handleWalkIn = () => {
    setUseWalkIn(true);
    onSelectContact(null);
    onNameChange("");
    onPhoneChange("");
    setIsOpen(false);
  };

  const handleSelectContact = (contact: Contact) => {
    setUseWalkIn(false);
    onSelectContact(contact);
    onNameChange(contact.name);
    onPhoneChange(contact.phone ?? "");
    setSearchQuery(contact.name);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setUseWalkIn(false);
    onSelectContact(null);
    setIsOpen(false);
  };

  const handleClear = () => {
    setUseWalkIn(false);
    onSelectContact(null);
    onNameChange("");
    onPhoneChange("");
    setSearchQuery("");
  };

  if (useWalkIn) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Харилцагч
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleClear}
          >
            <X className="mr-1 size-3" />
            Өөрчлөх
          </Button>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5">
          <User className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Walk-in харилцагч
          </span>
        </div>
      </div>
    );
  }

  const isCreatingNew =
    !selectedContactId &&
    customerName.trim().length > 0 &&
    !contacts.some(
      (c) => c.name.toLowerCase() === customerName.trim().toLowerCase(),
    );

  return (
    <div className="flex flex-col gap-2" ref={dropdownRef}>
      <span className="text-sm font-medium text-muted-foreground">
        Харилцагч
      </span>

      {/* Search input */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Харилцагч хайх..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value && !selectedContactId) {
              onNameChange("");
              onPhoneChange("");
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="h-[48px] rounded-xl pl-9 text-sm"
        />
        {selectedContactId && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={handleClear}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Dropdown with contacts */}
      {isOpen && (
        <div className="z-50 rounded-xl border border-border bg-card shadow-lg">
          {/* Walk-in option */}
          <button
            type="button"
            className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm hover:bg-muted/50"
            onClick={handleWalkIn}
          >
            <User className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Харилцагчгүй (Walk-in)
            </span>
          </button>

          {/* Filtered contacts */}
          {filteredContacts.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto border-t border-border">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/50",
                    selectedContactId === contact.id && "bg-muted/30",
                  )}
                  onClick={() => handleSelectContact(contact)}
                >
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{contact.name}</span>
                    {contact.phone && (
                      <span className="text-xs text-muted-foreground">
                        {contact.phone}
                      </span>
                    )}
                  </div>
                  {selectedContactId === contact.id && (
                    <Check className="ml-auto size-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Create new customer option */}
          {searchQuery.trim().length > 0 &&
            !contacts.some(
              (c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase(),
            ) && (
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 border-t border-border px-3 py-2.5 text-left text-sm hover:bg-muted/50",
                  isCreatingNew && "bg-muted/30",
                )}
                onClick={() => {
                  handleCreateNew();
                  onNameChange(searchQuery.trim());
                }}
              >
                <User className="size-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-primary">
                    &quot;{searchQuery.trim()}&quot; — Шинэ харилцагч
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Шинэ харилцагч үүсгэх
                  </span>
                </div>
              </button>
            )}

          {/* No results */}
          {filteredContacts.length === 0 && searchQuery.trim().length > 0 && (
            <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              Тохирох харилцагч олдсонгүй
            </div>
          )}
        </div>
      )}

      {/* Selected/entered customer info */}
      {(customerName || selectedContactId) && !isOpen && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
          <User className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium">{customerName}</span>
          {customerPhone && (
            <span className="text-xs text-muted-foreground">
              — {customerPhone}
            </span>
          )}
        </div>
      )}

      {/* Phone input when creating new customer */}
      {isCreatingNew && !isOpen && (
        <Input
          placeholder="Утасны дугаар (заавал биш)"
          value={customerPhone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="h-[44px] rounded-xl text-sm"
        />
      )}
    </div>
  );
}
