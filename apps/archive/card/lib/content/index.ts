/**
 * Game Content Database
 *
 * Central content for all party games: Truth or Dare, Never Have I Ever,
 * Hot Takes, Most Likely To, Would You Rather.
 *
 * Content is organized by:
 *   - gameType (game identifier)
 *   - category (sub-topic)
 *   - tier (spicy | wild | after-dark)
 *
 * Source credits: madpartygames, psycatgames, buzzfeed, drinkcountr, thestallionstyle
 */

export type ContentTier = "spicy" | "wild" | "after-dark";

export interface GameContentEntry {
  id: string;
  gameType: string;
  category: string;
  tier: ContentTier;
  text: string;
  extra?: Record<string, string>;
}

let contentIdCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}-${++contentIdCounter}`;
}

export function resetContentIdCounter(): void {
  contentIdCounter = 0;
}

// ──────────────────────────────────────────────
// TRUTH OR DARE — TRUTHS
// ──────────────────────────────────────────────

const TRUTHS_SPICY: GameContentEntry[] = [
  // Spicy tier — flirty, cheeky, mild
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What is your biggest guilty pleasure?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What's the most embarrassing song on your playlist?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Have you ever lied to get out of plans with a friend?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What's the longest you've gone without showering?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Have you ever stalked an ex on social media?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What's the most expensive thing you've broken?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Have you ever blamed a fart on someone else?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What's the most embarrassing thing your parents have caught you doing?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Have you ever called in sick to work when you were fine?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What's the weirdest food combination you secretly enjoy?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Have you ever re-gifted a present?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What's the last lie you told?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Have you ever pretended to laugh at a joke you didn't understand?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Who was your first celebrity crush?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What's the most embarrassing thing in your search history?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Have you ever taken something from a hotel room?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What's the worst date you've ever been on?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Have you ever sent a text to the wrong person?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "What's the most illegal thing you've ever done?" },
  { id: "", gameType: "truth-or-dare", category: "secrets", tier: "spicy", text: "Have you ever had a crush on a friend's partner?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "What's your idea of a perfect date?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "Have you ever had a crush on a teacher or boss?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "What's the biggest deal-breaker in a relationship for you?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "Have you ever dated two people at the same time?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "Who in this room would you most want to be stuck on an island with?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "What's the most attractive quality in a person?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "Have you ever had a friends-with-benefits situation?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "What's the worst pickup line someone has used on you?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "Have you ever said 'I love you' and not meant it?" },
  { id: "", gameType: "truth-or-dare", category: "relationships", tier: "spicy", text: "What's your go-to flirting tactic?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "What's the most embarrassing thing you've done in public?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "Have you ever walked into a glass door?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "What's the most awkward moment you've had with a stranger?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "Have you ever laughed so hard you snorted?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "What's the worst haircut you've ever had?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "Have you ever waved at someone who wasn't waving at you?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "What's the most childish thing you still do?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "Have you ever accidentally liked an old photo while stalking someone?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "What's the worst fashion trend you've ever followed?" },
  { id: "", gameType: "truth-or-dare", category: "embarrassing", tier: "spicy", text: "Have you ever tripped in public and pretended nothing happened?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "What's the stupidest thing you've ever done for money?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "Have you ever talked to yourself in a public place?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "What's the weirdest dream you've ever had?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "If you had a theme song, what would it be?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "What's the most useless talent you have?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "Have you ever worn your shirt inside out without realizing?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "If you could swap lives with someone in this room, who would it be?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "What's the most ridiculous thing you've ever bought?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "What would your wrestling name and entrance music be?" },
  { id: "", gameType: "truth-or-dare", category: "funny", tier: "spicy", text: "If you were a ghost, who would you haunt and why?" },
];

const TRUTHS_WILD: GameContentEntry[] = [
  // Wild tier — raunchy, sexual references, heavy
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's your sexual 'type'?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Would you consider yourself dominant, submissive, or somewhere in between?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What gives you the ick in bed?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's at the top of your sexual bucket list?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever had a one-night stand?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the hottest thing anyone has said to you during sex?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the sexiest song of all time?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever had sex in a public place?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the longest you've gone without sex?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's your opinion on open relationships?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the most times you've had sex in one day?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Do you know your body count?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's your biggest sexual fear?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the worst sex position you've ever tried?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever had a sex dream about anyone in this room?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the most embarrassing thing that's happened to you during sex?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever sent a nude photo?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's your favorite type of foreplay?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever used a sex toy?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's your favorite position?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever gone skinny dipping?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever had a crush on a friend's partner?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever been caught in the act?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the most adventurous place you've had sex?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever faked an orgasm?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the dirtiest thought you've ever had about a stranger?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever had a sexual dream about a coworker?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Do you prefer giving or receiving oral?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the kinkiest thing you've ever done?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever hooked up with someone you just met?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the sexiest dream you've ever had?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever experimented with someone of the same sex?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever sexted?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the wildest sex position you've tried?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever been walked in on while having sex?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Do you prefer rough or gentle sex?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever taken the BDSM test?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the weirdest thing that turns you on?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "Have you ever had sex in a car?" },
  { id: "", gameType: "truth-or-dare", category: "sexual", tier: "wild", text: "What's the most people you've hooked up with in one night?" },
];

const TRUTHS_AFTER_DARK: GameContentEntry[] = [
  // After Dark — explicit, no limits
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's your wildest sexual fantasy?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever had a threesome?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's your most embarrassing sexual experience?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever filmed yourself having sex?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's your favorite type of porn?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the most orgasms you've had in one day?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever had sex with a friend's partner?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the most sexually daring thing you've done?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever tried anal sex?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever been part of an orgy?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the dirtiest text you've ever sent or received?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever masturbated in a public place?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the most unusual object you've used as a sex toy?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever cheated on a partner?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the kinkiest dream you've ever had?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever been to a sex party?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the most people you've had sex with at once?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever made a sex tape?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the most degrading thing you've enjoyed in bed?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever had sex with someone of the same gender?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the most you've done with someone right after meeting them?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever used food during foreplay?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the most embarrassing sexual question you've ever been asked?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever been in a swingers' club?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the worst sexual experience you've ever had?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever had a sexual encounter with someone of a different generation?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Do you enjoy being watched while having sex?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the longest sexual session you've had?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever been handcuffed or tied up during sex?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the riskiest place you've ever had sex?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever had sex with someone in a position of power?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's your favorite type of dirty talk?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever invited a third person into your bedroom?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "What's the most taboo fantasy you've had?" },
  { id: "", gameType: "truth-or-dare", category: "explicit", tier: "after-dark", text: "Have you ever paid for sex or been paid for it?" },
];

// ──────────────────────────────────────────────
// TRUTH OR DARE — DARES
// ──────────────────────────────────────────────

const DARES_SPICY: GameContentEntry[] = [
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Do your best impression of the person to your left." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Talk in an accent for the next 3 rounds." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Post the oldest selfie on your phone to your social media." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Let someone in the group draw a tattoo on you with marker." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Sing the chorus of the last song you listened to." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Do a dramatic reading of the last text you sent." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Speak in rhymes for the next 5 minutes." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Act out a scene from a movie while others guess what movie it is." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Call a friend and compliment them for 30 seconds without context." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Wear your shirt backward for the rest of the game." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Do 10 pushups right now." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Let the group look through your camera roll for 30 seconds." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Share the most embarrassing photo on your phone." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Do a fortnite dance and hold the last pose for 5 seconds." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Give a 30-second infomercial about a random object in the room." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Let someone go through your Instagram DMs for 30 seconds." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Yell the first word that comes to your mind." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Do your best catwalk across the room." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Exchange an item of clothing with someone in the group." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "spicy", text: "Say something flirty to the person on your right." },
];

const DARES_WILD: GameContentEntry[] = [
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Take a body shot off someone in this room." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Do your best striptease to a song of the group's choice." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Let the person to your right send one text from your phone." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Whisper something seductive to the person on your left." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Close your eyes and let someone feed you something of their choice." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Give a lap dance to the chair for 30 seconds." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Hold eye contact with the person across from you for 30 seconds without laughing." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Call your crush and tell them you're thinking about them." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Remove one item of clothing of your choice." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Let someone in the group put lipstick on you blindfolded." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Read a passage from an erotic novel out loud without laughing." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Show us your best stripper move on a chair." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "DM your ex 'I miss you' and show the group their response." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Put on the sexiest outfit you can make from items in the room." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Take a sexy photo and make it your contact photo for someone here." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Tell each person in the group one thing you find attractive about them." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Sit on someone's lap for the next 3 rounds." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Do your best phone sex operator voice and say a pickup line." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Kiss the person to your left on the cheek." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "wild", text: "Change your lock screen to a sexy photo for the rest of the night." },
];

const DARES_AFTER_DARK: GameContentEntry[] = [
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Kiss every person in the room on the lips." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Let someone in the group go through your search history out loud." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Do a body shot off someone of your choice." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Send a flirty message to someone in your contacts the group picks." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Let the person to your right write a dare on your body with a marker." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Remove three items of clothing or take 3 shots." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Give a lap dance to someone in the room for one minute." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Let the group choose someone for you to kiss." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Call the sexiest person in your contacts and say something dirty." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Recreate your favorite porn scene (description only)." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Let the group handcuff or tie you to something for 10 minutes." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Text your ex a screenshot of your conversation with the group." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Moan as if you were in ecstasy for 15 seconds." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Share the last sext you sent or received with the group." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Do a striptease to a song of the group's choice (at least 30 seconds)." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Let someone blindfold you for the next 2 rounds and do whatever they say." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Pick someone to make out with. You have 10 seconds." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Send a voice recording of your best dirty talk to someone." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Shots轮流 — take a body shot off of the person the group chooses." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Let everyone in the group spank you once (clothes on)." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Draw a picture of what you want to do to someone in this room, then show them." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Do your best impression of someone having sex." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Give the person on your left a hickey." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Narrate how you would seduce someone in this room step by step." },
  { id: "", gameType: "truth-or-dare", category: "dares", tier: "after-dark", text: "Post a sexy selfie to your Instagram story for 60 seconds then delete." },
];

// ──────────────────────────────────────────────
// NEVER HAVE I EVER
// ──────────────────────────────────────────────

const NHIE_SPICY: GameContentEntry[] = [
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever sent a text to the wrong person." },
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever pretended to laugh at a joke I didn't understand." },
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever stalked an ex on social media." },
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever blamed a fart on someone else." },
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever called in sick to do something fun." },
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever re-gifted a present." },
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever lied about my age." },
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever eaten food off the floor." },
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever ghosted someone." },
  { id: "", gameType: "never-have-i-ever", category: "embarrassing", tier: "spicy", text: "Never have I ever forgotten someone's name right after being introduced." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever walked into a glass door." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever waved back at someone who wasn't waving at me." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever laughed so hard I snorted." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever accidentally liked an old photo while stalking someone." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever talked to myself in a public place." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever sat on wet paint." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever dropped my phone on my face while lying in bed." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever told someone 'you too' when they said 'happy birthday'." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever put milk in before the cereal." },
  { id: "", gameType: "never-have-i-ever", category: "funny", tier: "spicy", text: "Never have I ever been scared by my own reflection." },
  { id: "", gameType: "never-have-i-ever", category: "travel", tier: "spicy", text: "Never have I ever missed a flight." },
  { id: "", gameType: "never-have-i-ever", category: "travel", tier: "spicy", text: "Never have I ever been to more than 10 countries." },
  { id: "", gameType: "never-have-i-ever", category: "travel", tier: "spicy", text: "Never have I ever slept in an airport." },
  { id: "", gameType: "never-have-i-ever", category: "travel", tier: "spicy", text: "Never have I ever gotten lost in a foreign country." },
  { id: "", gameType: "never-have-i-ever", category: "travel", tier: "spicy", text: "Never have I ever eaten something abroad without knowing what it was." },
  { id: "", gameType: "never-have-i-ever", category: "food", tier: "spicy", text: "Never have I ever eaten something off the floor." },
  { id: "", gameType: "never-have-i-ever", category: "food", tier: "spicy", text: "Never have I ever burned food so badly the fire alarm went off." },
  { id: "", gameType: "never-have-i-ever", category: "food", tier: "spicy", text: "Never have I ever tried sushi." },
  { id: "", gameType: "never-have-i-ever", category: "food", tier: "spicy", text: "Never have I ever eaten an entire pizza by myself." },
  { id: "", gameType: "never-have-i-ever", category: "food", tier: "spicy", text: "Never have I ever cried over food." },
  { id: "", gameType: "never-have-i-ever", category: "work", tier: "spicy", text: "Never have I ever fallen asleep during a meeting." },
  { id: "", gameType: "never-have-i-ever", category: "work", tier: "spicy", text: "Never have I ever pretended my Wi-Fi was bad to leave a video call." },
  { id: "", gameType: "never-have-i-ever", category: "work", tier: "spicy", text: "Never have I ever sent an email to the wrong person." },
  { id: "", gameType: "never-have-i-ever", category: "work", tier: "spicy", text: "Never have I ever taken credit for someone else's idea." },
  { id: "", gameType: "never-have-i-ever", category: "work", tier: "spicy", text: "Never have I ever worked from home in my pyjamas." },
  { id: "", gameType: "never-have-i-ever", category: "work", tier: "spicy", text: "Never have I ever had a work crush." },
  { id: "", gameType: "never-have-i-ever", category: "friends", tier: "spicy", text: "Never have I ever lied to get out of plans with a friend." },
  { id: "", gameType: "never-have-i-ever", category: "friends", tier: "spicy", text: "Never have I ever talked behind a friend's back." },
  { id: "", gameType: "never-have-i-ever", category: "friends", tier: "spicy", text: "Never have I ever borrowed something and never returned it." },
  { id: "", gameType: "never-have-i-ever", category: "friends", tier: "spicy", text: "Never have I ever had a crush on a friend." },
  { id: "", gameType: "never-have-i-ever", category: "friends", tier: "spicy", text: "Never have I ever shared a friend's secret." },
  { id: "", gameType: "never-have-i-ever", category: "college", tier: "spicy", text: "Never have I ever pulled an all-nighter before an exam." },
  { id: "", gameType: "never-have-i-ever", category: "college", tier: "spicy", text: "Never have I ever slept through an exam or lecture." },
  { id: "", gameType: "never-have-i-ever", category: "college", tier: "spicy", text: "Never have I ever eaten instant noodles for three meals in a row." },
  { id: "", gameType: "never-have-i-ever", category: "college", tier: "spicy", text: "Never have I ever worn pyjamas to a lecture." },
  { id: "", gameType: "never-have-i-ever", category: "college", tier: "spicy", text: "Never have I ever handed in an assignment at the very last minute." },
  { id: "", gameType: "never-have-i-ever", category: "deep", tier: "spicy", text: "Never have I ever lied about my feelings to avoid conflict." },
  { id: "", gameType: "never-have-i-ever", category: "deep", tier: "spicy", text: "Never have I ever stayed in a relationship longer than I should have." },
  { id: "", gameType: "never-have-i-ever", category: "deep", tier: "spicy", text: "Never have I ever regretted not saying something to someone." },
  { id: "", gameType: "never-have-i-ever", category: "deep", tier: "spicy", text: "Never have I ever pretended to like something to impress someone." },
  { id: "", gameType: "never-have-i-ever", category: "deep", tier: "spicy", text: "Never have I ever cried at work or school." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever gone skinny dipping." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever been kicked out of a bar or club." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever done a walk of shame." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever played strip poker." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever woken up in a stranger's place." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever had a one-night stand." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever had a wardrobe malfunction in public." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever been caught in a lie by a partner." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever used a fake ID." },
  { id: "", gameType: "never-have-i-ever", category: "party", tier: "spicy", text: "Never have I ever had a friends-with-benefits situation." },
];

const NHIE_WILD: GameContentEntry[] = [
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever had a crush on a friend's partner." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever sent a risky text to the wrong person." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever had a walk of shame." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever lied about my body count." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever kissed someone within an hour of meeting them." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever dated two people at the same time." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever been in a love triangle." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever flirted my way out of a traffic ticket." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever been caught checking someone out." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever slid into a celebrity's DMs." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever had a secret relationship." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever called out the wrong name during sex." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever regretted a hookup." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever been caught sneaking out of someone's place." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever broken up with someone over text." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever gotten a piercing on a dare." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever been in a hot tub with strangers." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever had an embarrassing drunk text conversation." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever been escorted out of a venue." },
  { id: "", gameType: "never-have-i-ever", category: "wild", tier: "wild", text: "Never have I ever pretended not to see someone I know in public." },
];

const NHIE_AFTER_DARK: GameContentEntry[] = [
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever had a threesome." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever had sex in a public place." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever watched porn with a partner." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever used a sex toy." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever been to a strip club." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever had sex in a car." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever sent a nude photo." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever cheated on a partner." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever had a one-night stand with a coworker." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever made a sex tape." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever had a friends-with-benefits arrangement." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever hooked up with someone from work." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever had sex in a pool or hot tub." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever sexted a married person." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever been walked in on while having sex." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever had a pregnancy scare." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever explored same-sex relations." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever had sex with someone while others were nearby." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever used an adult webcam service." },
  { id: "", gameType: "never-have-i-ever", category: "after-dark", tier: "after-dark", text: "Never have I ever been to a sex party or swinger's club." },
];

// ──────────────────────────────────────────────
// HOT TAKES & MOST LIKELY TO
// ──────────────────────────────────────────────

const HOT_TAKES_SPICY: GameContentEntry[] = [
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Pineapple belongs on pizza." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Dogs are better than cats." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "The movie was better than the book." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Social media has done more harm than good." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Breakfast food is acceptable for dinner." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Cash is better than card." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Winter is better than summer." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "It's okay to end a friendship over politics." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Online dating is worse than meeting people in person." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Cilantro tastes like soap and ruins everything." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Multitasking isn't real — you're just doing multiple things badly." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "The office was better before Michael left." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Hot showers are better than cold ones." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "It's weird to bring your laptop to a coffee shop." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Marriage is outdated." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "People who use speakerphone in public are monsters." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "The original is always better than the remake." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "You should be able to bring your dog everywhere." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Ketchup doesn't belong on hot dogs." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Phone calls are better than text messages for serious conversations." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Reply guys are worse than lurkers." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "The friend zone doesn't exist." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Pineapple on pizza is a crime against humanity." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "You should be friends before dating." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Cinema is dying because of streaming." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "It's okay to ghost someone after one bad date." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Beer is an acquired taste that nobody actually likes." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Astrology is entertainment, not science." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "Working from home is better than the office." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "spicy", text: "The customer is NOT always right." },
];

const HOT_TAKES_WILD: GameContentEntry[] = [
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Monogamy is not natural." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Sex on the first date is fine." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "It's possible to love two people at the same time." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Porn has ruined modern relationships." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Age gaps in relationships don't matter after 25." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Casual hookups are emotionally damaging." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Checking your partner's phone is never okay." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "You can stay friends with an ex." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Long-distance relationships never work." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "It's okay to have a 'type' — we all do." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Couples should share their phone passcodes." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Talking about exes on a first date is a huge red flag." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Body count doesn't matter." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Open relationships are just breakups in slow motion." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "You should tell your partner if you have a crush on someone else." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Jealousy is a sign of love, not insecurity." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "It's okay to go through your partner's phone if you suspect cheating." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Couples who met on Tinder are less likely to last." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "Society puts too much pressure on marriage." },
  { id: "", gameType: "hot-takes", category: "hot-takes", tier: "wild", text: "It's better to be single than settle for someone okay." },
];

const MOST_LIKELY_TO_SPICY: GameContentEntry[] = [
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to become famous?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to end up on a reality TV show?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to marry for money?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to still live with their parents at 40?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to become a millionaire?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to get lost using GPS?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to die in a zombie apocalypse?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to adopt 10 cats?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to embarrass themselves on a first date?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to start a business that fails?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to cry during a commercial?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to become a conspiracy theorist?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to still be friends with their ex?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to forget their own birthday?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to become a hermit?" },
  { id: "", gameType: "most-likely-to", category: "funny", tier: "spicy", text: "Who is most likely to get a tattoo of something ridiculous?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to say something they regret while drunk?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to be the last one standing at a party?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to start a fight for no reason when drunk?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to cry when they're drunk?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to become a completely different person when drunk?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to drunk text their ex?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to lose their phone when drunk?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to be the happiest drunk?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to be the angry drunk?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to hook up with someone at a party?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to take their shirt off for no reason?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to make a move on their friend's ex?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to try to fight someone much bigger than them?" },
  { id: "", gameType: "most-likely-to", category: "drinking", tier: "spicy", text: "Who is most likely to confess their love to the wrong person?" },
];

const MOST_LIKELY_TO_WILD: GameContentEntry[] = [
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to hook up with someone in this room tonight?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to have the highest body count?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to send nudes to the wrong person?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to cheat on a partner?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to be a secret OnlyFans creator?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to get caught watching porn?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to have a threesome?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to be the kinkiest in bed?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to date two people at once successfully?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to have a secret dating profile?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to get caught by their partner?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to have a sex toy collection?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to be into BDSM?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to make a sex tape?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to get a genital piercing?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to have sex on the first date?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to have an affair with a coworker?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to join Tinder and regret it?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to fall in love with a stripper?" },
  { id: "", gameType: "most-likely-to", category: "wild", tier: "wild", text: "Who is most likely to have the wildest bachelor/bachelorette party?" },
];

// ──────────────────────────────────────────────
// WOULD YOU RATHER
// ──────────────────────────────────────────────

const WYR_SPICY: GameContentEntry[] = [
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather be able to fly or be invisible?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather always be 10 minutes late or always be 20 minutes early?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather have a rewind button or a pause button on your life?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather be the funniest person or the smartest person in the room?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather give up your phone or give up coffee?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather live without music or without television?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather have unlimited sushi for life or unlimited pizza for life?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather have a pet dinosaur or a pet dragon?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather be famous and poor or rich and unknown?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather lose the ability to read or lose the ability to speak?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather always have a song stuck in your head or always have an itch you can't scratch?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather be able to talk to animals or speak every language fluently?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather never have to sleep or never have to eat?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather live in the mountains or on the beach?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather be a superhero or a wizard?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather have the ability to read minds or the ability to see the future?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather wear the same outfit every day or have your outfit chosen by a friend every day?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather always be too hot or always be too cold?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather have a third arm or a third leg?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather live on a houseboat or in a treehouse?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather be able to teleport or be able to time travel?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather always speak your mind or never speak again?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather give up bathing for a month or give up the internet for a month?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather be able to fly but only 3 feet off the ground or run at 100mph but only in circles?" },
  { id: "", gameType: "would-you-rather", category: "funny", tier: "spicy", text: "Would you rather always have a head cold or always have a mild headache?" },
];

const WYR_WILD: GameContentEntry[] = [
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather have sex in a public place and get caught or never have sex in public again?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather have a threesome or never have sex again?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather only be allowed to do foreplay with your hands or only with your mouth?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather be on top or underneath?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather make love on a beach or in a jacuzzi?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather be dominated by your partner or dominate them?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather have sex with the lights on or off?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather give oral or receive it?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather have sex in the morning or at night?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather be tied up or tie someone up?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather date someone with a high sex drive or someone who is romantic?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather have sex with someone new every week or one person forever?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather have a one-night stand with a celebrity or a year-long relationship with an average person?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather have amazing sex for 3 minutes or okay sex for 30 minutes?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather date someone with piercings or with tattoos?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather be caught cheating or catch your partner cheating?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather date someone 20 years older or 10 years younger?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather have a partner who is jealous or a partner who doesn't care at all?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather date a virgin or someone with 50+ partners?" },
  { id: "", gameType: "would-you-rather", category: "wild", tier: "wild", text: "Would you rather have sex in a pool or in a forest?" },
];

const WYR_AFTER_DARK: GameContentEntry[] = [
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather have sex with your boss or your best friend's partner?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather never be able to climax or never be able to give someone else a climax?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather be unable to say no to sex or be unable to initiate sex?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather watch your partner have sex with someone else or have them watch you?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather be a sex slave for a month or wear a chastity device for a month?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather swallow or spit?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather be spanked or spank your partner?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather give a golden shower or receive one?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather have sex in a room full of people watching or have sex in a room that echoes loudly?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather be with someone who breathes heavily when turned on or someone who moans loudly?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather be with a partner who has a foot fetish or a diaper fetish?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather find out your partner slept with your parent in the past or your ex sleeps with your parent now?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather accidentally send nudes to your boss or your mother?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather give up sex for a year or give up masturbating for a year?" },
  { id: "", gameType: "would-you-rather", category: "after-dark", tier: "after-dark", text: "Would you rather have your parents catch you having sex or catch your parents having sex?" },
];

// ──────────────────────────────────────────────
// CONTENT POOL COMBINED
// ──────────────────────────────────────────────

function assignIds(entries: GameContentEntry[]): GameContentEntry[] {
  return entries.map((e) => ({ ...e, id: nextId(e.gameType) }));
}

/**
 * Full content database. Each entry has a unique ID,
 * game type, category, vibe tier, and text.
 */
export const CONTENT_POOL: GameContentEntry[] = assignIds([
  // Truth or Dare — Truths
  ...TRUTHS_SPICY,
  ...TRUTHS_WILD,
  ...TRUTHS_AFTER_DARK,
  // Truth or Dare — Dares
  ...DARES_SPICY,
  ...DARES_WILD,
  ...DARES_AFTER_DARK,
  // Never Have I Ever
  ...NHIE_SPICY,
  ...NHIE_WILD,
  ...NHIE_AFTER_DARK,
  // Hot Takes
  ...HOT_TAKES_SPICY,
  ...HOT_TAKES_WILD,
  // Most Likely To
  ...MOST_LIKELY_TO_SPICY,
  ...MOST_LIKELY_TO_WILD,
  // Would You Rather
  ...WYR_SPICY,
  ...WYR_WILD,
  ...WYR_AFTER_DARK,
]);

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

export function getContentByGameType(gameType: string): GameContentEntry[] {
  return CONTENT_POOL.filter((c) => c.gameType === gameType);
}

export function getContentByTier(tier: ContentTier): GameContentEntry[] {
  return CONTENT_POOL.filter((c) => c.tier === tier);
}

export function getContentForGameAndTier(
  gameType: string,
  tier: ContentTier
): GameContentEntry[] {
  return CONTENT_POOL.filter(
    (c) => c.gameType === gameType && c.tier === tier
  );
}

export function getContentByCategory(category: string): GameContentEntry[] {
  return CONTENT_POOL.filter((c) => c.category === category);
}

/**
 * Shuffle an array using Fisher-Yates.
 */
export function shuffleContent(entries: GameContentEntry[]): GameContentEntry[] {
  const arr = [...entries];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Get the total content count for the database stats.
 */
export function getContentStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const entry of CONTENT_POOL) {
    const key = entry.gameType;
    stats[key] = (stats[key] ?? 0) + 1;
  }
  return stats;
}

// ──────────────────────────────────────────────
// SUPABASE FETCHER (for production use)
// ──────────────────────────────────────────────

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type DbContentRow = Database["public"]["Tables"]["game_content"]["Row"];

/**
 * Fetch content from Supabase with language support.
 *
 * Returns the localized text: Mongolian if available, English as fallback.
 *
 * @param gameType - The game type to filter by
 * @param tier - Optional tier filter (spicy | wild | after-dark)
 * @param language - Language preference ("mn" | "en"). Defaults to "en".
 * @param category - Optional category filter
 */
export async function fetchContent(
  gameType: string,
  options?: {
    tier?: ContentTier;
    language?: "mn" | "en";
    category?: string;
  }
): Promise<GameContentEntry[]> {
  const supabase = createClient();
  const lang = options?.language ?? "en";

  let query = supabase
    .from("game_content")
    .select("*")
    .eq("game_type", gameType)
    .eq("is_active", true);

  if (options?.tier) {
    query = query.eq("tier", options.tier);
  }
  if (options?.category) {
    query = query.eq("category", options.category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch content:", error.message);
    return [];
  }

  return (data ?? []).map((row: DbContentRow) => ({
    id: row.id,
    gameType: row.game_type,
    category: row.category,
    tier: row.tier as ContentTier,
    text: lang === "mn" && row.text_mn ? row.text_mn : row.text_en,
    extra: row.extra as Record<string, string> | undefined,
  }));
}

/**
 * Fetch a random subset of content for a game + tier.
 * The DB returns all matching rows; shuffle and limit client-side.
 */
export async function fetchRandomContent(
  gameType: string,
  count: number,
  options?: {
    tier?: ContentTier;
    language?: "mn" | "en";
    category?: string;
  }
): Promise<GameContentEntry[]> {
  const entries = await fetchContent(gameType, options);
  return shuffleContent(entries).slice(0, count);
}
