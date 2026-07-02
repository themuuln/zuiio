"use client";

import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Clock,
  Cpu,
  Gauge,
  Terminal,
  TrendingUp,
  UserCheck,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface Bay {
  id: number;
  vehicle: string;
  plate: string;
  status: "diagnostics" | "repairing" | "completed" | "waiting";
  progress: number;
  tech: string;
}

interface LogEvent {
  id: string;
  timestamp: string;
  text: string;
  iconType:
    | "workOrder"
    | "part"
    | "payment"
    | "alignment"
    | "diagnostic"
    | "clockIn";
}

export function AuthShowcase() {
  const t = useTranslations("auth.showcase");
  const [activeTab, setActiveTab] = useState<"bays" | "metrics" | "ledger">(
    "bays",
  );
  const [bays, setBays] = useState<Bay[]>([
    {
      id: 1,
      vehicle: "Toyota Land Cruiser 200",
      plate: "1234 УАБ",
      status: "repairing",
      progress: 65,
      tech: "Bat-Erdene",
    },
    {
      id: 2,
      vehicle: "Hyundai Sonata",
      plate: "9988 УБТ",
      status: "diagnostics",
      progress: 20,
      tech: "Khulan",
    },
    {
      id: 3,
      vehicle: "Lexus RX350",
      plate: "4567 УНЕ",
      status: "completed",
      progress: 100,
      tech: "Temuulen",
    },
    {
      id: 4,
      vehicle: "Nissan Patrol Y62",
      plate: "7711 УБА",
      status: "waiting",
      progress: 0,
      tech: "Ganzorig",
    },
  ]);

  const [efficiency, setEfficiency] = useState(92.4);
  const [throughput, setThroughput] = useState(4.2);
  const [hourlyData, setHourlyData] = useState([3, 4, 2, 5, 4, 6, 5]);
  const [activeBaysCount, setActiveBaysCount] = useState(3);

  // Setup ticker events
  const [events, setEvents] = useState<LogEvent[]>([
    {
      id: "1",
      timestamp: "18:58:12",
      text: t("events.mechanicClockIn", { name: "Bat-Erdene", bay: "1" }),
      iconType: "clockIn",
    },
    {
      id: "2",
      timestamp: "18:56:45",
      text: t("events.alignmentPassed", { vehicle: "Toyota Prius 30" }),
      iconType: "alignment",
    },
    {
      id: "3",
      timestamp: "18:55:01",
      text: t("events.partDeducted", {
        qty: "4",
        part:
          t("diagnostics" /* Fallback if not standard */) === "Оношилгоо"
            ? "Амортизатор"
            : "Shock Absorber",
      }),
      iconType: "part",
    },
    {
      id: "4",
      timestamp: "18:52:10",
      text: t("events.workOrderCreated", {
        id: "4082",
        vehicle: "Lexus RX350",
      }),
      iconType: "workOrder",
    },
  ]);

  // Ref to prevent starting intervals multiple times
  const isInitialized = useRef(false);

  // Update progress of bays and log events
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Simulate progress increments
    const progressInterval = setInterval(() => {
      setBays((prevBays) =>
        prevBays.map((bay) => {
          if (bay.status === "repairing") {
            const nextProgress =
              bay.progress + Math.floor(Math.random() * 4) + 1;
            if (nextProgress >= 100) {
              return { ...bay, progress: 100, status: "completed" };
            }
            return { ...bay, progress: nextProgress };
          }
          if (bay.status === "diagnostics") {
            const nextProgress =
              bay.progress + Math.floor(Math.random() * 5) + 1;
            if (nextProgress >= 100) {
              return { ...bay, progress: 100, status: "repairing" };
            }
            return { ...bay, progress: nextProgress };
          }
          if (bay.status === "completed" && Math.random() > 0.85) {
            // Cycle bay
            const vehicles = [
              "Ford F-150",
              "Honda CR-V",
              "Kia Sportage",
              "Mercedes G-Class",
            ];
            const plates = ["4422 УБХ", "0981 УБВ", "3092 УАА", "8888 УБТ"];
            const techs = ["Khulan", "Bat-Erdene", "Temuulen", "Ganzorig"];
            const nextVehicle =
              vehicles[Math.floor(Math.random() * vehicles.length)];
            const nextPlate = plates[Math.floor(Math.random() * plates.length)];
            const nextTech = techs[Math.floor(Math.random() * techs.length)];
            return {
              ...bay,
              vehicle: nextVehicle,
              plate: nextPlate,
              status: "waiting",
              progress: 0,
              tech: nextTech,
            };
          }
          if (bay.status === "waiting" && Math.random() > 0.6) {
            return { ...bay, status: "diagnostics", progress: 5 };
          }
          return bay;
        }),
      );

      // Randomly adjust metrics
      setEfficiency((prev) => {
        const delta = (Math.random() - 0.5) * 0.4;
        return parseFloat(
          Math.min(99.8, Math.max(85.0, prev + delta)).toFixed(1),
        );
      });
      setThroughput((prev) => {
        const delta = (Math.random() - 0.5) * 0.2;
        return parseFloat(
          Math.min(8.0, Math.max(2.0, prev + delta)).toFixed(1),
        );
      });
    }, 3000);

    // Simulate real-time log updates
    const logInterval = setInterval(() => {
      const mnLang = t("diagnostics") === "Оношилгоо";
      const vehicleNames = [
        "Toyota Prius 30",
        "Mercedes Benz E-Class",
        "Lexus LX570",
        "Hyundai Accent",
        "Ford Ranger",
        "Subaru Forester",
      ];
      const partNames = mnLang
        ? [
            "Тормосны накладка",
            "Маслын шүүр",
            "Агаарын шүүр",
            "Свеч",
            "Бух хорхой",
          ]
        : [
            "Brake Pads",
            "Oil Filter",
            "Air Filter",
            "Spark Plug",
            "Tie Rod End",
          ];
      const techNames = ["Khulan", "Bat-Erdene", "Temuulen", "Ganzorig"];

      const eventTypes: LogEvent["iconType"][] = [
        "workOrder",
        "part",
        "payment",
        "alignment",
        "diagnostic",
        "clockIn",
      ];
      const chosenType =
        eventTypes[Math.floor(Math.random() * eventTypes.length)];

      let text = "";
      const idStr = Math.floor(1000 + Math.random() * 9000).toString();
      const randVehicle =
        vehicleNames[Math.floor(Math.random() * vehicleNames.length)];
      const randPart = partNames[Math.floor(Math.random() * partNames.length)];
      const randTech = techNames[Math.floor(Math.random() * techNames.length)];

      switch (chosenType) {
        case "workOrder":
          text = t("events.workOrderCreated", {
            id: idStr,
            vehicle: randVehicle,
          });
          break;
        case "part":
          text = t("events.partDeducted", {
            qty: Math.floor(1 + Math.random() * 4).toString(),
            part: randPart,
          });
          break;
        case "payment": {
          const amtStr = mnLang
            ? `₮${(Math.floor(2 + Math.random() * 8) * 50000).toLocaleString()}`
            : `$${Math.floor(50 + Math.random() * 200)}`;
          text = t("events.paymentReceived", { id: idStr, amount: amtStr });
          break;
        }
        case "alignment":
          text = t("events.alignmentPassed", { vehicle: randVehicle });
          break;
        case "diagnostic":
          text = t("events.diagnosticReport", { vehicle: randVehicle });
          break;
        case "clockIn":
          text = t("events.mechanicClockIn", {
            name: randTech,
            bay: Math.floor(1 + Math.random() * 4).toString(),
          });
          break;
      }

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      const newEvent: LogEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: timeStr,
        text,
        iconType: chosenType,
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 5)]);

      // Update hourly throughput chart data occasionally
      setHourlyData((prev) => {
        const nextData = [...prev.slice(1)];
        const newVal = Math.floor(2 + Math.random() * 6);
        nextData.push(newVal);
        return nextData;
      });

      // Update active bays count based on current states
      setBays((currBays) => {
        const activeCount = currBays.filter(
          (b) => b.status === "repairing" || b.status === "diagnostics",
        ).length;
        setActiveBaysCount(activeCount);
        return currBays;
      });
    }, 4500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, [t]);

  // Helper for rendering log icons
  const getLogIcon = (type: LogEvent["iconType"]) => {
    switch (type) {
      case "workOrder":
        return <ClipboardList className="size-4 text-emerald-400" />;
      case "part":
        return <Wrench className="size-4 text-amber-400" />;
      case "payment":
        return <Activity className="size-4 text-sky-400" />;
      case "alignment":
        return <CheckCircle2 className="size-4 text-teal-400" />;
      case "diagnostic":
        return <Cpu className="size-4 text-purple-400" />;
      case "clockIn":
        return <UserCheck className="size-4 text-indigo-400" />;
      default:
        return <Terminal className="size-4 text-zinc-400" />;
    }
  };

  // Status color mapper
  const getStatusColor = (status: Bay["status"]) => {
    switch (status) {
      case "diagnostics":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "repairing":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "waiting":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Top Brand Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="relative flex size-12 items-center justify-center border border-zinc-800 bg-zinc-900/60 shadow-[0_0_15px_rgba(255,255,255,0.03)]">
            <Wrench className="size-6 text-white animate-[pulse-soft_3s_infinite]" />
            <div className="absolute -top-0.5 -right-0.5 size-2 bg-emerald-500 animate-ping" />
            <div className="absolute -top-0.5 -right-0.5 size-2 bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold tracking-widest text-white">
                TOLOM OS
              </span>
              <span className="bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-zinc-400 border border-zinc-700">
                v0.9.4
              </span>
            </div>
            <Typography.Text className="text-xs text-zinc-400 tracking-wide font-sans">
              {t("subtitle")}
            </Typography.Text>
          </div>
        </div>
      </div>

      {/* Middle Interactive Console Screen */}
      <div className="my-4 flex-1 flex flex-col border border-zinc-800 bg-zinc-950/80 shadow-2xl relative">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span className="size-2 bg-red-500/80" />
            <span className="size-2 bg-yellow-500/80" />
            <span className="size-2 bg-green-500/80" />
            <span className="ml-2 font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
              {activeTab} console
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant={activeTab === "bays" ? "default" : "ghost"}
              size="xs"
              onClick={() => setActiveTab("bays")}
              className="font-mono text-[10px]"
            >
              [ {t("activeBays")} ]
            </Button>
            <Button
              variant={activeTab === "metrics" ? "default" : "ghost"}
              size="xs"
              onClick={() => setActiveTab("metrics")}
              className="font-mono text-[10px]"
            >
              [ {t("liveMetrics")} ]
            </Button>
            <Button
              variant={activeTab === "ledger" ? "default" : "ghost"}
              size="xs"
              onClick={() => setActiveTab("ledger")}
              className="font-mono text-[10px]"
            >
              [ {t("activityLedger")} ]
            </Button>
          </div>
        </div>

        {/* Console Screen Body */}
        <div className="flex-1 p-4 font-mono text-xs overflow-hidden relative min-h-[300px]">
          {/* Subtle grid lines background overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Render Active Bays Tab */}
          {activeTab === "bays" && (
            <div className="flex h-full flex-col justify-between gap-3 animate-scale-in">
              <div className="grid grid-cols-2 gap-3 flex-1">
                {bays.map((bay) => (
                  <div
                    key={bay.id}
                    className="group border border-zinc-800 bg-zinc-900/20 p-3 hover:bg-zinc-900/40 hover:border-zinc-700 transition-all flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-heading text-[10px] uppercase tracking-wider text-zinc-400">
                          {t("bay", { number: bay.id.toString() })}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] border font-bold uppercase tracking-wider ${getStatusColor(bay.status)}`}
                        >
                          {t(bay.status)}
                        </span>
                      </div>
                      <div className="font-semibold text-zinc-100 truncate text-[11px]">
                        {bay.vehicle}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {bay.plate}
                      </div>
                      <div className="mt-1 h-3 text-[8px] uppercase tracking-widest text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100">
                        {bay.tech}
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-1">
                        <span>SYS_TRACK_PRG</span>
                        <span>{bay.progress}%</span>
                      </div>
                      <div className="h-1 bg-zinc-800 overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            bay.status === "completed"
                              ? "bg-emerald-500"
                              : bay.status === "diagnostics"
                                ? "bg-purple-500"
                                : "bg-amber-500 animate-[progress-stripe_2s_linear_infinite]"
                          }`}
                          style={{
                            width: `${bay.progress}%`,
                            backgroundImage:
                              bay.status === "repairing"
                                ? "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)"
                                : "none",
                            backgroundSize: "16px 16px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Live Metrics Tab */}
          {activeTab === "metrics" && (
            <div className="h-full flex flex-col justify-between gap-4 animate-scale-in">
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-zinc-800 bg-zinc-900/10 p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <Gauge className="size-4 text-emerald-400" />
                  </div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest">
                    {t("efficiency")}
                  </div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {efficiency}%
                  </div>
                </div>
                <div className="border border-zinc-800 bg-zinc-900/10 p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <TrendingUp className="size-4 text-sky-400" />
                  </div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest">
                    {t("throughput")}
                  </div>
                  <div className="text-lg font-bold text-sky-400 mt-1">
                    {throughput}{" "}
                    <span className="text-[8px] text-zinc-500 lowercase">
                      {t("vehicles")}
                    </span>
                  </div>
                </div>
                <div className="border border-zinc-800 bg-zinc-900/10 p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <Clock className="size-4 text-purple-400" />
                  </div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest">
                    {t("activeTechs")}
                  </div>
                  <div className="text-lg font-bold text-purple-400 mt-1">
                    {activeBaysCount}/4
                  </div>
                </div>
              </div>

              {/* Simulated SVGs Mini Charts */}
              <div className="flex-1 border border-zinc-800 bg-zinc-900/10 p-3 flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between text-[9px] text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2">
                  <span>TELEMETRY_STREAM_LOAD_AVG</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />{" "}
                    LIVE
                  </span>
                </div>
                <div className="flex-1 flex items-end gap-1.5 h-20 px-2">
                  {hourlyData.map((val, idx) => {
                    const pctHeight = (val / 8) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 group"
                      >
                        <div className="text-[8px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                          {val}
                        </div>
                        <div
                          className="w-full bg-zinc-800 group-hover:bg-sky-500/80 transition-all border border-zinc-700"
                          style={{ height: `${Math.max(15, pctHeight)}px` }}
                        />
                        <div className="text-[8px] text-zinc-600 font-mono">
                          H-{6 - idx}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Render Activity Ledger Tab */}
          {activeTab === "ledger" && (
            <div className="h-full flex flex-col justify-between gap-3 animate-scale-in">
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2.5 border border-zinc-900/60 bg-zinc-900/10 p-2 hover:border-zinc-800 transition-colors animate-[slide-up_0.35s_ease-out-quart]"
                  >
                    <div className="mt-0.5 shrink-0">
                      {getLogIcon(event.iconType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-zinc-300 text-[11px] truncate">
                          {event.text}
                        </span>
                        <span className="text-[9px] text-zinc-600 font-mono select-none">
                          {event.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Terminal Status Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/20 px-4 py-1.5 font-mono text-[9px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 bg-emerald-500" />
            <span>SYS_ONLINE</span>
          </div>
          <span>SYS_MEM_USE: 24.8MB</span>
        </div>
      </div>

      {/* Bottom Features Ticker */}
      <div className="border-t border-zinc-800/80 pt-4 flex justify-between items-center text-xs text-zinc-500">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="size-1 bg-zinc-700" /> Multi-Tenant
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1 bg-zinc-700" /> Ledger-Inventory
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1 bg-zinc-700" /> RLS Protection
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-600 uppercase">
          <Activity className="size-3 text-zinc-600" /> SECURE_CONN
        </div>
      </div>
    </div>
  );
}
