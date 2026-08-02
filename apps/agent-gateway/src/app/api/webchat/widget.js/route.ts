export const dynamic = "force-dynamic";

/**
 * Vanilla-JS floating chat widget for agent-gateway.
 * Served with the API origin baked in so it works on any embedding page.
 *
 * Usage:
 *   <script src="https://<gateway>/api/webchat/widget.js" data-widget-key="<uuid>"></script>
 */
const WIDGET_JS = `
(function () {
	"use strict";

	var ORIGIN = "__WEBCHAT_API_ORIGIN__";
	var VISITOR_KEY = "agent_webchat_visitor_id";
	var DEFAULT_GREETING = "Сайн уу! Танд хэрхэн туслах вэ?";
	var FALLBACK_REPLY = "Уучлаарай, алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.";

	function makeId() {
		if (window.crypto && typeof window.crypto.randomUUID === "function") {
			return window.crypto.randomUUID();
		}
		return (
			"v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)
		);
	}

	function getVisitorId() {
		try {
			var id = localStorage.getItem(VISITOR_KEY);
			if (id) return id;
			var fresh = makeId();
			localStorage.setItem(VISITOR_KEY, fresh);
			return fresh;
		} catch (err) {
			return makeId();
		}
	}

	function injectStyles() {
		if (document.getElementById("agent-webchat-styles")) return;
		var style = document.createElement("style");
		style.id = "agent-webchat-styles";
		style.textContent =
			"#agent-webchat-root{position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;}" +
			"#agent-webchat-root *{box-sizing:border-box;}" +
			".awc-toggle{width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;background:#2563eb;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;}" +
			".awc-toggle:hover{background:#1d4ed8;}" +
			".awc-box{position:absolute;right:0;bottom:72px;width:360px;max-width:calc(100vw - 40px);height:480px;max-height:calc(100vh - 120px);background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);display:none;flex-direction:column;overflow:hidden;}" +
			".awc-open .awc-box{display:flex;}" +
			".awc-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#2563eb;color:#fff;font-weight:600;}" +
			".awc-close{background:none;border:none;color:#fff;font-size:16px;cursor:pointer;padding:2px 6px;}" +
			".awc-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;}" +
			".awc-msg{display:flex;}" +
			".awc-user{justify-content:flex-end;}" +
			".awc-bubble{max-width:78%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;word-wrap:break-word;white-space:pre-wrap;}" +
			".awc-user .awc-bubble{background:#2563eb;color:#fff;border-bottom-right-radius:4px;}" +
			".awc-bot .awc-bubble{background:#f1f5f9;color:#0f172a;border-bottom-left-radius:4px;}" +
			".awc-typing{display:none;align-items:center;gap:4px;padding:9px 12px;}" +
			".awc-typing.awc-on{display:flex;}" +
			".awc-dot{width:7px;height:7px;border-radius:50%;background:#94a3b8;animation:awc-blink 1.2s infinite;}" +
			".awc-dot:nth-child(2){animation-delay:.2s;}" +
			".awc-dot:nth-child(3){animation-delay:.4s;}" +
			"@keyframes awc-blink{0%,80%,100%{opacity:.25;}40%{opacity:1;}}" +
			".awc-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #e2e8f0;}" +
			".awc-input{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:9px 12px;font-size:14px;outline:none;}" +
			".awc-input:focus{border-color:#2563eb;}" +
			".awc-send{border:none;border-radius:10px;background:#2563eb;color:#fff;padding:0 16px;font-size:14px;cursor:pointer;}";
		document.head.appendChild(style);
	}

	function init() {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", init);
			return;
		}
		injectStyles();

		var script = document.currentScript;
		var widgetKey = script ? script.getAttribute("data-widget-key") : null;
		if (!widgetKey) return;

		var visitorId = getVisitorId();

		var root = document.createElement("div");
		root.id = "agent-webchat-root";

		var toggle = document.createElement("button");
		toggle.type = "button";
		toggle.className = "awc-toggle";
		toggle.setAttribute("aria-label", "Chat нээх");
		toggle.innerHTML =
			'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

		var box = document.createElement("div");
		box.className = "awc-box";
		box.setAttribute("role", "dialog");
		box.setAttribute("aria-label", "Chat");

		var header = document.createElement("div");
		header.className = "awc-header";
		var title = document.createElement("span");
		title.className = "awc-title";
		title.textContent = "Chat";
		var closeBtn = document.createElement("button");
		closeBtn.type = "button";
		closeBtn.className = "awc-close";
		closeBtn.setAttribute("aria-label", "Хаах");
		closeBtn.textContent = "✕";
		header.appendChild(title);
		header.appendChild(closeBtn);

		var messages = document.createElement("div");
		messages.className = "awc-messages";

		var typing = document.createElement("div");
		typing.className = "awc-typing";
		typing.setAttribute("aria-hidden", "true");
		typing.innerHTML = '<span class="awc-dot"></span><span class="awc-dot"></span><span class="awc-dot"></span>';

		var form = document.createElement("form");
		form.className = "awc-form";
		var input = document.createElement("input");
		input.className = "awc-input";
		input.type = "text";
		input.placeholder = "Мессеж бичих...";
		input.setAttribute("autocomplete", "off");
		var sendBtn = document.createElement("button");
		sendBtn.type = "submit";
		sendBtn.className = "awc-send";
		sendBtn.textContent = "Илгээх";
		form.appendChild(input);
		form.appendChild(sendBtn);

		box.appendChild(header);
		box.appendChild(messages);
		box.appendChild(typing);
		box.appendChild(form);
		root.appendChild(toggle);
		root.appendChild(box);
		document.body.appendChild(root);

		var open = false;
		function setOpen(next) {
			open = next;
			root.classList.toggle("awc-open", open);
			if (open) input.focus();
		}
		toggle.addEventListener("click", function () {
			setOpen(!open);
		});
		closeBtn.addEventListener("click", function () {
			setOpen(false);
		});

		function addMessage(text, who) {
			var row = document.createElement("div");
			row.className = "awc-msg awc-" + who;
			var bubble = document.createElement("div");
			bubble.className = "awc-bubble";
			bubble.textContent = text;
			row.appendChild(bubble);
			messages.appendChild(row);
			messages.scrollTop = messages.scrollHeight;
		}

		function setTyping(on) {
			typing.classList.toggle("awc-on", on);
		}

		function send(text) {
			setTyping(true);
			fetch(ORIGIN + "/api/webchat/message", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					widgetKey: widgetKey,
					visitorId: visitorId,
					text: text,
				}),
			})
				.then(function (res) {
					if (!res.ok) throw new Error("HTTP " + res.status);
					return res.json();
				})
				.then(function (data) {
					setTyping(false);
					addMessage(data.reply || FALLBACK_REPLY, "bot");
				})
				.catch(function () {
					setTyping(false);
					addMessage(FALLBACK_REPLY, "bot");
				});
		}

		form.addEventListener("submit", function (ev) {
			ev.preventDefault();
			var text = input.value.trim();
			if (!text) return;
			input.value = "";
			addMessage(text, "user");
			send(text);
		});

		// Load widget config (display name + greeting) — non-blocking.
		fetch(
			ORIGIN + "/api/webchat/start?widgetKey=" + encodeURIComponent(widgetKey),
		)
			.then(function (res) {
				return res.ok ? res.json() : null;
			})
			.then(function (cfg) {
				if (cfg && cfg.displayName) title.textContent = cfg.displayName;
				addMessage(cfg && cfg.greeting ? cfg.greeting : DEFAULT_GREETING, "bot");
			})
			.catch(function () {
				addMessage(DEFAULT_GREETING, "bot");
			});
	}

	init();
})();
`;

export async function GET(request: Request): Promise<Response> {
	// Origin of the script itself (the gateway), not the embedding page —
	// baked in so the widget always talks to the right API.
	const origin = new URL(request.url).origin;
	const js = WIDGET_JS.replace("__WEBCHAT_API_ORIGIN__", origin);

	return new Response(js, {
		headers: {
			"Content-Type": "application/javascript; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}
