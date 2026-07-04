"use client";

import { useEffect, useRef, useState } from "react";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import { nanoid } from "nanoid";
import type {
  SendMessageData,
  AskQuestionData,
  ConditionData,
  SetFieldData,
  DelayData,
  ActionData,
  StartData,
  Button,
  CardCarouselData,
  Card,
  CardButton,
} from "@/types/flow";

export function NodeEditor() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const nodes = useFlowStore((s) => s.nodes);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const selectNode = useFlowStore((s) => s.selectNode);
  const buttonFocusRequest = useUiStore((s) => s.buttonFocusRequest);
  const clearButtonFocusRequest = useUiStore((s) => s.clearButtonFocusRequest);

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return <aside className="max-lg:hidden w-0 min-w-0 border-r-0 bg-surface overflow-hidden transition-all duration-200" aria-hidden="true" />;
  }

  const update = (data: Record<string, unknown>) => {
    updateNodeData(node.id, data);
  };

  const handleClose = () => selectNode(null);

  const handleDelete = () => {
    if (node.type === "start") return;
    deleteNode(node.id);
  };

  return (
    <aside className="max-lg:hidden w-[320px] min-w-[320px] bg-surface border-r border-border flex flex-col overflow-y-auto overflow-x-visible transition-all duration-200 relative z-10">
      <div className="p-3 px-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold m-0">Edit Node</h2>
        <button className="bg-none border-none text-text-muted text-xl cursor-pointer px-1 leading-none hover:text-text" onClick={handleClose}>
          &times;
        </button>
      </div>

      <div className="p-3 px-4 flex flex-col gap-3 flex-1">
        {/* Label field - all nodes */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Label</label>
          <input
            className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
            value={(node.data as { label: string }).label || ""}
            onChange={(e) => update({ label: e.target.value })}
          />
        </div>

        {/* Start node */}
        {node.type === "start" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Trigger</label>
              <select
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as StartData).trigger}
                onChange={(e) => update({ trigger: e.target.value })}
              >
                <option value="default">Default (any message)</option>
                <option value="keyword">Keyword</option>
                <option value="button">Button Click</option>
                <option value="ref">Ref Link</option>
              </select>
            </div>

            {(node.data as StartData).trigger === "keyword" && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Keywords</label>
                <textarea
                  className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none resize-vertical font-sans transition-colors focus:border-accent"
                  rows={3}
                  placeholder="One keyword per line or comma-separated"
                  value={((node.data as StartData).keywords ?? []).join("\n")}
                  onChange={(e) => {
                    const keywords = e.target.value
                      .split(/[\n,]+/)
                      .map((v) => v.trim().toLowerCase())
                      .filter(Boolean);
                    update({ keywords });
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Send Message */}
        {node.type === "sendMessage" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Message</label>
              <textarea
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none resize-vertical font-sans transition-colors focus:border-accent"
                rows={4}
                value={(node.data as SendMessageData).message}
                onChange={(e) => update({ message: e.target.value })}
                placeholder="Type your message..."
              />
            </div>
            <ButtonsEditor
              nodeId={node.id}
              buttons={(node.data as SendMessageData).buttons}
              onChange={(buttons) => update({ buttons })}
              focusRequest={buttonFocusRequest}
              onFocusRequestHandled={clearButtonFocusRequest}
            />
          </>
        )}

        {/* Ask Question */}
        {node.type === "askQuestion" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Question</label>
              <textarea
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none resize-vertical font-sans transition-colors focus:border-accent"
                rows={3}
                value={(node.data as AskQuestionData).question}
                onChange={(e) => update({ question: e.target.value })}
                placeholder="Ask your question..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Save reply to field</label>
              <input
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as AskQuestionData).saveToField}
                onChange={(e) => update({ saveToField: e.target.value })}
                placeholder="e.g. name, email"
              />
            </div>
            <ButtonsEditor
              nodeId={node.id}
              buttons={(node.data as AskQuestionData).buttons}
              onChange={(buttons) => update({ buttons })}
              focusRequest={buttonFocusRequest}
              onFocusRequestHandled={clearButtonFocusRequest}
            />
          </>
        )}

        {/* Condition */}
        {node.type === "condition" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Field</label>
              <input
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as ConditionData).field}
                onChange={(e) => update({ field: e.target.value })}
                placeholder="e.g. name, email"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Operator</label>
              <select
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as ConditionData).operator}
                onChange={(e) => update({ operator: e.target.value })}
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
                <option value="exists">Exists</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Value</label>
              <input
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as ConditionData).value}
                onChange={(e) => update({ value: e.target.value })}
                placeholder="Compare value"
              />
            </div>
          </>
        )}

        {/* Set Field */}
        {node.type === "setField" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Field name</label>
              <input
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as SetFieldData).field}
                onChange={(e) => update({ field: e.target.value })}
                placeholder="e.g. status, score"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Value</label>
              <input
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as SetFieldData).value}
                onChange={(e) => update({ value: e.target.value })}
                placeholder="Value to set"
              />
            </div>
          </>
        )}

        {/* Delay */}
        {node.type === "delay" && (
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Duration</label>
              <input
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                type="number"
                min={1}
                value={(node.data as DelayData).duration}
                onChange={(e) =>
                  update({ duration: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Unit</label>
              <select
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as DelayData).unit}
                onChange={(e) => update({ unit: e.target.value })}
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>
        )}

        {/* Action */}
        {node.type === "action" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Action type</label>
              <select
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as ActionData).actionType}
                onChange={(e) => update({ actionType: e.target.value })}
              >
                <option value="tag">Add Tag</option>
                <option value="subscribe">Subscribe</option>
                <option value="unsubscribe">Unsubscribe</option>
                <option value="notify">Notify Admin</option>
                <option value="webhook">Call Webhook</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">Value</label>
              <input
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={(node.data as ActionData).value}
                onChange={(e) => update({ value: e.target.value })}
                placeholder={
                  (node.data as ActionData).actionType === "webhook"
                    ? "https://..."
                    : "Tag name, list, etc."
                }
              />
            </div>
          </>
        )}

        {/* Card Carousel */}
        {node.type === "cardCarousel" && (
          <CardsEditor
            cards={(node.data as CardCarouselData).cards}
            onChange={(cards) => update({ cards })}
          />
        )}
      </div>

      {node.type !== "start" && (
        <div className="p-3 px-4 border-t border-border">
          <button className="w-full p-2 bg-red/10 border border-red/30 rounded-md text-red text-xs font-semibold cursor-pointer transition-all hover:bg-red/20 hover:border-red" onClick={handleDelete}>
            Delete Node
          </button>
        </div>
      )}
    </aside>
  );
}

function ButtonsEditor({
  nodeId,
  buttons,
  onChange,
  focusRequest,
  onFocusRequestHandled,
}: {
  nodeId: string;
  buttons: Button[];
  onChange: (buttons: Button[]) => void;
  focusRequest: { nodeId: string; buttonId: string; key: number } | null;
  onFocusRequestHandled: () => void;
}) {
  const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
  const [pendingFocusButtonId, setPendingFocusButtonId] = useState<string | null>(null);
  const buttonTitleInputRef = useRef<HTMLInputElement>(null);

  const ACTION_OPTIONS: Array<{
    id: NonNullable<Button["actionType"]>;
    label: string;
    placeholder: string;
  }> = [
    { id: "messenger", label: "Messenger", placeholder: "Optional payload" },
    { id: "aiStep", label: "AI Step", placeholder: "e.g. qualify_lead" },
    { id: "openWebsite", label: "Open website", placeholder: "https://example.com" },
    { id: "callNumber", label: "Call number", placeholder: "+1 555 555 5555" },
    { id: "performAction", label: "Perform Actions", placeholder: "e.g. add_tag:vip" },
    { id: "condition", label: "Condition", placeholder: "e.g. has_email" },
    { id: "randomizer", label: "Randomizer", placeholder: "e.g. 50/50 split" },
    { id: "smartDelay", label: "Smart Delay", placeholder: "e.g. 2h" },
    { id: "startAutomation", label: "Start another Automation", placeholder: "Automation name" },
    { id: "selectStep", label: "Select Existing Step", placeholder: "Step name or id" },
  ];

  const activeButton = buttons.find((btn) => btn.id === activeButtonId) ?? null;

  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.nodeId !== nodeId) return;
    if (!buttons.some((btn) => btn.id === focusRequest.buttonId)) return;

    setActiveButtonId(focusRequest.buttonId);
    setPendingFocusButtonId(focusRequest.buttonId);
  }, [buttons, focusRequest, nodeId]);

  useEffect(() => {
    if (!activeButtonId || !pendingFocusButtonId) return;
    if (pendingFocusButtonId !== activeButtonId) return;

    requestAnimationFrame(() => {
      const input = buttonTitleInputRef.current;
      if (!input) return;
      input.focus();
      input.select();
      setPendingFocusButtonId(null);
      onFocusRequestHandled();
    });
  }, [activeButtonId, onFocusRequestHandled, pendingFocusButtonId]);

  const addButton = () => {
    const id = nanoid(6);
    onChange([
      ...buttons,
      { id, text: `New Button #${buttons.length + 1}`, actionType: "messenger", actionValue: "" },
    ]);
    setActiveButtonId(id);
  };

  const updateButton = (id: string, patch: Partial<Button>) => {
    onChange(buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeButton = (id: string) => {
    onChange(buttons.filter((b) => b.id !== id));
    if (activeButtonId === id) {
      setActiveButtonId(null);
    }
  };

  return (
    <div className="flex flex-col gap-1 relative">
      <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted">Quick replies</label>
      <div className="flex flex-col gap-1">
        {buttons.map((btn) => (
          <div key={btn.id} className="flex gap-1 items-center">
            <button
              className={`p-1 px-2 bg-bg border rounded-md text-left text-text text-xs outline-none transition-colors font-sans flex-1 cursor-pointer ${
                activeButtonId === btn.id ? "border-accent" : "border-border hover:border-border-hover"
              }`}
              onClick={() => setActiveButtonId(btn.id)}
              type="button"
            >
              <span className="block font-medium">{btn.text || "Untitled button"}</span>
              <span className="block text-[10px] text-text-muted mt-0.5">
                {ACTION_OPTIONS.find((opt) => opt.id === btn.actionType)?.label ?? "Messenger"}
              </span>
            </button>
            <button
              className="bg-none border-none text-text-muted text-base cursor-pointer p-0.5 px-1.5 leading-none rounded hover:text-red hover:bg-red/10"
              onClick={() => removeButton(btn.id)}
              type="button"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="pt-1">
        <button
          type="button"
          className="w-full h-8 px-2.5 border border-accent/60 rounded-md bg-accent/10 text-text text-xs font-semibold cursor-pointer transition-all hover:bg-accent/20"
          onClick={addButton}
        >
          + Add Quick Reply
        </button>
      </div>

      {activeButton && (
        <div className="absolute top-0 left-full ml-3 w-[328px] max-h-[78vh] rounded-xl border border-border bg-surface shadow-2xl z-30 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h4 className="m-0 text-base font-semibold">Edit Button</h4>
            <button
              className="bg-none border-none text-text-muted text-xl cursor-pointer leading-none hover:text-text"
              onClick={() => setActiveButtonId(null)}
              type="button"
            >
              &times;
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted">Button title</label>
              <input
                ref={buttonTitleInputRef}
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={activeButton.text}
                onChange={(e) => updateButton(activeButton.id, { text: e.target.value })}
              />
            </div>

            <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-tight text-text-muted">When this button is pressed</p>
            <div className="flex flex-col gap-2">
              {ACTION_OPTIONS.map((option) => {
                const selected = (activeButton.actionType ?? "messenger") === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`w-full text-left px-3 py-2.5 rounded-lg border border-dashed transition-colors cursor-pointer ${
                      selected
                        ? "border-accent bg-accent/10 text-text"
                        : "border-border text-text hover:border-border-hover hover:bg-bg"
                    }`}
                    onClick={() => updateButton(activeButton.id, { actionType: option.id })}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-1 mt-4">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted">Action value</label>
              <input
                className="p-2 px-2.5 bg-bg border border-border rounded-md text-text text-[13px] outline-none transition-colors focus:border-accent font-sans"
                value={activeButton.actionValue ?? ""}
                onChange={(e) => updateButton(activeButton.id, { actionValue: e.target.value })}
                placeholder={
                  ACTION_OPTIONS.find((opt) => opt.id === (activeButton.actionType ?? "messenger"))?.placeholder ?? ""
                }
              />
            </div>
          </div>

          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <button
              type="button"
              className="bg-none border-none text-red text-sm font-semibold cursor-pointer hover:underline"
              onClick={() => removeButton(activeButton.id)}
            >
              Remove
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md border border-accent/70 bg-accent/15 text-sm font-semibold text-text cursor-pointer hover:bg-accent/25"
              onClick={() => setActiveButtonId(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CardsEditor({
  cards,
  onChange,
}: {
  cards: Card[];
  onChange: (cards: Card[]) => void;
}) {
  const CARD_BUTTON_LIMIT = 3;

  const addCard = () => {
    onChange([
      ...cards,
      {
        id: nanoid(6),
        title: `Card ${cards.length + 1}`,
        subtitle: "",
        imageUrl: "",
        buttons: [],
      },
    ]);
  };

  const updateCard = (id: string, patch: Partial<Card>) => {
    onChange(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCard = (id: string) => {
    onChange(cards.filter((c) => c.id !== id));
  };

  const addCardButton = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    if (card.buttons.length >= CARD_BUTTON_LIMIT) return;
    updateCard(cardId, {
      buttons: [
        ...card.buttons,
        { id: nanoid(6), text: "Button", type: "postback", value: "" },
      ],
    });
  };

  const updateCardButton = (
    cardId: string,
    btnId: string,
    patch: Partial<CardButton>
  ) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    updateCard(cardId, {
      buttons: card.buttons.map((b) =>
        b.id === btnId ? { ...b, ...patch } : b
      ),
    });
  };

  const removeCardButton = (cardId: string, btnId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    updateCard(cardId, {
      buttons: card.buttons.filter((b) => b.id !== btnId),
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">
        Cards
        <button className="bg-none border-none text-accent text-[11px] cursor-pointer p-0 font-semibold hover:text-accent-hover" onClick={addCard}>
          + Add Card
        </button>
      </label>
      <div className="flex flex-col gap-2">
        {cards.map((card, idx) => (
          <div key={card.id} className="bg-bg border border-border rounded-md p-2 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted">#{idx + 1}</span>
              <button
                className="bg-none border-none text-text-muted text-base cursor-pointer p-0.5 px-1.5 leading-none rounded hover:text-red hover:bg-red/10"
                onClick={() => removeCard(card.id)}
              >
                &times;
              </button>
            </div>
            <input
              className="p-1 px-2 bg-bg border border-border rounded-md text-text text-xs outline-none transition-colors focus:border-accent font-sans"
              value={card.title}
              onChange={(e) => updateCard(card.id, { title: e.target.value })}
              placeholder="Title"
            />
            <input
              className="p-1 px-2 bg-bg border border-border rounded-md text-text text-xs outline-none transition-colors focus:border-accent font-sans"
              value={card.subtitle}
              onChange={(e) =>
                updateCard(card.id, { subtitle: e.target.value })
              }
              placeholder="Subtitle"
            />
            <input
              className="p-1 px-2 bg-bg border border-border rounded-md text-text text-xs outline-none transition-colors focus:border-accent font-sans"
              value={card.imageUrl}
              onChange={(e) =>
                updateCard(card.id, { imageUrl: e.target.value })
              }
              placeholder="Image URL"
            />
            <div className="mt-1 flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-tight text-text-muted flex items-center justify-between">
                Buttons
                <button
                  className="bg-none border-none text-accent text-[11px] cursor-pointer p-0 font-semibold hover:text-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => addCardButton(card.id)}
                  disabled={card.buttons.length >= CARD_BUTTON_LIMIT}
                >
                  {card.buttons.length >= CARD_BUTTON_LIMIT ? "Max 3" : "+ Add"}
                </button>
              </label>
              {card.buttons.map((btn) => (
                <div key={btn.id} className="flex gap-1 items-center">
                  <input
                    className="p-1 px-2 bg-bg border border-border rounded-md text-text text-xs outline-none transition-colors focus:border-accent font-sans flex-1 min-w-0"
                    value={btn.text}
                    onChange={(e) =>
                      updateCardButton(card.id, btn.id, {
                        text: e.target.value,
                      })
                    }
                    placeholder="Label"
                  />
                  <select
                    className="p-1 px-2 bg-bg border border-border rounded-md text-text text-xs outline-none transition-colors focus:border-accent font-sans w-20 shrink-0"
                    value={btn.type}
                    onChange={(e) =>
                      updateCardButton(card.id, btn.id, {
                        type: e.target.value as "postback" | "url",
                      })
                    }
                  >
                    <option value="postback">Postback</option>
                    <option value="url">URL</option>
                  </select>
                  <input
                    className="p-1 px-2 bg-bg border border-border rounded-md text-text text-xs outline-none transition-colors focus:border-accent font-sans flex-1 min-w-0"
                    value={btn.value}
                    onChange={(e) =>
                      updateCardButton(card.id, btn.id, {
                        value: e.target.value,
                      })
                    }
                    placeholder={btn.type === "url" ? "https://..." : "payload"}
                  />
                  <button
                    className="bg-none border-none text-text-muted text-base cursor-pointer p-0.5 px-1.5 leading-none rounded hover:text-red hover:bg-red/10"
                    onClick={() => removeCardButton(card.id, btn.id)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
