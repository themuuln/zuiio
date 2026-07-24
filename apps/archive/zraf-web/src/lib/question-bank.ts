import type { Question } from "./models"

export const questionBank: Question[] = [
  // ── NAVIGATION / INTERSECTIONS ──
  {
    id: "q1",
    prompt:
      "At the uncontrolled intersection shown, who should go first?",
    choices: [
      "Your car",
      "Vehicle on the right",
      "Pedestrian",
      "Any larger vehicle",
    ],
    correctIndex: 1,
    shortExplanation:
      "At an equal-priority intersection, give way to vehicles approaching from the right.",
    longExplanation:
      "When there are no signs or signals at the intersection, the default rule applies: yield to the vehicle on your right before entering the crossing.",
    topic: "Intersections",
    subtopic: "Priority rules",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["priority", "intersection"],
    commonMistakeReason:
      "Learners often assume straight movement always has priority.",
    visual: {
      kind: "intersection",
      title: "Intersection diagram",
      caption:
        "Your vehicle approaches from the bottom. Another vehicle is on the right.",
    },
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q7",
    prompt: "When is overtaking prohibited?",
    choices: [
      "On a straight road with clear visibility",
      "At pedestrian crossings and blind curves",
      "Only at night",
      "Only when driving under 40 km/h",
    ],
    correctIndex: 1,
    shortExplanation:
      "Overtaking is prohibited where visibility and conflict risks are high.",
    longExplanation:
      "Crosswalks, blind curves, and other low-visibility or conflict-prone locations are unsafe for overtaking because they reduce reaction time.",
    topic: "Overtaking",
    subtopic: "Prohibited areas",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["overtaking", "safety"],
    commonMistakeReason:
      "Learners often think visibility only matters for oncoming traffic, not pedestrians.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q9",
    prompt:
      "Before entering a roundabout without traffic lights, who has priority?",
    choices: [
      "Vehicles already inside the roundabout",
      "Vehicles entering from the left",
      "The largest vehicle",
      "Whoever arrives first",
    ],
    correctIndex: 0,
    shortExplanation:
      "Vehicles already circulating in the roundabout have priority.",
    longExplanation:
      "Drivers must yield before entering the roundabout so circulating traffic can keep moving safely and predictably.",
    topic: "Intersections",
    subtopic: "Roundabouts",
    difficulty: "standard",
    sourceType: "Visual pack",
    tags: ["roundabout", "priority"],
    commonMistakeReason:
      "Learners sometimes carry over the yield-to-the-right rule incorrectly into roundabouts.",
    visual: {
      kind: "roundabout",
      title: "Roundabout diagram",
      caption: "Cars inside the circle continue before a new car enters.",
    },
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q13",
    prompt:
      "Which lane choice is safest when preparing to turn left at a marked junction?",
    choices: [
      "Stay in the far-right lane",
      "Move into the designated left-turn lane early",
      "Wait until the intersection to weave over",
      "Any lane is acceptable",
    ],
    correctIndex: 1,
    shortExplanation:
      "Move into the proper lane early so your position is clear and predictable.",
    longExplanation:
      "Lane discipline matters because it reduces late weaving and gives following drivers time to react. Prepare early and signal clearly before the turn.",
    topic: "Lane discipline",
    subtopic: "Turns",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["lane", "turns"],
    commonMistakeReason:
      "Late lane changes create confusion and last-second braking.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q17",
    prompt:
      "You want to turn left at an uncontrolled intersection while an oncoming car is going straight. What should you do?",
    choices: [
      "Turn first because you arrived earlier",
      "Yield to the oncoming car",
      "Flash your lights and continue",
      "Turn only if a pedestrian is present",
    ],
    correctIndex: 1,
    shortExplanation:
      "A left-turning driver must yield to oncoming traffic going straight unless signs or signals say otherwise.",
    longExplanation:
      "Turning across another vehicle's path creates a direct conflict. At an uncontrolled intersection, the safer and legal action is to wait for the oncoming vehicle to pass before completing the turn.",
    topic: "Intersections",
    subtopic: "Turning conflicts",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["intersection", "left turn"],
    commonMistakeReason:
      "Learners sometimes overvalue arrival order instead of conflict direction.",
    visual: {
      kind: "intersection",
      title: "Left-turn conflict",
      caption:
        "Your car plans to turn left while an oncoming vehicle continues straight.",
    },
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q21",
    prompt:
      "When leaving a roundabout, when should you signal to the right?",
    choices: [
      "As you approach the roundabout",
      "Only after you have completely exited",
      "As you pass the exit before the one you will take",
      "You never need to signal when exiting",
    ],
    correctIndex: 2,
    shortExplanation:
      "Signal your exit early enough to warn others, usually after passing the exit just before yours.",
    longExplanation:
      "Clear signaling helps entering drivers, cyclists, and pedestrians understand your path. Signaling too early misleads others, while signaling too late removes the benefit.",
    topic: "Intersections",
    subtopic: "Roundabouts",
    difficulty: "advanced",
    sourceType: "Visual pack",
    tags: ["roundabout", "signals"],
    commonMistakeReason:
      "Learners often signal too early and accidentally suggest they are taking an earlier exit.",
    visual: {
      kind: "roundabout",
      title: "Roundabout exit",
      caption:
        "Signal after passing the previous exit and before taking your own.",
    },
    pack: "Roundabout pack",
    premiumOnly: true,
    sourceGroup: "main",
  },

  // ── SPEED & SIGNALS ──
  {
    id: "q2",
    prompt:
      "What is the default speed limit in a typical urban area unless another sign is posted?",
    choices: ["20 km/h", "40 km/h", "60 km/h", "80 km/h"],
    correctIndex: 2,
    shortExplanation:
      "Urban default speed is typically 60 km/h unless a lower or higher limit is posted.",
    longExplanation:
      "The default urban speed limit applies to built-up areas. Drivers should still reduce speed further near schools, crossings, or hazards.",
    topic: "Speed rules",
    subtopic: "Urban speed",
    difficulty: "starter",
    sourceType: "Official-style",
    tags: ["speed", "urban"],
    commonMistakeReason:
      "People confuse special school-zone limits with the city default.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q4",
    prompt: "What does this circular sign mean?",
    choices: [
      "Minimum speed 40 km/h",
      "No parking",
      "Maximum speed 40 km/h",
      "School zone",
    ],
    correctIndex: 2,
    shortExplanation:
      "A red-bordered circle with 40 indicates the maximum permitted speed.",
    longExplanation:
      "Speed-limit signs use a red circle and a number to show the highest legal speed allowed from that point until another sign changes the rule.",
    topic: "Road signs",
    subtopic: "Regulatory signs",
    difficulty: "starter",
    sourceType: "Visual pack",
    tags: ["sign", "speed"],
    commonMistakeReason:
      "The red circle can be mistaken for a minimum-speed sign.",
    visual: {
      kind: "sign",
      title: "Speed sign",
      caption:
        "A circular sign with a red border and the number 40 inside.",
      symbol: "40",
    },
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q12",
    prompt:
      "In a school zone signaled by road markings and signs, how should you adjust your driving?",
    choices: [
      "Keep the normal city speed",
      "Increase speed to clear the zone quickly",
      "Reduce speed and watch for pedestrians",
      "Only watch for vehicles",
    ],
    correctIndex: 2,
    shortExplanation:
      "School zones require lower speed and extra attention to vulnerable road users.",
    longExplanation:
      "Children can move unpredictably near schools, so drivers should reduce speed, scan actively, and be ready to stop.",
    topic: "Speed rules",
    subtopic: "School zones",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["school zone", "speed"],
    commonMistakeReason:
      "Drivers focus on vehicles and forget about children crossing unexpectedly.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q14",
    prompt:
      "What is the correct response when a yellow traffic light appears and you can stop safely?",
    choices: [
      "Accelerate through the junction",
      "Stop before the line",
      "Ignore it if no one is around",
      "Use the horn and continue",
    ],
    correctIndex: 1,
    shortExplanation:
      "Yellow means prepare to stop and stop when it is safe to do so.",
    longExplanation:
      "The yellow signal warns that right-of-way is changing. If you can stop without hard braking or causing danger, you should stop before the line.",
    topic: "Signals",
    subtopic: "Traffic lights",
    difficulty: "starter",
    sourceType: "Official-style",
    tags: ["signals", "traffic light"],
    commonMistakeReason:
      "Drivers often treat yellow as permission to speed up instead of a warning to stop.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q18",
    prompt:
      "A circular sign with a red border and the number 30 is posted near a school. What does it mean?",
    choices: [
      "Minimum speed 30 km/h",
      "Maximum speed 30 km/h",
      "No stopping for 30 meters",
      "Recommended speed 30 km/h",
    ],
    correctIndex: 1,
    shortExplanation:
      "A red-bordered circle with 30 shows the highest legal speed is 30 km/h.",
    longExplanation:
      "The red circle indicates a mandatory restriction, not advice. In a school area, the 30 sign means drivers must not exceed 30 km/h until another sign changes the limit.",
    topic: "Road signs",
    subtopic: "Speed-limit signs",
    difficulty: "starter",
    sourceType: "Visual pack",
    tags: ["sign", "school zone"],
    commonMistakeReason:
      "Some learners confuse a mandatory speed-limit sign with a recommended speed.",
    visual: {
      kind: "sign",
      title: "30 km/h sign",
      caption:
        "A circular sign with a red border and the number 30 inside.",
      symbol: "30",
    },
    premiumOnly: false,
    sourceGroup: "main",
  },

  // ── SAFETY & HAZARDS ──
  {
    id: "q3",
    prompt:
      "When approaching a pedestrian already on the zebra crossing, what must you do?",
    choices: [
      "Honk to warn them",
      "Maintain speed if there is space",
      "Stop and yield",
      "Pass quickly before they reach your lane",
    ],
    correctIndex: 2,
    shortExplanation:
      "Pedestrians already crossing must be given priority.",
    longExplanation:
      "Drivers must slow down and stop when necessary to allow pedestrians to safely complete their crossing. This rule protects vulnerable road users.",
    topic: "Pedestrian safety",
    subtopic: "Crosswalks",
    difficulty: "starter",
    sourceType: "Official-style",
    tags: ["pedestrian", "crosswalk"],
    commonMistakeReason:
      "Some learners think pedestrians only have priority when they are directly in front of the car.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q5",
    prompt:
      "How should you respond when an ambulance approaches with siren and lights active?",
    choices: [
      "Keep your lane and speed",
      "Yield and make a safe path",
      "Stop in the middle of the lane",
      "Race ahead and clear the area",
    ],
    correctIndex: 1,
    shortExplanation:
      "Emergency vehicles with active signals must be given a clear and safe path.",
    longExplanation:
      "Drivers should reduce speed, check surroundings, and move aside safely so the emergency vehicle can pass without obstruction.",
    topic: "Emergency situations",
    subtopic: "Emergency vehicles",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["emergency", "yield"],
    commonMistakeReason:
      "Stopping abruptly can block traffic instead of creating space.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q6",
    prompt:
      "The road scene shows a cyclist ahead near a warning marker. What is the safest action?",
    choices: [
      "Overtake immediately",
      "Maintain speed and pass closely",
      "Slow down and prepare to yield space",
      "Use high beam to signal the cyclist",
    ],
    correctIndex: 2,
    shortExplanation:
      "Reduce speed and allow safe clearance when approaching vulnerable road users near hazards.",
    longExplanation:
      "Cyclists need extra space, especially near hazard areas. Slowing down and waiting for a safe pass reduces collision risk.",
    topic: "Hazard recognition",
    subtopic: "Cyclists and visibility",
    difficulty: "advanced",
    sourceType: "Visual pack",
    tags: ["hazard", "cyclist"],
    commonMistakeReason:
      "Drivers may focus on traffic flow instead of the cyclist's safety margin.",
    visual: {
      kind: "hazard",
      title: "Hazard scene",
      caption:
        "A cyclist is ahead while a warning triangle indicates a risk zone.",
    },
    pack: "Hazard pack",
    premiumOnly: true,
    sourceGroup: "main",
  },
  {
    id: "q10",
    prompt:
      "Why is wearing a seat belt mandatory for the driver and passengers?",
    choices: [
      "It improves engine balance",
      "It reduces crash injury risk",
      "It lowers fuel consumption",
      "It is optional on short trips",
    ],
    correctIndex: 1,
    shortExplanation:
      "Seat belts dramatically reduce injury risk in a collision.",
    longExplanation:
      "Seat belts hold occupants in position, reduce impact force, and work together with airbags and vehicle structure to protect lives.",
    topic: "Law basics",
    subtopic: "Safety equipment",
    difficulty: "starter",
    sourceType: "Official-style",
    tags: ["seat belt", "safety"],
    commonMistakeReason:
      "Some people assume low speeds make seat belts unnecessary.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q11",
    prompt:
      "What should you do when approaching a railway crossing with active warning lights?",
    choices: [
      "Continue if the train is not visible yet",
      "Stop and wait until the warning ends",
      "Speed up and cross quickly",
      "Change lanes on the crossing",
    ],
    correctIndex: 1,
    shortExplanation:
      "Active railway warnings require a full stop and patience.",
    longExplanation:
      "Railway signals warn of immediate danger. Trains cannot stop quickly, so drivers must wait until the warning lights or barriers clearly show it is safe to proceed.",
    topic: "Hazard recognition",
    subtopic: "Railway crossings",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["railway", "warning"],
    commonMistakeReason:
      "Drivers sometimes rely on visibility instead of the signal system.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q15",
    prompt:
      "Why should you increase following distance in rain or snow?",
    choices: [
      "To save fuel",
      "Because braking distance becomes longer",
      "To allow more overtaking opportunities",
      "Because road signs are harder to read",
    ],
    correctIndex: 1,
    shortExplanation:
      "Reduced grip increases stopping distance, so more space is needed.",
    longExplanation:
      "Wet or icy roads reduce tire grip. A larger following distance gives you more time and room to respond if the vehicle ahead slows down suddenly.",
    topic: "Hazard recognition",
    subtopic: "Weather",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["weather", "braking"],
    commonMistakeReason:
      "Drivers underestimate how much traction changes in bad weather.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q16",
    prompt:
      "When should low-beam headlights be used instead of high beams?",
    choices: [
      "Only at sunset",
      "When another vehicle could be dazzled",
      "Only inside tunnels",
      "Never on rural roads",
    ],
    correctIndex: 1,
    shortExplanation:
      "Use low beams whenever high beams would impair another road user.",
    longExplanation:
      "High beams improve visibility for you but can temporarily blind oncoming drivers, cyclists, and pedestrians. Switch to low beams when another road user is affected.",
    topic: "Law basics",
    subtopic: "Lights",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["lights", "night"],
    commonMistakeReason:
      "Some learners think high beams are always safer, regardless of other traffic.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q19",
    prompt:
      "What is the safest following-distance decision when you are driving behind a large truck in heavy rain?",
    choices: [
      "Move closer so other cars cannot merge",
      "Keep the normal dry-road gap",
      "Increase the gap because spray and braking distance are worse",
      "Drive beside the truck to improve visibility",
    ],
    correctIndex: 2,
    shortExplanation:
      "Rain and reduced visibility both increase the space you need behind a large vehicle.",
    longExplanation:
      "A truck throws spray that reduces your view and wet roads increase stopping distance. Leaving a larger gap gives you more reaction time and a clearer view of hazards ahead.",
    topic: "Hazard recognition",
    subtopic: "Weather and visibility",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["weather", "following distance"],
    commonMistakeReason:
      "Drivers often focus on keeping position in traffic instead of preserving reaction space.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q22",
    prompt:
      "What should you do if a pedestrian steps onto the crossing while you are turning right?",
    choices: [
      "Continue because your turn has already started",
      "Stop and yield to the pedestrian",
      "Sound the horn and complete the turn",
      "Drive behind the pedestrian without stopping",
    ],
    correctIndex: 1,
    shortExplanation:
      "Turning vehicles must still give way to pedestrians using the crossing.",
    longExplanation:
      "A turn does not cancel pedestrian priority. If someone enters the crossing during your turn, you must slow or stop so they can cross safely before you continue.",
    topic: "Pedestrian safety",
    subtopic: "Turning and crossings",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["pedestrian", "turning"],
    commonMistakeReason:
      "Drivers can become too focused on traffic gaps and miss the crossing rule.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q23",
    prompt:
      "In dense fog, which light choice is safest and most legally appropriate?",
    choices: [
      "High beams at all times",
      "Low beams and reduced speed",
      "Parking lights only",
      "No lights during daytime fog",
    ],
    correctIndex: 1,
    shortExplanation:
      "Low beams help you stay visible without the glare that high beams create in fog.",
    longExplanation:
      "High beams reflect back from fog and reduce visibility. Low beams combined with a lower speed give you better control and make your car easier for others to see.",
    topic: "Law basics",
    subtopic: "Lights",
    difficulty: "standard",
    sourceType: "Official-style",
    tags: ["fog", "lights"],
    commonMistakeReason:
      "People often assume brighter lights always improve visibility, even in fog.",
    premiumOnly: false,
    sourceGroup: "main",
  },
  {
    id: "q24",
    prompt:
      "Why must a child be restrained with an appropriate seat or belt system instead of sitting freely in the back seat?",
    choices: [
      "It keeps the child from distracting the driver only",
      "It reduces injury risk and keeps the child secured in a crash",
      "It is required only for trips outside the city",
      "It is optional if an adult is seated nearby",
    ],
    correctIndex: 1,
    shortExplanation:
      "Children need proper restraints because adult belts alone may not protect them correctly.",
    longExplanation:
      "A child restraint or suitable belt position protects a child's body during braking and collisions. Without it, even a low-speed crash can cause severe injury.",
    topic: "Law basics",
    subtopic: "Child safety",
    difficulty: "starter",
    sourceType: "Official-style",
    tags: ["child safety", "seat belt"],
    commonMistakeReason:
      "Some learners underestimate how unsafe an unrestrained passenger is, especially on short trips.",
    premiumOnly: false,
    sourceGroup: "main",
  },

  // ── PARKING ──
  {
    id: "q8",
    prompt: "What is the best parking decision in the diagram?",
    choices: [
      "Park close to the corner for convenience",
      "Park within the marked area away from the corner",
      "Park partly on the pedestrian path",
      "Stop in the travel lane",
    ],
    correctIndex: 1,
    shortExplanation:
      "Stay inside the marked bay and keep intersections and pedestrian paths clear.",
    longExplanation:
      "Parking rules protect sight lines, pedestrian access, and traffic flow. The marked bay is the safe and legal place to stop.",
    topic: "Parking",
    subtopic: "Parking placement",
    difficulty: "standard",
    sourceType: "Visual pack",
    tags: ["parking", "diagram"],
    commonMistakeReason:
      "Drivers sometimes prioritize convenience over visibility and access.",
    visual: {
      kind: "parking",
      title: "Parking layout",
      caption:
        "A marked parking bay sits away from the corner and pedestrian route.",
    },
    premiumOnly: true,
    pack: "Parking pack",
    sourceGroup: "main",
  },
  {
    id: "q20",
    prompt:
      "The marked parking area is next to a pedestrian path. Which choice is correct?",
    choices: [
      "Stop partly across the pedestrian path",
      "Park fully inside the bay and keep the path clear",
      "Park as close to the corner as possible",
      "Leave the car angled into the traffic lane",
    ],
    correctIndex: 1,
    shortExplanation:
      "Use the marked bay and do not block pedestrian movement or the corner view.",
    longExplanation:
      "Good parking keeps sight lines open and pedestrian routes usable. Staying fully inside the bay prevents conflicts with people walking and drivers approaching the junction.",
    topic: "Parking",
    subtopic: "Pedestrian clearance",
    difficulty: "standard",
    sourceType: "Visual pack",
    tags: ["parking", "pedestrian"],
    commonMistakeReason:
      "Convenience can make drivers ignore how much space pedestrians need.",
    visual: {
      kind: "parking",
      title: "Parking and walkway",
      caption:
        "The marked bay leaves space for pedestrians and keeps the corner open.",
    },
    pack: "Parking pack",
    premiumOnly: true,
    sourceGroup: "main",
  },
]

export const officialTestBank: Question[] = [
  {
    id: "official_1",
    prompt:
      "Автомашины жолооч тээврийн хэрэгслийн эгнээгээ солихдоо яах ёстой вэ?",
    choices: [
      "Гэнэт эгнээгээ солих",
      "Дохио өгч, толь харж, аюулгүй зайтай үед солих",
      "Зөвхөн хурдаа нэмээд солих",
      "Зорчигчдоо мэдэгдээд солих",
    ],
    correctIndex: 1,
    shortExplanation: "Дохио өгч, нөхцөл байдлаа шалгаад л эгнээ солино.",
    longExplanation:
      "Эгнээ солихдоо эхлээд чиглэлийн дохио өгч, толиор харж, аюулгүй зай үүссэн үед гүйцэтгэх нь зөв.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "standard",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Яаралтай эгнээ солих нь осолд хүргэж болно.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_2",
    prompt: "Ямар тохиолдолд жолооч зам тавьж өгөх үүрэгтэй вэ?",
    choices: [
      "Гэрлэн дохиотой уулзвар дээр",
      "Гол замд гарч байгаа үед",
      "Зөвхөн дугуйчинд",
      "Авто зогсоол дотор",
    ],
    correctIndex: 1,
    shortExplanation: "Гол замд гарч байгаа тээврийн хэрэгсэл зам тавьж өгөх ёстой.",
    longExplanation:
      "Туслах замаас гол замд гарч байгаа жолооч гол замаар явж буй тээврийн хэрэгсэлд зам тавьж өгөх үүрэгтэй.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "starter",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Гол замд гарч байгаа үедээ хурдаа нэмээд гарч болно гэж андуурдаг.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_3",
    prompt: "Машин жолоодох үед гар утас ашиглах талаар зөв хандлага нь?",
    choices: [
      "Гар утсаар ярьж болно",
      "Зөвхөн SMS бичиж болно",
      "Машинаа зогсоогоод ашиглах",
      "Хүлээгдэж буй дохиогоор л хэрэглэх",
    ],
    correctIndex: 2,
    shortExplanation: "Машин жолоодож байхдаа гар утас ашиглахыг хориглоно.",
    longExplanation:
      "Жолоо барьж байхдаа гар утас ашиглах нь анхаарал сарниулж, осол гарах эрсдэлийг нэмэгдүүлдэг. Аюулгүй газар зогсоод л ашиглах хэрэгтэй.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "starter",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Богино хугацаанд харсан ч аюултай гэдгийг ойлгодоггүй.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_4",
    prompt:
      "Согтууруулах ундааны нөлөөгөөр тээврийн хэрэгсэл жолоодсон бол ямар хариуцлага хүлээх вэ?",
    choices: [
      "Зөвхөн торгох",
      "Жолооны үнэмлэхийг хуультай хугацаагаар хасч, торгох",
      "Ямар ч хариуцлагагүй",
      "Зөвхөн анхааруулга өгөх",
    ],
    correctIndex: 1,
    shortExplanation:
      "Согтуугаар жолоодсон бол үнэмлэхийг хурааж, торгох хариуцлага хүлээлгэдэг.",
    longExplanation:
      "Согтууруулах ундааны нөлөөгөөр тээврийн хэрэгсэл жолоодох нь хуулиар хориглогдож, жолооны үнэмлэх хасагдах, торгууль ногдуулах зэрэг хариуцлага хүлээлгэдэг.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "standard",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Согтуугаар жолоодсоноор үнэмлэх хасагддаг гэдгийг ойлгодоггүй.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_5",
    prompt:
      "Хүүхдийг тээврийн хэрэгсэлд суулгахдаа ямар дүрэм мөрдөх вэ?",
    choices: [
      "Насанд хүрэгчдийн суудалд суулгаж болно",
      "Тусгай хүүхдийн суудалд суулгах",
      "Өвөр дээрээ суулгаж болно",
      "Хойд суудалд чөлөөтэй суулгаж болно",
    ],
    correctIndex: 1,
    shortExplanation: "Хүүхдийг тусгай хүүхдийн суудалд суулгах ёстой.",
    longExplanation:
      "12 хүртэлх насны хүүхдийг тээврийн хэрэгсэлд тусгай хүүхдийн суудалд суулгах шаардлагатай. Энэ нь хүүхдийн аюулгүй байдлыг хангахад чухал юм.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "standard",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Хүүхдийг хэвийн суудалд суулгахад л болно гэж боддог.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_6",
    prompt: "Тээврийн хэрэгслийн аюулгүй зай гэж юу вэ?",
    choices: [
      "Урд явж буй машинаас 5 метрийн зай",
      "Осол гарахаас сэргийлэх хангалттай зай",
      "Машины урттай тэнцүү зай",
      "10 метрийн зай",
    ],
    correctIndex: 1,
    shortExplanation:
      "Аюулгүй зай нь гэнэтийн нөхцөлд хариу үйлдэл хийх хангалттай зай юм.",
    longExplanation:
      "Урд явж буй тээврийн хэрэгслээс хангалттай зай байлгаснаар гэнэт тоормослох, ослоос зайлсхийх боломжтой болдог.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "starter",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Ойрхон явснаар цаг хэмнэдэг гэж андуурдаг.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_7",
    prompt: "Ямар үед тээврийн хэрэгслийн гэрлийг асаах шаардлагатай вэ?",
    choices: [
      "Зөвхөн шөнө",
      "Үзэгдэх орчин хязгаарлагдмал үед",
      "Хотод явах үед",
      "Зөвхөн бороотой үед",
    ],
    correctIndex: 1,
    shortExplanation:
      "Үзэгдэх орчин хязгаарлагдмал үед гэрэл асаах шаардлагатай.",
    longExplanation:
      "Манан, бороо, шороон шуурга, үдэш, үүр цайх зэрэг үзэгдэх орчин хязгаарлагдмал үед тээврийн хэрэгслийн гэрлийг заавал асаах ёстой.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "standard",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Зөвхөн шөнө л гэрэл асаах хэрэгтэй гэж боддог.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_8",
    prompt: "Ямар тэмдэг нь зогсохыг хориглодог вэ?",
    choices: [
      "Улаан хүрээтэй, дундаа хөндлөн зураас бүхий дугуй тэмдэг",
      "Цэнхэр дөрвөлжин тэмдэг",
      "Шар гурвалжин тэмдэг",
      "Ногоон дугуй тэмдэг",
    ],
    correctIndex: 0,
    shortExplanation:
      "Улаан хүрээтэй, хөндлөн зураас бүхий дугуй тэмдэг нь зогсохыг хориглоно.",
    longExplanation:
      "Зогсохыг хориглох тэмдэг нь улаан хүрээтэй, дундаа хөндлөн зураас бүхий дугуй хэлбэртэй байдаг.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "standard",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Хориглох тэмдгүүдийг андуурдаг.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_9",
    prompt:
      "Автомашины хөдөлгүүрийг асаахаасаа өмнө яах ёстой вэ?",
    choices: [
      "Дугуйны даралтыг шалгах",
      "Суудлын бүсээ тохируулах",
      "Толины байрлалыг шалгаж, суудлын бүсээ бүслэх",
      "Радио асаах",
    ],
    correctIndex: 2,
    shortExplanation:
      "Хөдөлгөөн эхлэхээс өмнө толины байрлал шалгаж, бүсээ бүслэх ёстой.",
    longExplanation:
      "Жолооч хөдөлгөөн эхлэхээс өмнө толины байрлалаа тохируулж, суудлын бүсээ бүслэх нь аюулгүй байдлын үндсэн шаардлага юм.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "starter",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Хөдөлгөөн эхлэхээс өмнө суудлын бүсээ бүслэхээ мартаж байдаг.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_10",
    prompt:
      "Хурдны зам дээр явахдаа урд явж буй машинаас хэдэн метрийн зай барих вэ?",
    choices: [
      "30 метр",
      "50 метр",
      "Хурдаас хамаарч аюулгүй зай барих",
      "10 метр",
    ],
    correctIndex: 2,
    shortExplanation:
      "Аюулгүй зай нь хурднаас хамаарч тогтоогдоно.",
    longExplanation:
      "Хурдны зам дээр явахдаа урд явж буй машинаас хамгийн багадаа 2 секундын зай барихыг зөвлөдөг. Энэ нь хурднаас хамаарч өөрчлөгдөнө.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "standard",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Тогтмол зай барихад хангалттай гэж боддог.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_11",
    prompt: "Дугуйн гинж (chain) хэзээ хэрэглэх вэ?",
    choices: [
      "Зуны улиралд",
      "Мөстэй, цастай үед",
      "Хуурай замд",
      "Бороотой үед",
    ],
    correctIndex: 1,
    shortExplanation: "Мөстэй, цастай үед дугуйн гинж хэрэглэнэ.",
    longExplanation:
      "Мөстэй, цастай замд дугуйн гинж хэрэглэснээр барьцалдах чадвар сайжирч, аюулгүй хөдөлгөөн хийх боломжтой болдог.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "starter",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Зөвхөн цастай үед л хэрэглэдэг гэж ойлгодог.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_12",
    prompt:
      "Осол гарсан үед жолооч хамгийн түрүүнд яах ёстой вэ?",
    choices: [
      "Хэргийн газраас зугтах",
      "Осолдогсдод тусламж үзүүлж, цагдаа дуудах",
      "Гэрэл зураг авах",
      "Найз нөхөддөө залгах",
    ],
    correctIndex: 1,
    shortExplanation:
      "Осол гарсан үед түрүүнд тусламж үзүүлж, цагдаа дуудах хэрэгтэй.",
    longExplanation:
      "Зам тээврийн осол гарсан тохиолдолд жолооч осолдогсдод тусламж үзүүлэх, цагдаагийн байгууллагад мэдэгдэх, ослын газрыг хамгаалах зэрэг үүрэг хүлээдэг.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "standard",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Осол гарсан үед юу хийхээ мэддэггүй.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_13",
    prompt:
      "Тээврийн хэрэгслийн тоормосны зайд нөлөөлдөг хүчин зүйлс?",
    choices: [
      "Зөвхөн машины хурд",
      "Хурд, зам, дугуйны нөхцөл, жин",
      "Зөвхөн замын нөхцөл",
      "Жолоочийн туршлага",
    ],
    correctIndex: 1,
    shortExplanation:
      "Тоормосны зайд хурд, зам, дугуй, жин зэрэг олон хүчин зүйл нөлөөлдөг.",
    longExplanation:
      "Машины хурд, замын гадаргуугийн нөхцөл, дугуйны байдал, тээврийн хэрэгслийн жин зэрэг нь тоормосны зайд нөлөөлдөг гол хүчин зүйлс юм.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "standard",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Зөвхөн хурд л тоормосны зайд нөлөөлдөг гэж боддог.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_14",
    prompt: "Ямар тэмдэг нь \"гарц\" буюу зөвшөөрөгдсөн гарцыг заадаг вэ?",
    choices: [
      "Ногоон дөрвөлжин тэмдэг",
      "Цэнхэр дөрвөлжин тэмдэг",
      "Шар гурвалжин тэмдэг",
      "Цэнхэр дугуй тэмдэг",
    ],
    correctIndex: 1,
    shortExplanation: "Цэнхэр дөрвөлжин тэмдэг нь зөвшөөрөгдсөн гарцыг заана.",
    longExplanation:
      "Цэнхэр дөрвөлжин тэмдэг нь чиглэл заадаг тэмдэг бөгөөд ямар чиглэлд явахыг тодорхойлдог.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "standard",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Тэмдгийн өнгө, хэлбэрийг андуурдаг.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
  {
    id: "official_15",
    prompt:
      "Тээврийн хэрэгслийн хурд хэмжигч (speedometer) ямар мэдээлэл өгдөг вэ?",
    choices: [
      "Хөдөлгүүрийн эргэлт",
      "Явж буй хурд",
      "Шатахууны үлдэгдэл",
      "Зорчих зай",
    ],
    correctIndex: 1,
    shortExplanation: "Хурд хэмжигч нь явах хурдыг заана.",
    longExplanation:
      "Спидометр нь тээврийн хэрэгслийн явах хурдыг км/ц-ээр харуулдаг ба хурдны дэглэм сахихад тусалдаг.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: "starter",
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason:
      "Хурд хэмжигч болон тахометрийг андуурдаг.",
    premiumOnly: false,
    sourceGroup: "officialTest",
  },
]

export const schools = [
  {
    id: "batkhuleg",
    name: "Батхүлэг авто сургууль",
    initials: "БА",
    inviteCode: 'batkhuleg.mn',
    websiteUrl: 'https://batkhuleg.mn/',
    brandColor: '#2563EB',
    branches: [],
  },
]
